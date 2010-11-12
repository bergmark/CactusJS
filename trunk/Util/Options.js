/*
 * Copyright (c) 2007-2009, Adam Bergmark
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
 *  Provides "parsing" meant for validating hash arguments.
 *  Without structure checks for these, client errors are hard to debug.
 *  It is currently only possible to parse flat structures, meaning a value
 *  cannot be another hash.
 *  Using Options it's easier to specify the structure expected for a compound
 *  argument.
 */
Cactus.Util.Options = (function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;
    var StrictMap = Cactus.Util.StrictMap;
    var JSON = Cactus.Util.JSON;

    function ErrorMessage() {
        this.errors = [];
    } ErrorMessage.prototype = {
        errors : null,
        has : function () {
            return this.count() !== 0;
        },
        add : function (property, message) {
            this.errors.push({
                property : property,
                message : message
            })
        },
        addSub : function (property, subError) {
            this.errors.push({
                property : property + "." + subError.property,
                message : subError.message
            });
        },
        addSubObj : function (property, subErrorMessage) {
            for (var i = 0; i < subErrorMessage.count(); i++) {
                this.addSub(property, subErrorMessage.get()[i]);
            }
        },
        get : function () {
            return this.errors;
        },
        count : function () {
            return this.errors.length;
        },
        _getErrorString : function (e) {
            if (e.property) {
                return 'Options: Error in property "%s": %s'.format(e.property, e.message);
            } else {
                return 'Options: Error: %s'.format(e.message);
            }
        },
        getErrorString : function () {
            var errorStrings = [];
            for (var i = 0; i < this.errors.length; i++) {
                var e = this.errors[i];
                errorStrings.push(this._getErrorString(e));
            }
            return errorStrings.join("\n");
        },
        getMessages : function () {
            var messages = [];
            for (var i = 0; i < this.errors.length; i++) {
                messages.push(this._getErrorString(this.errors[i]));
            }
            return messages;
        }
    };

    /**
     * @param Map<string propertyName, Hash{
     *     type : optional union{"boolean","mixed",Constructor} = "mixed"
     *     coerce : optional boolean = false,
     *     required : optional boolean = !hasDefaultValue,
     *     defaultValue : optional mixed, // Shall have the type specified
     *                                    // under the type property.
     * }> definition
     */
    function Options(definition, throwErrors) {
        throwErrors = throwErrors === undefined ? true : !!throwErrors;
        definition = definition || {};
        this.definition = definition;
        this.nestedOptions = new StrictMap();
        var errorMessage = new ErrorMessage();
        this.errorMessage = errorMessage;
        var addError = errorMessage.add.bind(errorMessage);
        var addSubError = errorMessage.addSub.bind(errorMessage);

        if (!("type" in definition)) {
            addError("", "Did not specify type for definition");
        }

        if (definition.map) {
            var o = new Options({ type : definition.type }, false);
            this.errorMessage.addSubObj("", o._getErrorMessage());
            this.nestedOptions.define("map", o);
        }

        for (var p in definition.type) {
            var d = definition.type[p];
            if ((!(d instanceof Object) || typeof d !== "object") && !(d instanceof Function)) {
                addError(p, 'Invalid type constraint for property, expected Hash but got %s'.format(JSON.stringify(d)));
                continue;
            }
            if ("required" in d) {
                d.required = !!d.required;
            } else if ("defaultValue" in d) {
                d.required = false;
            } else {
                d.required = true;
            }
            d.coerce = !!d.coerce;

            if (d.coerce && (!("type" in d) || d.type === "mixed")) {
                addError(p, "Cannot coerce without a specific type.");
                continue;
            }

            d.type = "type" in d ? d.type : "mixed";

            var validNativeTypes = ["boolean", "mixed", "string", "number"]

            if (d.type instanceof Array) {
                if (d.type.length !== 1) {
                    this.errorMessage.add("Array types definitions shall contain exactly one value.");
                }
                if (d.type[0] instanceof Object) {
                    var o = new Options({ type : d.type[0] }, false)
                    this.errorMessage.addSubObj(p, o._getErrorMessage());
                    this.nestedOptions.define(p + "[]", o);
                }
            } else if (!(d.type instanceof Function) && d.type instanceof Object) {
                var o = new Options({ type : d.type }, false);
                this.errorMessage.addSubObj(p, o._getErrorMessage());
                this.nestedOptions.define(p, o);
            } else if (!Collection.hasValue(validNativeTypes, d.type)
                && !(d.type instanceof Function)
                && !(d.type instanceof Object)) {
                addError(p, ('Invalid type specified, namely %s. '
                             + "Expected one of: %s, or a constructor.")
                             .format(d.type, validNativeTypes.join(", ")));
            }
        }
        var errors = errorMessage.get();
        this.errors = errors;

        if (errorMessage.has() && throwErrors) {
            throw new Error(errorMessage.getErrorString());
        }
    } Options.prototype = {
        definition : null,
        nestedOptions : null,
        /**
         * @param optional Hash options = {}
         * @return Hash
         *   A hash valid in regard to the type definition, with applicable
         *   values coerced and defaultValues added.
         */
        parse : function (options, throwErrors) {
            options = options || {};
            if (!(options instanceof Object)) {
                throw new Error("Options:parse: options argument was not an object, got %s".format(options));
            }
            throwErrors = throwErrors === undefined ? true : !!throwErrors;
            this.parseErrorMessage = new ErrorMessage();
            var addError = this.parseErrorMessage.add.bind(this.parseErrorMessage);
            var result = {};
            var parsedProperties = [];
            // Loop through the definition's properties.

            if (this.definition.map) {
                for (var p in options) {
                    parsedProperties.push(p);
                    var res = this._matchesMap(p, this.definition, options[p]);
                    result[p] = res;
                }
            } else {
                for (var p in this.definition.type) {
                    parsedProperties.push(p);

                    var d = this.definition.type[p];
                    var o = options[p];
                    if (!(p in options) && d.required) {
                        addError(p, "Missing required property.");
                    } else if (!d.required && !(p in options)) {
                        if ("defaultValue" in d) {
                            result[p] = d.defaultValue;
                        }
                    } else if (d.coerce) {
                        result[p] = this._coerce(d.type, o);
                    } else if (!this._matchesType(p, d, o)) {
                        addError(p, "Expected type %s but got type %s"
                                 .format(this._typeToString(d.type), this._typeof(o)));
                        continue;
                    } else {
                        result[p] = o;
                    }
                }
            }
            // Loop through the value's properties that haven't been parsed.
            for (var p in options) {
                if (Collection.hasValue(parsedProperties, p)) {
                    continue;
                }
                parsedProperties.push(p);
                addError(p, "Property lacks definition.");
            }

            if (throwErrors && this.parseErrorMessage.has()) {
                throw new Error(this.parseErrorMessage.getErrorString());
            }
            if (!throwErrors) {
                return {
                    result : result,
                    parseErrorMessage : this.parseErrorMessage
                };
            }
            return result;
        },
        /**
         * @param mixed type
         */
        _typeToString : function (type) {
            if (typeof type === "string") {
                return type;
            }
            return JSON.stringify(type);
        },
        /**
         * @param string type
         * @param mixed value
         * @return mixed
         */
        _coerce : function (type, value) {
            if (this._typeof(value) === type) {
                return value;
            }
            switch (type) {
            case "boolean":
                return !!value;
                break;
            case "string":
                return String(value);
                break;
            case "number":
                return parseInt(value, 10);
            default:
                throw new Error("Options:_coerce: Coercion not defined for type %s"
                                .format(JSON.stringify(type)));
            }
        },
        /**
         * @param mixed value
         * @return mixed
         */
        _typeof : function (value) {
            if (value instanceof Array) {
                if (value.length === 0) {
                    return '["any"]';
                }
                var type = this._typeof(value[0]);
                for (var i = 1; i < value.length; i++) {
                    var t = this._typeof(value[i]);
                    if (t !== type) {
                        type = "mixed";
                        break;
                    }
                }
                return '["%s"]'.format(type);
            }
            return typeof value;
        },
        /**
         * @param string propertyName
         * @param mixed type
         * @param mixed value
         */
        _matchesType : function (propertyName, definition, value) {
            var type = definition.type;
            if (definition.map) {
                // Assume a sub property of the map is being parsed, since the
                // whole map is never passed to this method.

            } else if (type instanceof Array) {
                if (!(value instanceof Array)) {
                    return false;
                }
                var matches = true;
                for (var i = 0; i < value.length; i++) {
                    matches = matches && this._matchesType(propertyName + "." + i, { type : type[0] }, value[i]);
                }
                return matches;
            } else if (typeof type === "object") {
                var nestedOptionName = propertyName;
                if (/^(.+)\.\d+$/.test(nestedOptionName)) {
                    nestedOptionName = RegExp.$1 + "[]";
                }
                var res = this.nestedOptions.get(nestedOptionName).parse(value, false);
                if (res.parseErrorMessage.has()) {
                    this.parseErrorMessage.addSubObj(propertyName, res.parseErrorMessage);
                }
                return res.result;
            }
            return type === "mixed"
                || (type !== "object" && type === typeof value)
                || (type instanceof Function && value instanceof type);
        },
        _matchesMap : function (propertyName, definition, value) {
            if (!(value instanceof Object)) {
                this.parseErrorMessage.add(propertyName, "Expected an Object.");
                return;
            }
            var res = this.nestedOptions.get("map").parse(value, false);
            if (res.parseErrorMessage.has()) {
                this.parseErrorMessage.addSubObj(propertyName, res.parseErrorMessage);
            }
            return res.result;
        },
        _getErrorMessage : function () {
            return this.errorMessage;
        },
        hasErrors : function () {
            return this.errorMessage.has();
        },
        getErrors : function () {
            return this.errorMessage.get();
        },
        getErrorMessages : function () {
            return this.errorMessage.getMessages();
        }
    };

    return Options;
})();
