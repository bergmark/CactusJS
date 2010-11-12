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
 * A Map with stricter behavior than a regular Map(/Object).
 * Clients must define properties when they are first used, and an attempt to
 * to get/set the value of an undefined property is made, an error is thrown.
 * An Error is also thrown if trying to define an already existing property.
 */
Cactus.Util.StrictMap = (function () {
    var log = Cactus.Dev.log;

    /**
     * @param optional Map map
     *   If supplied, the value is wrapped with the strict map instance.
     *   Note that no copy is made, so ownership of the map should be
     *   transferred to the StrictMap.
     *   If not supplied, an empty map is initialized.
     */
    function StrictMap(map) {
        if (map !== undefined) {
            if (map === null || typeof map !== "object") {
                throw new Error("StrictMap: Expected Map argument, or no argument.");
            }
        }
        this.map = map || {};
    } StrictMap.prototype = {
        /**
         * @type string
         */
        className : "StrictMap",
        /**
         * @param string methodName
         * @param string key
         * @throws Error if key is undefined.
         */
        __checkKeyExistence : function (methodName, key) {
            if (!(key in this.map)) {
                throw new Error("%s:%s: Undefined key %s".format(this.className, methodName, key));
            }
        },
        /**
         * @param string methodName
         * @param string key
         * @throws Error if key is defined.
         */
        __checkNonExistence : function (methodName, key) {
            if (key in this.map) {
                throw new Error("%s:%s: key %s is already defined".format(this.className, methodName, key));
            }
        },
        /**
         * @type Map
         */
        map : null,
        /**
         * @param string key
         * @param mixed value
         * @throws Error if key is defined.
         */
        define : function (key, value) {
            this.__checkNonExistence("define", key);
            this.map[key] = value;
        },
        /**
         * @param string key
         * @param mixed value
         * @throws Error if key is undefined.
         */
        set : function (key, value) {
            this.__checkKeyExistence("set", key);
            this.map[key] = value;
        },
        /**
         * @param string key
         * @return mixed
         * @throws Error if key is undefined.
         */
        get : function (key) {
            this.__checkKeyExistence("get", key);
            return this.map[key];
        }
    };

    return StrictMap;
})();
