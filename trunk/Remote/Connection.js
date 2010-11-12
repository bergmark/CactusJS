/*
 * Copyright (c) 2007, Adam Bergmark
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
 * Abstract class for implementing the state pattern for XHR requests.
 * Subclasses represent different connection states.
 */
Cactus.Remote.Connection = (function () {
    var EventSubscription = Cactus.Util.EventSubscription;
    var log = Cactus.Dev.log;

    function Connection () {
        throw new Error("Cannot instantiate Connection");
    } Connection.STATE = {
        UNINITIALIZED : 0,
        LOADING : 1,
        LOADED : 2,
        INTERACTIVE : 3,
        COMPLETE : 4
    }; Connection.prototype = {
        // Events.
        /**
         * Called when the readystate of the XHR object changes.
         */
        onReadyStateChanged : Function.empty,

        /**
         * @type Hash
         *   Request headers that should be sent along with the request.x
         */
        requestHeaders : {},
        /**
         * @type XMLHttpRequest
         *   The used XHR object.
         */
        connection : null,
        /**
         * @type state
         *   The current state of the connection. Compare the value with values
         *   in Connection.STATE.
         */
        readyState : Connection.STATE.UNINITIALIZED,
        /**
         * Adds headers for the request. Subclasses active before the request is
         * made should override this.
         *
         * @param string header
         * @param string value
         */
        setRequestHeader : function (header, value) {
            throw new Error ("Can't set request header in this state, reset() first.");
        },

        /**
         * Method for starting a request, if the subclass should be able to
         * handle new requests this method should be overridden.
         *
         * @param string URL
         * @param string method
         *   HTTP request methods, GET/POST/PUT/DELETE.
         */
        request : function (URL, method, body) {
            throw new Error ("Can't request in this state, reset() first.");
        },
        /**
         * Called when connection triggers onreadystatechange.
         */
        readyStateChanged : function () {
            this.readyState = this.connection.readyState;
            this.onReadyStateChanged();
        },
        /**
         * @abstract
         *
         * Returns the next state of the connection.
         */
        getNextState : function () {
            throw new Error ("Not implemented");
        },
        /**
         * @return state
         *   The current state of the connection.
         */
        getReadyState : function () {
            return this.readyState;
        },
        /**
         * @return
         *   The XHR object's status text.
         */
        getStatusText : function () {
            return this.connection.statusText;
        },
        /**
         * @return int
         *   The HTTP status.
         */
        getStatus : function () {
            return this.connection.status;
        },
        /**
         * @return string
         *   The data retrieved by a request.
         */
        getResponseText : function () {
            return this.connection.responseText;
        },
        /**
         * @abstract
         *
         * Aborts the current connection, to be overridden by subclasses.
         */
        abort : function () {
            throw new Error ("Not implemented");
        }
    };

    EventSubscription.implement (Connection);

    return Connection;
})();
