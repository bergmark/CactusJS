/*
 * Copyright (c) 2007-2008, Adam Bergmark
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Cactus JS nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY Adam Bergmark ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL Adam Bergmark BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file
 *
 * Terminology
 * CRUD = Create/Read/Update/Delete -- Generic operations on objects.
 *
 * Handles server side requests for hierarchies of ActiveRecord objects.
 *
 * Requests are sent using JSON.
 *
 * The requests are action based, meaning a list of actions (tasks) is passed
 * to the server side. Actions might include CRUD or more specific requests
 * such as "disable user account". Which actions should exist is up to the
 * client using this class and both the client and server side are dependant
 * upon this.
 *
 * PersistanceManager utilizes the fact that new ActiveRecord objects have
 * negative ID's and expects the server side to replace all negative ID's with
 * positive ones upon each request. PersistanceManager then updates the
 * associated objects when the reply is received.
 *
 * There are differenct action methods available and the request sent to the
 * server side will look differently depending on the method chosen.
 * The methods are "find", "update" and "perform".
 *
 * | NAME   | ARGUMENT | RETURNED OBJECT | NOTES
 * | -----------------------------------------------------------------
 * | find    | id       | hash           | A new object will be created.
 * | update  | hash     | hash           | An existing object is updated.
 * | perform | id       | hash           | An existing object is updated.
 *
 * An example of the basic format of a request that the server side can expect:
 * Array[{
 *   id : int,
 *   type : string,
 *   argument : {
 *     id : int, // The id of the object we're manipulating.
 *     // Optionally other properties...
 *   }
 * }, {
 *   id : int,
 *   type : string,
 *   argument : int
 * }]
 *
 * The response from the server side to the client always looks like this:
 * Array[{
 *   id : int,
 *   type : string,
 *   returnedObject : {
 *     id : int, // The id of the object we're manipulating.
 *     // Optionally other properties...
 *   }
 * }]
 *
 */
Cactus.Remote.PersistanceManager = (function () {
    var log = Cactus.Dev.log;
    var YUIConn = Cactus.Remote.YUIConn;
    var JSON = Cactus.Util.JSON;
    var Collection = Cactus.Util.Collection;
    var ActiveRecord = Cactus.MVC.Model.ActiveRecord;

    /**
     * Forced as private since breaking encapsulation at this point is very
     * dangerous.
     *
     * @type positive
     */
    var id = 1;

    function Action(type, object, method) {
        this.id = ++id;
        this.type = type;
        this.object = object;
        if (method) {
            this.method = method;
        }
    } Action.prototype = {
        type : null,
        id : null,
        getId : function () {
            return this.id;
        },
        object : null,
        getObject : function () {
            return this.object;
        },
        method : "update",
        getMethod : function () {
            return this.method;
        },
        /**
         * Never converts to a string.
         */
        serialize : function () {
            var argument;
            switch(this.method) {
            case "update":
                argument = this.object.serialize();
                break;
            case "find":
                argument = this.object.id;
                break;
            case "perform":
                argument = this.object.id;
                break;
            }
            return {
                id : this.id,
                type : this.type,
                argument : argument
            };
        }
    };


    /**
     * @param string url
     *   The URL requests should be passed to, a single URL is used for all
     *   actions.
     * @param optional Map<string,string> actionMethods = {}
     *   Maps action types to action methods, used to specify which method
     *   to use for the types. The types are "find", "update", and "perform".
     */
    function PersistanceManager(url, actionMethods) {
        this.actionMethods = actionMethods || {};
        this.url = url;
        this.actions = [];
        this.committedActions = [];
        this.actionObjects = {};
    } PersistanceManager.prototype = {
        /**
         * @type Map<string,string>
         */
        actionMethods : null,
        /**
         * @type string
         */
        url : "",
        /**
         * Stores all added and uncommitted actions.
         *
         * @type Array
         */
        actions : null,
        /**
         * Stores all committed actions waiting for responses.
         *
         * @type Array
         */
        committedActions : null,
        /**
         * Stores objects associated with actions, they are kept until the
         * action is completed.
         *
         * @type Map
         */
        actionObjects : null,
        /**
         * Adds an action to be committed, but only stores it until commit is
         * called.
         *
         * @param string actionType
         *   Dependant on the Server Side implementation.
         *   Typical values might be "save" or "delete".
         * @param Serializable object
         *   The object the action is taken on.
         *   For find requests, this object should be a
         *   Hash{ id : integer, Constructor : ActiveRecord }
         */
        addAction : function (actionType, object) {
            if (actionType in this.actionMethods) {
                this.actions.push(new Action(actionType,
                                             object,
                                             this.actionMethods[actionType]));
            } else {
                throw new Error("PersistanceManager:addAction: Undefined action type: " + actionType);
            }
        },
        _removeAction : function (action) {
            Array.remove(this.actions, action);
        },
        _getAction : function (id) {
            for (var i = 0; i < this.committedActions.length; i++) {
                if (this.committedActions[i].getId() === id) {
                    return this.committedActions[i];
                }
            }
            throw new Error(
                "PersistanceManager:_getAction: Could not find action.");
        },
        /**
         * Sends an asynchronous request containing all actions added so far.
         *
         * @param optional Hash options {
         *   optional Function success
         *   optional Function failure
         * }
         */
        commit : function (options) {
            options = options || {};
            var success = options.success || Function.empty;
            var failure = options.failure || Function.empty;
            var process = this._process.bind(this);

            if (!this.actions.length) {
                setTimeout(success, 0);
                return;
            }

            var data = [];
            for (var i = 0; i < this.actions.length; i++) {
                data.push(this.actions[i].serialize());
                this.committedActions.push(this.actions[i]);
            }
            this.actions = [];
            data = JSON.stringify(data);
            YUIConn.asyncRequest("POST", this.url, {
                success : function (response) {
                    process(JSON.parse(response.responseText),
                            success, failure);
                },
                failure : failure
            }, "json=" + data);
        },
        /**
         * Handles the response given by the server side after a commit.
         * Updates the ID's of objects involved in the actions, and marks
         * the given action objects as completed.
         *
         * @param Hash data
         */
        _process : function (actionResponses, success, failure) {
            var successful = true;
            for (var p in actionResponses) {
                var action = this._getAction(actionResponses[p].id);
                var response = actionResponses[p];
                this._removeAction(action);

                if (!response.wasSuccessful) {
                    successful = false;
                    continue;
                }

                var object;
                switch (action.getMethod()) {
                case "find":
                    var Constructor = action.getObject().Constructor;
                    object = new Constructor();
                    break;
                case "update":
                case "perform":
                    object = action.getObject();
                    if (object.isNew()) {
                        object.setValue("id", response.returnedObject.id);
                    }
                    delete response.returnedObject.id;
                    break;
                }
                object.inject(response.returnedObject);
            }

            if (successful) {
                success();
            } else {
                failure();
            }
        }
    };

    PersistanceManager.Action = Action;

    return PersistanceManager;
})();
