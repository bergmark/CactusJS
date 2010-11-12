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
 * ValueObject (VO) comes hand-in-hand with ActiveRecord (AR). While AR
 * is used when implementing entities, VO's do not have identity at
 * all.
 *
 * The main differences are that there is no id, and they always
 * serialize into a hash with all their data. They cannot be saved by
 * themselves either since they are meaningless without context, neither can
 * they be updated by themselves, the AR instance aggregating the VO must
 * replace it with another VO instance. There are a few instances where a VO
 * may change, but think twice before making them mutable.
 * Collections are a good candidate for mutable VO's.
 */
Cactus.MVC.Model.ValueObject = (function () {
    var log = Cactus.Dev.log;
    var KVC = Cactus.Util.KeyValueCoding;
    var JSON = Cactus.Util.JSON;
    var Serializable = Cactus.Util.Serializable;
    // Avoid circular reference.
    var ActiveRecord;

    function ValueObject() {

    } ValueObject.prototype = {
        /**
         * Takes a stringified JSON hash and inserts the data into the object.
         * inject does not work with aggregates at the moment.
         *
         * @param string json
         */
        inject : function (json) {
            var hash;
            if (typeof json === "string") {
                hash = JSON.parse(json);
            } else {
                hash = json;
            }

            for (var p in hash) if (hash.hasOwnProperty(p)) {
                this.setValue(p, hash[p]);
            }
        },
        /**
         * Serializes the instance. At the moment only primitive values
         * and ArrayController instances are serialized.
         * Properties prefixed with an underscore are also skipped.
         *
         * @param optional boolean deep = false
         *   If true, aggregates are serialized into full json, if false then
         *   any entities are replaced with their ID's.
         * @return Hash/string
         */
        serialize : function (deep) {
            // Avoid circular reference.
            if (!ActiveRecord) {
                var C = Cactus;
                ActiveRecord = C.MVC.Model.ActiveRecord;
            }

            deep = !!deep;

            var o = {};
            for (var p in this) if (this.hasOwnProperty(p)) {
                if (/^_/.test(p)) {
                    continue;
                }

                var value = this[p];

                if (Serializable.implementsInterface(value)) {
                    if (!deep && value instanceof ActiveRecord) {
                        o[p] = value.getId();
                    } else {
                        o[p] = value.serialize(deep);
                    }
                }
                // Exclude other compound objects.
                else if (typeof value === "object") {
                    continue;
                }
                else {
                    o[p] = value;
                }
            }
            return o;
        }
    };
    KVC.implement(ValueObject);
    Serializable.implement(ValueObject);

    return ValueObject;
})();
