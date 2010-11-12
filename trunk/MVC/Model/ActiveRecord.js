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
 * ActiveRecord is a KVC interface implementing serialization.
 *
 * ActiveRecord models entities, use ValueObject to model value objects.
 *
 * A new object is assigned a unique negative ID (unique among all ActiveRecord
 * instances). This negative ID is replaced once the object has been saved.
 * The replacement is done by a client responsible for sending server side
 * requests (PersistanceManager in the standard case, but there is no
 * dependency on this class). The negative ID's are saved so that fetching
 * objects based on them is still possible.
 *
 * Each AR class has its own Identity Map, meaning a global point of access
 * to all objects is available, this should of course not be abused, so choose
 * which modules/classes may reference the constructor directly.
 *
 * As of now, a subclass' Identity Map has no relation to the superclass'.
 * This causes problems when an object needs to be fetched and the exact type
 * is unknown. This will be handled in a future revision, but for now you will
 * have to figure out which concrete subclass to query for the object, or loop
 * through them all and try to find them.
 *
 * All persistance issues can be handled by PersistanceManager, and should be
 * handled at a central location along with all other objects.
 *
 * Subclass constructors receive a method named `load` when addStaticMethods
 * is called, load takes an array of serialized objects and instantiates the
 * objects. A controller may be responsible for setting up all objects by
 * calling load.
 *
 * AR uses shallow serialization, meaning the serialization won't contain
 * compound aggregates, but merely their id. Any other parties receiving the
 * serialized objects need to be aware of this fact. Also take care to serialize
 * all necessary aggregates as well, so that a complete object hierarchy can be
 * sent. Right now there is no facility that can serialize a minimal amount of
 * objects given a root, but this will be acommodated in the future.
 *
 * Subclassing notes:
 *
 * To subclass you will need to call the super constructor upon object
 * instantiation. It's also necessary to call the addStaticMethods method on
 * ActiveRecord. Here's an example:
 *
 *   function SubClass() {
 *       ActiveRecord.call(this);
 *   } SubClass.prototype = {
 *   };
 *   SubClass.extend(ActiveRecord);
 *   ActiveRecord.addStaticMethods(SubClass);
 *
 * If subclass instances have compound aggregates you will need to override
 * _aggregates in order to define these.
 * Previously inject was supposed to be overriden for this, but this is now
 * deprecated, meaning _injectAC and _injectAggregate are also deprecated.
 *
 * Following Cactus conventions, all properties of subclass instances should be
 * defined in the prototype, but in AR's case this only applies to atomic
 * values. Compound values do not need to be defined here since _aggregates
 * handles this and also provides satisfactory documentation of types.
 *
 * There is an errors property that can contain error messages. It's primary
 * purpose is in connection with the PersistanceManager where it can be
 * used to store errors that occured on the server side.
 *
 * = Dynamic Class Generation =
 * ActiveRecord.create can be used to dynamically create classes. This
 * is done by passing the desired properties as an argument.
 *
 * In this mode, AR behaves a little differently, accessors are
 * automatically generated, so for every property x, getX and setX
 * methods are created. For aggregate AR objects, setXId and getXId are
 * also created.
 *
 * Serialization and deserialization into JSON also changes, AR
 * aggregate properties are suffixed with Id in this form.
 */
