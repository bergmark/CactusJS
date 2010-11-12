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
 * Provides extended functionality for Arrays.
 */

(function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection

    /**
     * Empties an array. Use this function when there are several
     * references to an array and you can't modify all of them to
     * point to a new array instance.
     *
     * @param Array array
     *   The array to empty.
     */
    Array.empty = function (array) {
        array.length = 0;
    };
    /**
     * Removes the specified element from the given array. If removeAll is set
     * the element is removed from every index in the array, if found.
     * Otherwise only the first occurence is removed.
     * Any objects to the right of the removed object are shifted to the left.
     *
     * @param Array array
     *   The array to remove the element from.
     * @param mixed element
     *   The element to remove.
     * @param optional boolean removeAll = true
     *   If more than one matching element should be removed (if found).
     * @return boolean
     *   The index of the element that was removed, -1 if nothing was removed.
     *   If removeAll is specified, any of the found indices may be returned.
     */
    Array.remove = function (array, element, removeAll) {
        removeAll = removeAll === undefined ? false : !!removeAll
        var newArray = [];
        var removed  = -1;

        function shouldRemove (matchingElements) {
            return matchingElements && (removeAll || removed === -1);
        }
        // Append the elements we want to keep to newArray.
        for (var i = 0; i < array.length; i++) {
            if (shouldRemove (element === array [i])) {
                removed = i;
            } else {
                newArray.push (array[i]);
            }
        }
        // Move contents of newArray to array.
        if (array.length > newArray.length) {
            Array.empty (array);
            while (newArray.length) {
                array.push (newArray.shift());
            }
        }

        return removed;
    };
    /**
     * Shallow clones an Array.
     *
     * @param Array array
     * @return Array
     */
    Array.clone = function (array) {
        return array.slice(0);
    };
    /**
     * Removes all duplicates and returns a new array containing only one
     * occurance of each value.
     *
     * @param Array array
     * @param Array
     */
    Array.unique = function (array) {
        function hasValue(array, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] === value) {
                    return true;
                }
            }
            return false;
        }

        var result = [];
        for (var i = 0; i < array.length; i++) {
            var o = array[i];
            if (!hasValue(result, o)) {
                result.push(o);
            }
        }
        return result;
    };
})();
