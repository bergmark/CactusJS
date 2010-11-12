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
 * A set is an unordered collection of unique elements. Duplicates are not
 * added. It can either compare objects by their identity or by doing a shallow
 * compare of their properties.
 *
 * A future update will provide a 3rd method of comparison, recursively
 * comparing properties of value objects.
 */
Cactus.Util.Set = (function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;

    /**
     * @param optional string elementType = "identity"
     *   "shallow" or "identity" depending on whether objects should be compared
     *   based on their values or their identities.
     */
    function Set (elementType) {
        this.elementType = elementType || "identity";
        this.collection = [];
    } Set.prototype = {
        /**
         * @type Array
         */
        collection : [],
        /**
         * @type string
         *   "identity" or "shallow"
         */
        elementType : "identity",
        /**
         * Adds an element to the set, but only if it is not already in there.
         *
         * @param mixed element
         * @return boolean
         *   Whether the element was added. (It's not added if it was already
         *   in the set.)
         */
        add : function (element) {
            if (this.has (element)) {
                return false;
            }

            this.collection.push (element);
            return true;
        },
        /**
         * @return natural
         *   The number of elements in the set.
         */
        size : function () {
            return this.collection.length;
        },
        /**
         * Returns an element from the set given an index. Note that there is
         * no guarantee that an element will keep its index since the set is
         * unordered.
         *
         * @param natural index
         * @param mixed
         */
        get : function (index) {
            if (typeof index !== "number") {
                throw new Error ("Index is not a number.");
            }
            if (index >= this.size() || index < 0) {
                throw new Error ("Index out of bounds");
            }
            return this.collection[index];
        },
        /**
         * @param mixed element
         * @return boolean
         *   Whether the element is in the set.
         */
        has : function (element) {
            if (this.elementType === "identity") {
                return Collection.hasValue (this.collection, element);
            } else {
                for (var i = 0; i < this.size(); i++) {
                    if (this._equal (element, this.collection [i])) {
                        return true;
                    }
                }
                return false;
            }
        },
        /**
         * Removes an element from the set.
         *
         * @param mixed element
         */
        remove : function (element) {
            Array.remove (this.collection, element);
        },
        /**
         * Does a shallow compare of two object's properties.
         *
         * @param mixed a
         * @param mixed b
         * @return boolean
         *   Whether the objects are considered equal.
         */
        _equal : function (a, b) {
            var properties = [];
            for (var p in a) {
                properties.push (p);
                if (!(p in b)) {
                    return false;
                }
                if (a [p] !== b [p]) {
                    return false;
                }
            }
            for (var p in b) {
                if (!Collection.hasValue (properties, p)) {
                    return false;
                }
            }
            return true;
        }
    };

    return Set;
})();
