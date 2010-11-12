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
 * Provides helper functions for working with collections.
 *
 * Terminology:
 *   A Collection is an object with numerical indices and a length property.
 *   The first index is 0. A length property also has to exist. So this includes
 *   Arrays, NodeLists (HTMLCollections), 'arguments' objects and some custom
 *   types.
 *
 * The type of a collection should be given as "collection" in documentation.
 */

Cactus.Util.Collection = (function () {
    var log = Cactus.Dev.log;

    var Collection = {};

    /**
     * Coerces a collection into an Array.
     * If the object is readOnly, as with a NodeList, pass the iterate flag
     * to iterate through the collection and create an array of the contents.
     *
     * A new object is returned, the argument remains the same type.
     *
     * @param collection collection
     *   The collection to convert.
     * @param boolean iterate
     *   Whether the collection is readOnly.
     */
    Collection.coerce = function (collection, iterate) {
        if (!iterate) {
            return Array.prototype.slice.call (collection);
        } else {
            var a = [];
            for (var i = 0; i < collection.length; i++) {
                a.push (collection [i]);
            }
            return a;
        }
    };
    /**
     * Checks if the given value is inside the collection.
     *
     * @param collection collection
     *   The collection to look through.
     * @param mixed value
     *   The value to look for.
     * @return boolean
     *   Whether the value is in the collection.
     */
    Collection.hasValue = (function () {
        // Use native indexOf it it exists.
        if (Array.prototype.indexOf) {
            return function (collection, value) {
                return Array.prototype.indexOf.call (collection, value) !== -1;
            }
        } else {
            return function (collection, value) {
                for (var i = 0; i < collection.length; i++) {
                    if (collection [i] === value) {
                        return true;
                    }
                }
                return false;
            }
        }
    })();
    /**
     * Checks if two collections share any value. Runs in O(n^2).
     *
     * @param collection a
     * @param collection b
     * @return boolean
     *   Whether a value was found inside both a and b.
     */
    Collection.intersects = function (a, b) {
        for (var i = 0; i < a.length; i++) {
            if (Collection.hasValue (b, a [i])) {
                return true;
            }
        }
        return false;
    };
    /**
     * Returns an array of the intersecting elements of two collections.
     * The ordering of the returned elements is arbitrary.
     *
     * @param collection a
     * @param collection b
     * @return Array
     *   The elements occuring in both a and b, or an empty array if none is
     *   found.
     */
    Collection.intersection = function (a, b) {
        var intersection = [];
        for (var i = 0; i < a.length; i++) {
            if (Collection.hasValue (b, a [i])) {
                intersection.push (a [i]);
            }
        }
        return intersection;
    };
    /**
     * Gets the last element out of a collection.
     *
     * @param collection collection
     *   The collection to retrieve the value from.
     * @return mixed
     *   The last element.
     * @throws Error
     *   If the array is empty
     */
    Collection.last = function (collection) {
        if (!collection.length) {
            throw Error ("Collection is empty.");
        }
        return collection [collection.length - 1];
    };
    /**
     * Checks if a collection can be iterated through using
     * numeric indices and the length property.
     *
     * @param mixed collection
     * @return boolean
     */
    Collection.isCollection = function (collection) {
        return !! (collection &&
                   (typeof collection === "object") &&
                   ("length" in collection) &&
                   isFinite (collection.length) &&
                   (collection !== window) &&
                   !("tagName" in collection));
    };
    /**
     * Performs slice on a collection.
     *
     * @param collection collection
     *   The collection to slice.
     * @param *args
     *   Any arguments to pass to Array:slice
     * @return Array
     *   The sliced array.
     */
    Collection.slice = function (collection, args) {
        var args = Array.prototype.slice.call (arguments, 1);
        return Array.prototype.slice.apply (collection, args);
    };
    /**
     * Slices an collection using a range to define the boundaries.
     *
     * @param collection collection
     *   The collection to slice.
     * @param Util.Range range
     *   The boundaries of the slice.
     * @return Array
     *   The new array.
     */
    Collection.sliceWithRange = function (collection, range) {
        return Collection.slice (collection, range.getStart(), range.getEnd() + 1);
    };
    /**
     * Returns an array of all elements in the given array that
     * gives a true return value when passed to the given function.
     *
     * @param collection collection
     *   The collection to loop through.
     * @param Function func
     *   A function with a boolean return type.
     * @return Array
     *   The matched elements.
     */
    Collection.select = function (collection, func) {
        var selection = [];
        for (var i = 0; i < collection.length; i++) {
            if (func (collection [i], i)) {
                selection.push (collection [i]);
            }
        }
        return selection;
    };
    /**
     * A Higher-order function that returns an array with
     * all elements in the given array that do not match
     * the given function.
     *
     * @param collection collection
     *   The collection to look through.
     * @param Function func(element) -> boolean
     *   A predicate function to apply the elements of the collection to.
     * @return Array
     *   The elements not matching the predicate.
     */
    Collection.reject = function (collection, func) {
        var a = [];
        for (var i = 0; i < collection.length; i++) {
            if (!func (collection [i], i)) {
                a.push (collection [i]);
            }
        }
        return a;
    };
    /**
     * Returns the index of an object in a collection.
     *
     * @param collection collection
     *   The collection to look in.
     * @param mixed object
     *   The object to look for.
     * @param optional throwError = true
     *   If true, an error is thrown if the object isn't found in the collection.
     *   If false, -1 is returned if the object isn't found.
     * @return integer
     *   The index of the located object.
     * @throws Error
     *   If the object isn't in the collection and throwError is set to true.
     */
    Collection.indexOf = function (collection, object, throwError) {
        throwError = throwError === true || throwError === undefined;
        for (var i = 0; i < collection.length; i++) {
            if (collection [i] === object) {
                return i;
            }
        }

        if (throwError) {
            throw new Error ("Object is not in array");
        } else {
            return -1;
        }
    };
    /**
     * Returns an array of all return values of func applied
     * to each key value pair in the collection.
     *
     * @param collection collection
     * @param Function func
     * @return Array
     */
    Collection.map = function (collection, func) {
        var a = [];
        for (var i = 0; i < collection.length; i++) {
            a.push (func (collection [i], i));
        }
        return a;
    };
    /**
     * Calls the specified function for every element in the collection.
     *
     * @param collection collection
     * @param Function func
     */
    Collection.each = function (collection, func) {
        for (var i = 0; i < collection.length; i++) {
            func (collection [i], i);
        }
    };
    /**
     * Returns whether the given predicate is true for one or more
     * elements in the collection.
     *
     * @param collection collection
     * @param Function predicate
     * @return boolean
     */
    Collection.some = function (collection, pred) {
        for (var i = 0; i < collection.length; i++) {
            if (pred (collection [i], i)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Returns whether the given predicate is false for all
     * elements in the collection.
     *
     * @param collection collection
     * @param Function pred
     * @return boolean
     */
    Collection.notAny = function (collection, pred) {
        return !Collection.some(collection, pred);
    };
    /**
     * Returns whether the given predicate is true for all the
     * elements in the collection.
     *
     * @param collection collection
     * @param Function pred
     * @return boolean
     */
    Collection.every = function (collection, pred) {
        for (var i = 0; i < collection.length; i++) {
            if (!pred (collection [i], i)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Returns whether the given predicate is false for at least one
     * element in the collection.
     *
     * @param collection collection
     * @param Function pred
     * @return boolean
     */
    Collection.notEvery = function (collection, pred) {
        return !Collection.every(collection, pred);
    };
    /**
     * Finds the first element of a collection matching the given predicate.
     *
     * @param collection collection
     * @param Function pred
     * @return mixed
     *   An element of the collection, or null if none matches the predicate.
     */
    Collection.findFirst = function (collection, pred) {
        for (var i = 0; i < collection.length; i++) {
            if (pred (collection [i])) {
                return collection [i];
            }
        }
        return null;
    };
    /**
     * Checks whether two collections have the same elements in the same order.
     *
     * @param collection a
     * @param collection b
     * @return boolean
     */
    Collection.equal = function (a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    };

    return Collection;
})();
