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
 * A KeyValueCoding interface implementation.
 *
 *
 * KeyValueCoding  (KVC)  is  a   way  for  accessing  values  in  nested
 * hierarchies of objects. Its main purpose is to simplify the writing of
 * views for displaying model data.
 *
 * Say we have an object hierarchy that looks like this:
 *
 * var person = {
 *   name : {
 *     first : "Adam",
 *     last : "Bergmark"
 *   },
 *
 *   nationality : "Swedish"
 * };
 *
 * We  can make  this object  (and it's  compounds) into  KVC  by calling
 * `KVC.addToInstance(person);`,  we  could  also have  instantiated  the
 * object as KVC  by using `var person  = new KVC();`. A third  way is to
 * create   a  new   class  and   having  it   implement   the  interface
 * (`KVC.implement(Class)`).
 *
 * After  this has  been done,  we  can access  values of  the object  by
 * calling  the  getValue   method  on  person  with  a   Key  Path  (KP)
 * representing the path to traverse. For example, if we want to retrieve
 * the person's first name, instead of typing `person.name.first` we type
 * `person.getValue("name.first")`.  So  far it's not  very helpful since
 * the only  difference is that we write  more code, but if  we take into
 * account  that all  properties should  be considered  private,  the KVC
 * alternative     starts    to     look    a     little     better    in
 * comparison.     `person.name.first`    would     then     turn    into
 * `person.getName().getFirst()`   while  the   KVC   call  remains   the
 * same. See,  getValue automatically looks for accessors  when getting a
 * value, so  to retrieve the  name object of  the person it  would first
 * check for  the existance of  `getPerson` and other variations  of this
 * (namely,  isPerson, since  it might  be  a boolean  accessors) and  if
 * neither  exists  it  finally  tries  accessing  the  property  without
 * accessors  (note  that  it  hasn't  been decided  if  direct  property
 * accessing should be allowed by  default.) So if we define an accessor,
 * say:
 * `person.name.getFirst =  function () { return this.first.reverse() };`
 *  the reversed name would be returned from
 * `person.getValue("name.first")`.
 *
 * `setValue` works in much the same way.
 *
 */
Cactus.Util.KeyValueCoding = (function () {
    var EventSubscription = Cactus.Util.EventSubscription;
    var log = Cactus.Dev.log;

    function KeyValueCoding () {
        EventSubscription.addToInstance (this);
    } KeyValueCoding.prototype = {
        /**
         * @type Hash<KeyPath,KeyPath>
         *
         * Each key of the hash is a key path corresponding to an atomic
         * property of the KVC object. The value under that key is an array of
         * the name of compound properties depending on this atomic property.
         *
         * For instance, there might be a fullName property (the compound)
         * consisting of a firstName and a lastName, this would be represented
         * as `{ firstName : ["fullName"], lastName : ["fullName"] }`.
         *
         * Keep in mind that firstName, lastName and fullName are
         * "properties" directly under the KVC object.
         *
         * So, in practice the previous setup would mean that any time firstName
         * or lastName changes (so that `onValueChanged` is triggered for either
         * of them) there would also be an `onValueChanged` triggered for
         * fullName.
         *
         * This property is commented out since KVC overwrites all properties.
         * It remains here only for documentation purposes.
         */
        // _compounds : {},

        /**
         * @param string keyPath
         */
        onValueChanged : Function.empty,

        /**
         * Gets the value of a key path. The path is traversed.
         *
         * @param string *keyPath
         *   The key path to traverse.
         *   If several arguments are specified, they are concatenated together
         *   with . to form a single key path.
         * @return mixed
         *   The value at the specified key path.
         * @throws Error
         *   If a key path doesn't exist, which means no accessors are defined
         *   and the property is undefined, or if the keyPath name is reserved.
         */
        getValue : function (keyPath) {
            if (keyPath === "value") {
                throw new Error("value is a reserved property name.");
            }
            keyPath = Array.prototype.join.call(arguments, ".");

            var keys = keyPath.split(".");
            var key = keys.shift();
            var value;
            if ("get" + key.capitalize() in this) {
                value = this ["get" + key.capitalize()]();
            } else if (this["is" + key.capitalize()] instanceof Function) {
                // Check existance with instanceof Function since there might
                // be a property named isX (and not a method). This is hardly
                // ever useful in practise but can help debugging.

                value = this ["is" + key.capitalize()]();
            } else if (key in this) {
                value = this [key];
            } else {
                throw new Error ("Object not KVC compliant for key: " + key);
            }

            if (keys.length) {
                return value.getValue (keys.join ("."));
            }
            return value;
        },
        /**
         * Sets the value of a predefined key path.
         *
         * @param string keyPath
         *   The key path to set the value for.
         * @param mixed value
         *   The value to set. If this value is an Object it should already be a
         *   KVC instance.
         * @throws Error
         *   If an undefined key path is specified, or if the keyPath name is
         *   reserved.
         */
        setValue : function (keyPath, value) {
            if (keyPath === "value") {
                throw new Error ("value is a reserved property name.");
            }

            var previousValue = this.getValue(keyPath);

            var keys = keyPath.split(".");
            var key = keys.shift();
            var setterExists = false;

            // If we're not at the leaf of the keyPath.
            if (keys.length) {
                this.getValue (key).setValue (keys.join ("."), value);
                return;
            } else if ("set" + key.capitalize() in this) {
                setterExists = true;
                this ["set" + key.capitalize()] (value);
            } else if (!(key in this)) {
                throw new Error ("Object not KVC compliant for key: " + key);
            }

            if (!setterExists) {
                this[key] = value;
            }

            // Only trigger events if value actually changed.
            if (previousValue !== this.getValue(keyPath)) {
                this.onValueChanged(keyPath);
                this._triggerCompounds(keyPath);
            }

            if (KeyValueCoding.implementsInterface(value)) {
                if (!this.__keyPathSubscriptions) {
                    this.__keyPathSubscriptions = {};
                }
                if (keyPath in this.__keyPathSubscriptions) {
                    var o = this.__keyPathSubscriptions[keyPath];
                    o.object.removeSubscriber(o.id, "ValueChanged");
                }
                var that = this;
                this.__keyPathSubscriptions[keyPath] = {
                    id : value.subscribe("ValueChanged", function (_, kp) {
                        that.onValueChanged(keyPath + "." + kp);
                        that._triggerCompounds(keyPath + "." + kp);
                    }),
                    object : value
                };
            }
        },
        /**
         * Triggers onchanges for all key paths having the specified key path
         * as a compound.
         *
         * @param string keyPath
         */
        _triggerCompounds : function (keyPath) {
            this._compounds = this._compounds || {};
            if (!(keyPath in this._compounds)) {
                return;
            }

            var compounds = this._compounds[keyPath];
            for (var i = 0; i < compounds.length; i++) {
                this.onValueChanged(compounds[i]);
            }
        },
        /**
         * Checks whether a key path is defined.
         *
         * @param string keyPath
         *   The key path to look for.
         * @return boolean
         *   Whether the key path is defined.
         */
        hasKeyPath : function (keyPath) {
            if (keyPath === "value") {
                throw new Error ("value is a reserved property name.");
            }

            var keys = keyPath.split(".");
            var key = keys.shift();

            // If we're not at the leaf of the keyPath.
            if (keys.length) {
                var nextObject;
                try {
                    nextObject = this.getValue (key);
                } catch (e) {
                    return false;
                }

                if (! (typeof nextObject === "object" &&
                       ("hasKeyPath" in nextObject))) {
                    return false;
                }
                return nextObject.hasKeyPath (keys.join("."));

            } else if ("get" + key.capitalize() in this) {
                return true;
            } else if (key in this) {
                return true;
            } else {
                return false;
            }
        }
    };
    /**
     * Implements the KVC interface on a class.
     *
     * @param constructor constructor
     *   The constructor of the class to implement KVC on.
     */
    KeyValueCoding.implement = function (constructor) {
        EventSubscription.implement (constructor);
        for (var p in KeyValueCoding.prototype) {
            constructor.prototype [p] = KeyValueCoding.prototype [p];
        }
    };
    /**
     * Adds the KVC interface to a single Object.
     * Also recursively turns any inner objects into KVC's.
     *
     * @param Object instance
     *   The instance to add KVC to.
     */
    KeyValueCoding.addToInstance = function (instance) {
        for (var p in instance) if (instance.hasOwnProperty (p)
                                    && (instance[p] instanceof Object)
                                    && !(instance[p] instanceof Function)
                                    && !(instance[p] instanceof KeyValueCoding)) {
            KeyValueCoding.addToInstance (instance[p]);
        }
        EventSubscription.addToInstance (instance);
        for (var p in KeyValueCoding.prototype) {
            instance[p] = KeyValueCoding.prototype[p];
        }
    }

    /**
     * @param Object instance
     * @return bool
     *   Whether the instance implements the KVC interface.
     */
    KeyValueCoding.implementsInterface = function (instance) {
        if (!instance || typeof instance !== "object") {
            return false;
        }
        if ("getValue" in instance && "setValue" in instance) {
            return true;
        }
        return false;
    };

    return KeyValueCoding;
})();