Cactus.MVC.Model.ActiveRecord = (function () {
    var log = Cactus.Dev.log;
    var JSON = Cactus.Util.JSON;
    var EventSubscription = Cactus.Util.EventSubscription;
    var KVC = Cactus.Util.KeyValueCoding;
    var YUIConn = Cactus.Remote.YUIConn;
    var IdentityMap = Cactus.MVC.Model.IdentityMap;
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var Serializable = Cactus.Util.Serializable;
    var Options = Cactus.Util.Options;

    var idCounter = 0;
    function getNewId() {
        idCounter--;
        return idCounter;
    }

    function ActiveRecord () {
        this.id = getNewId();
        this.__getIdentityMap().add(this.id, this);
        this.errors = new ArrayController();
    } ActiveRecord.prototype = {
        /**
         * @type IdentityMap
         *   Holds the ID map for the class.
         */
        identityMap : null,
        /**
         * @static
         * @return IdentityMap
         */
        __getIdentityMap : function () {
            return this.identityMap;
        },
        /**
         * Creates a new ID map for this class, this method is called by
         * addStaticMethods.
         *
         * @static
         */
        __createIdentityMap : function () {
            this.identityMap = new IdentityMap();
        },
        /**
         * @type boolean
         *   Whether all of the object's data is saved.
         */
        _saved : false,
        /**
         * Sets the saved status of the object.
         *
         * @param boolean saved
         */
        setSaved : function (saved) {
            this._saved = !!saved;
        },
        /**
         * @type boolean
         *   Whether the abject hasn't been stored on the server side.
         */
        _isNew : true,
        /**
         * @param boolean isNew
         */
        setNew : function (isNew) {
            this._isNew = isNew;
        },
        /**
         * @return boolean
         */
        isNew : function () {
            return this._isNew;
        },
        /**
         * @type ArrayController<string>
         */
        errors : null,
        /**
         * @return ArrayController<string>
         */
        getErrors : function () {
            return this.errors;
        },
        /**
         * @param string message
         */
        _addError : function (message) {
            this.errors.add(message);
        },
        /**
         * @return boolean
         */
        hasErrors : function () {
            return this.errors.count() !== 0;
        },
        /**
         * Sets the ID of the instance.
         *
         * @param positive value
         */
        setId : function (value) {
            if (typeof value !== "number" || parseInt(value) !== value)  {
                throw new Error("ActiveRecord:setId: id is not an integer.");
            }
            if (value < 1) {
                throw new Error("ActiveRecord:setId: id is not positive.");
            }

            var id = this.getId();

            // id cannot be changed after it's set to a positive value.
            if (id !== null && id >= 0) {
                throw new Error("ActiveRecord:setId: id is already set.");
            }
            var idMap = this.__getIdentityMap();

            if (idMap.has(value)) {
                throw new Error(
                    "ActiveRecord:setId: "
                        + "There already exists an object with id=" + value);
            }
            idMap.add(value, this);
            this.id = value;
            this.setNew(false);
        },
        /**
         * @return string
         *   The ID of the object, or null if the object hasn't been assigned
         *   one yet.
         */
        getId : function () {
            return this.id || null;
        },
        /**
         * Serializes the instance.
         * Properties prefixed with an underscore are skipped, as are
         * functions since there is no appropriate way of serializing them.
         *
         * @param optional boolean deep = false
         *   If true, aggregates are serialized into full json, if not any
         *   entities are replaced with their ID's.
         * @return Hash/string
         */
        serialize : function (deep) {
            deep = !!deep;
            var o = {};
            for (var p in this) {
                if (/^_/.test(p)) {
                    continue;
                }
                if (p === "errors") {
                    continue;
                }

                var value;
                value = this[p];

                if (Serializable.implementsInterface(value)) {
                    if (deep || !(value instanceof ActiveRecord)) {
                        o[p] = value.serialize(deep);
                    } else {
                        if (this.__generated) {
                            o[p + "Id"] = value.getId();
                        } else {
                            o[p] = value.getId();
                        }
                        if (o[p] === null) {
                            throw new Error(("Cannot serialize AR object with"
                              + " uninitialized aggregate %s. Did you forget to"
                              + " call ActiveRecord in your constructor?")
                              .format(p));
                        }
                    }
                }
                // Exclude other compound objects, and functions.
                else if (typeof value === "object" || typeof value === "function") {
                    continue;
                }
                else {
                    o[p] = value;
                }
            }
            return o;
        },
        /**
         * Takes a stringified JSON hash or a Hash, and inserts the data into
         * the object. inject does not work with AR aggregates at the moment.
         *
         * Compound aggregates defined in _aggregates are also injected with
         * the specified types.
         *
         * @param Hash hash
         */
        inject : function (hash) {
            this._injectAC(hash, "errors");
            var getObj = function (aggregateName, serializedObj) {
                var settings = this._aggregates[aggregateName];
                function constructorFromSettings(settings) {
                    return settings.constructor || settings.namespace[settings.className];
                }
                var constructor = constructorFromSettings(settings);
                // If the value is an id, the constructor is an AR
                // constructor.
                if (typeof serializedObj === "number") {
                    return constructor.get(serializedObj);
                } else {
                    object = new constructor();
                    object.inject(serializedObj);
                    return object;
                }
            }.bind(this);
            if (!hash || typeof hash !== "object") {
                throw new Error(
                    "ActiveRecord:inject: expected hash, but got " + hash);
            }

            var data = hash;

            for (var p in data) if (data.hasOwnProperty(p)) {
                var v = data[p];
                if (/^(.+)Id$/.test(p)) {
                    p = RegExp.$1;
                }
                if ("id" === p) {
                    this.setValue("id", v);
                } else if (p in this.__getAggregates()) {
                    var settings = this._aggregates[p];
                    var get = getObj.curry(p);
                    if (settings.oneToMany) {
                        var serializedObjs = v;

                        if (!(serializedObjs instanceof Array)) {
                            throw new Error(
                                "ActiveRecord:inject: expected Array of id's for property %s, but got %s."
                                .format(p, serializedObjs));
                        }

                        var ac = this.getValue(p);
                        ac.clear();
                        for (var i = 0; i < serializedObjs.length; i++) {
                            ac.add(get(serializedObjs[i]));
                        }
                    } else {
                        this.setValue(p, get(v));
                    }
                } else {
                    this.setValue(p, data[p]);
                }
            }
        },
        /**
         * A helper for deserializing aggregate ActiveRecord objects.
         * Creates objects of the aggregate's type and injects them with their
         * data.
         * This method may only be called by inject overrides.
         *
         * The property in the hash is deleted after the operation in order to
         * seamlessly allow a call to ActiveRecord:inject afterwards.
         *
         * If an ID is passed to instead of the full
         * object, get should be used to retrieve the objects. It is assumed
         * that the objects referenced are already loaded.
         * This behavior is used when the AR object isn't an aggregate root.
         *
         * Example call: this._injectAC(hash, "authors", Author);
         *
         * @param Hash hash
         *   The object passed to inject for deserialization.
         * @param string property
         *   The property of the hash containing the data, as well as
         *   the property on the AR object containing the AC.
         * @param constructor constructor
         *   The type of the AR aggregates.
         */
        _injectAC : function (hash, property, constructor) {
            if (!hash[property]) {
                return;
            }

            this[property].clear();

            for (var i = 0; i < hash[property].length; i++) {
                var v = hash[property][i];
                var obj;
                if (!constructor) {
                    obj = v;
                } else if (typeof v === "number") {
                    obj = constructor.get(v);
                } else {
                    obj = new constructor();
                    obj.inject(v);
                }
                this[property].add(obj);
            }
            delete hash[property];
        },
        /**
         * A helper for deserializing aggregate ActiveRecords or ValueObjects.
         * Works like _injectAC but is used for one-to-one relationships.
         *
         * @param Hash hash
         *   The object passed to inject for deserialization.
         * @param string property
         *   The property of the hash containing the data, as well as
         *   the property on the AR object that will hold the object.
         * @param constructor constructor
         *   The type of the aggregate.
         */
        _injectAggregate : function (hash, property, constructor) {
            if (!hash[property]) {
                return;
            }

            var obj;
            if (typeof hash[property] === "number") {
                obj = constructor.get(hash[property]);
            } else {
                obj = new constructor();
                obj.inject(hash[property]);
            }
            this[property] = obj;
            delete hash[property];
        },
        /**
         * Changing the value of any property toggles the saved state.
         *
         * @return boolean
         *   Whether the object contains only saved data.
         */
        saved : function () {
            return this._saved;
        },
        /**
         * Override for KVC:setValue in order to toggle `saved`.
         *
         * @param string keyPath
         * @param mixed value
         */
        setValue : function (keyPath, value) {
            var oldValue = this.getValue(keyPath);
            KVC.prototype.setValue.call(this, keyPath, value);
            // Retrieve from getValue since a custom getter may exist.
            var newValue = this.getValue(keyPath);
            if (oldValue !== newValue) {
                this._saved = false;
            }
        },
        /**
         * Fetches all objects in memory, even if they haven't been saved on
         * the server side.
         * If the object has both a negative and positive id in the map the
         * object will only exist once in the array.
         *
         * @static
         * @return Array
         *   All objects in memory.
         */
        getLoaded : function () {
            return Array.unique(this.__getIdentityMap().getAll());
        },
        /**
         * Fetches an object that is loaded into memory, only use this when you
         * know this is the case. If a remote request might be necessary,
         * another objects such as a PersistanceManager, must be used to
         * make an asynchronous call.
         *
         * @static
         * @param int id
         * @return ActiveRecord
         */
        get : function (id) {
            if (!this.__getIdentityMap().has(id)) {
                throw new Error("No object with id=%s found in memory."
                                .format(id));
            }
            return this.__getIdentityMap().get(id);
        },
        /**
         * Removes an object from the identity map. Note that other objects
         * may still have references to the object even after this.
         *
         * @param ActiveRecord object
         */
        remove : function (object) {
            this.__getIdentityMap().remove(object);
        },
        /**
         * Deserializes all given hashes.
         * Useful in the setup code for an application.
         *
         * @static
         * @param Array<Hash> hashes
         *   Serialized ActiveRecord objects of the AR subclass' type.
         */
        load : function (hashes) {
            for (var i = 0; i < hashes.length; i++) {
                var obj = new this.constructor();
                obj.inject(hashes[i]);

                var aggregates = this.__getAggregates();
                for (var p in aggregates) {
                    var settings = aggregates[p];
                    if (!settings.allowNull &&
                        !(obj.getValue(p) instanceof settings.constructor)) {
                        throw new Error(
                            "Property not correctly set: %s, value was: %s"
                            .format(p, obj.getValue(p)));
                    }
                }
            }
        },
        /**
         * @type Map<string aggregateName, Hash{
         *         constructor : ValueObject/ActiveRecord,
         *         optional oneToMany : bool = false,
         *         optional allowNull : bool = false
         *     }
         * > aggregates
         *
         * Stores information about compound objects class' instances may keep
         * references to. All ValueObject/ActiveRecord aggregates should be
         * defined in subclasses by overriding this property.
         *
         * If oneToMany == true then allowNull is set to false.
         */
        _aggregates : null,
        /**
         * @return Map
         *   The data specified in _aggregates.
         */
        __getAggregates : function () {
            if (this._aggregates) {
                return this._aggregates;
            } else {
                return {};
            }
        },
        /**
         * Called by addStaticMethods. Sets up specified aggregate properties
         * in order to allow functional KVC.
         */
        __defineAggregates : function () {
            for (var propertyName in this._aggregates) {
                var settings = this._aggregates[propertyName];
                settings.oneToMany = !!settings.oneToMany;
                settings.allowNull = !!settings.allowNull;
                if (settings.oneToMany) {
                    settings.allowNull = true;
                }

                if (settings.oneToMany) {
                    this[propertyName] = new ArrayController();
                } else {
                    this[propertyName] = null;
                }
            }
        }
    };

    /**
     * @param Constructor constructor
     *   The constructor of an ActiveRecord subclass.
     */
    ActiveRecord.addStaticMethods = function (constructor) {
        // Allows the client to call addStaticMethods explicitly to support
        // older revisions.
        if (constructor.get) {
            return;
        }

        var proto = constructor.prototype;

        proto.__createIdentityMap();
        var idMap = proto.__getIdentityMap();

        // Add static events to the prototype, and make proxy methods on the
        // constructor itself.
        idMap.subscribe("Added", proto);
        proto.onAddedTriggered = function (idMap, key, obj) {
            this.onLoaded(key, obj);
        };
        proto.onLoaded = Function.empty;
        constructor.subscribe = proto.subscribe.bind(proto);
        constructor.removeSubscriber = proto.removeSubscriber.bind(proto);
        constructor.getLoaded = proto.getLoaded.bind(proto);
        constructor.get = proto.get.bind(proto);
        constructor.load = proto.load.bind(proto);
        constructor.remove = proto.remove.bind(proto);

        proto.__defineAggregates();
    };

    ActiveRecord.__onExtend = ActiveRecord.addStaticMethods.bind(ActiveRecord);

    /**
     * @param Hash definition
     *   Each property should be a desired property of the class, at the moment
     *   the value of the property is not used, so null can be supplied.
     * @param Map<string className, Function class> namespace
     *   An object containing all classes, if a className is provided the new
     *   class will be inserted into here.
     */
    ActiveRecord.create = function (definition, namespace) {
        function Class() {
            ActiveRecord.call(this);
        } Class.prototype = {};
        Class.extend(ActiveRecord);
        Class.prototype.__generated = true;

        namespace[definition.className] = Class;

        definition.aggregates = definition.aggregates || {};
        definition.atomic = definition.atomic || {};

        // Dynamic creation of accessors.
        function makeSetter(prop) {
            Class.prototype["set" + prop.capitalize()] = function (value) {
                if (value === this[prop]) {
                    return;
                }
                this[prop] = value;
                this.onValueChanged(prop);
            };
        }
        function makeGetter(prop) {
            Class.prototype["get" + prop.capitalize()] = function () {
                return this[prop];
            };
        }

        for (var p in definition.atomic) {
            var v = definition.atomic[p];
            Class.prototype[v] = null;
            var capitalized = v.capitalize();
            makeSetter(v);
            makeGetter(v)
        }

        for (var p in definition.aggregates) {
            var v = definition.aggregates[p];
            if (v.className) {
                v.namespace = namespace;
                v.constructor = namespace[v.className];
            }
            var capitalized = p.capitalize();
            if (!v.oneToMany) {
                makeGetter(p);
                makeSetter(p);
                Class.prototype["set" + capitalized + "Id"] = function (setterName, aggregateClassName, prop, id) {
                    this[setterName](namespace[aggregateClassName].get(id));
                }.curry("set" + capitalized, v.className, p);
                Class.prototype["get" + capitalized + "Id"] = function (getterName) {
                    return this[getterName]().getId();
                }.curry("get" + capitalized);
            } else {
                var pluralized = capitalized;
                var pluralizedLower = pluralized.charAt(0).toLowerCase() + pluralized.substr(1);
                var singularized = capitalized.substr(0, capitalized.length - 1);
                var singularizedLower = singularized.charAt(0).toLowerCase() + singularized.substr(1);
                (function () {
                    var acProp = p;
                    Class.prototype["add" + singularized] = function (v) {
                        return this[acProp].add(v);
                    };
                    Class.prototype["get" + singularized] = function (i) {
                        return this[acProp].get(i);
                    };
                    Class.prototype[singularizedLower + "Count"] = function () {
                        return this[acProp].count();
                    };
                    Class.prototype["has" + singularized] = function (v) {
                        return this[acProp].has(v);
                    };
                    Class.prototype["remove" + singularized] = function (v) {
                        return this[acProp].remove(v);
                    };
                    Class.prototype["indexOf" + singularized] = function (v) {
                        return this[acProp].indexOf(v);
                    };
                    Class.prototype[pluralizedLower + "HasIndex"] = function (i) {
                        return this[acProp].hasIndex(i);
                    };
                    Class.prototype["add" + singularized + "AtIndex"] = function (i, v) {
                        return this[acProp].addAtIndex(i, v);
                    };
                    Class.prototype["remove" + singularized + "AtIndex"] = function (i) {
                        return this[acProp].removeAtIndex(i);
                    }
                    Class.prototype["swap" + pluralized] = function (v1, v2) {
                        return this[acProp].swap(v1, v2);
                    }
                    Class.prototype["replace" + singularized] = function (oldV, newV) {
                        this[acProp].replace(oldV, newV);
                    };
                    Class.prototype["clear" + pluralized] = function () {
                        this[acProp].clear();
                    };
                })();
            }
        }
        Class.prototype._aggregates = definition.aggregates;
        Class.prototype.__defineAggregates();

        return Class;
    };

    EventSubscription.implement(ActiveRecord);

    // Overriding KVC methods after the implement call.
    var setValue = ActiveRecord.prototype.setValue;
    KVC.implement(ActiveRecord);
    ActiveRecord.prototype.setValue = setValue;

    Serializable.implement(ActiveRecord);

    return ActiveRecord;
})();
