/*
 * Copyright (c) 2007-2010, Adam Bergmark
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
 * A CountMap is a Map from Key -> int that is used for counting.
 * Each value starts at 0 and the client can then call inc to increase this value.
 * The class could for instance be used to count occurrences of words in a string.
 * var cm = new CountMap();
 * var words = string.split(" ");
 * for (var i = 0; i < words.length; i++) {
 *     cm.inc(words[i]);
 * }
 */
Cactus.Util.CountMap = (function () {
    var log = Cactus.Dev.log;

    function CountMap() {
        this.map = {};
    } CountMap.prototype = {
        /**
         * @param String key
         * @return boolean
         */
        has : function (key) {
            return key in this.map;
        },
        /**
         * Increases the count for this key.
         * Initializes to 1 if key is undefined.
         *
         * @param String key
         */
        inc : function (key) {
            if (!this.has(key)) {
                this.map[key] = 0;
            }
            this.map[key]++;
        },
        /**
         * @param String key
         * @return int
         */
        get : function (key) {
            if (!this.has(key)) {
                return 0;
            }
            return this.map[key];
        },
        /**
         * Decreases the value, the key must be defined and the value must not
         * be zero (negative values are not allowed)
         *
         * @param String key
         */
        dec : function (key) {
            if (!this.has(key)) {
                throw new Error("CountMap:dec: Cannot dec undefined key %".format(key));
            }
            if (this.get(key) === 0) {
                throw new Error("CountMap:dec: Value is 0 and cannot be decreased.");
            }
            this.map[key]--;
        }
    };

    return CountMap;
})();
