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
 * A decorator for sorting the contents of an array. SortDecorator (or Sorter)
 * uses a comparator (function returning -1, 0, 1 depending on whether the
 * first argument is less than, equal to, or larger than the second argument).
 *
 * Initially the built-in sorting function is used. On later modifications--
 * insertion sort. Sorter needs O(n) swaps to add and remove elements from the
 * list, meaning as many onSwap events will be passed out, if this turns out
 * to be too inefficient a system for coordinating groups of changes may be
 * implemented, and can in that case be used by all decorators.
 */
Cactus.MVC.Model.SortDecorator = (function () {
    var log = Cactus.Dev.log;
    var ACD = Cactus.MVC.Model.ArrayControllerDecorator;
    var AC = Cactus.MVC.Model.ArrayController;
    var Collection = Cactus.Util.Collection;

    /**
     * @param ArrayController component
     * @param Function comparator
     *        @param X
     *        @param X
     *        @return int
     *          in [-1, 0, 1]
     *      where X is the type of any object that may occur in the component.
     *   The function to use for comparing elements when sorting.
     */
    function SortDecorator(component, comparator) {
        this.comparator = comparator;
        this.SuperClass.call(this, component);
    } SortDecorator.prototype = {
        /**
         * @type Function
         *   See constructor documentation for exact type definition.
         */
        comparator : Function.empty,
        /**
         * @type Function comparator
         */
        setComparator : function (comparator) {
            this.comparator = comparator;
            this._setObjects();
        },
        /**
         *
         */
        _setObjects : function () {
            this.objects = this.component.getRange().sort(this.comparator);
            this.onObjectRearrange();
        },
        /**
         * It makes no sense to try to swap elements in a sorted list, so an
         * error will be thrown if it's attempted.
         */
        swap : function () {
            throw new Error("Cannot swap elements in a sorted list.");
        },
        /**
         * @param ArrayController component
         * @param natural index
         */
        onObjectAddedTriggered : function (component, index) {

            var addedObject = component.get(index);

            // Insert as the last element.
            AC.prototype.add.call(this, addedObject);

            // Loop backwards, swapping until the element lands where it
            // belongs.
            // `i` starts at the 2nd to last element since the last one is the
            // one just added.
            for (var i = this.count() - 2; i >= 0; i--) {
                var comparison = this.comparator(addedObject,
                                                 this.objects[i]);
                if (comparison === 0) {
                    // The element is equal to the one to the left, so it might
                    // as well stay put.
                    break;
                } else if (comparison === -1) {
                    // The element is less than the one to the left, it has to
                    // be swapped further.
                    AC.prototype.swap.call(this, i + 1, i);
                } else {
                    // The element is larger than the one to the left. It's in
                    // the right position.
                    break;
                }
            }
        },
        /**
         *
         */
        onObjectRemovedTriggered : ACD.prototype.onObjectRemovedTriggered,
        /**
         *
         */
        onObjectSwapTriggered : Function.empty,
        /**
         * @param ArrayController component
         * @param natural componentIndex
         * @param mixed oldObject
         * @param mixed newObject
         */
        onObjectReplacedTriggered : function (component, componentIndex,
                                              oldObject, newObject) {
            // Replace the old object with the new one.
            AC.prototype.replace.call(this, oldObject, newObject);

            var index = Collection.indexOf(this.objects, newObject);

            var that = this;

            // Shorthands for making comparisons.
            function lt(a, b) {
                return that.comparator(a, b) === -1;
            }
            function gt(a, b) {
                return that.comparator(a, b) === 1;
            }

            var swap = AC.prototype.swap.bind(this);

            var previous;
            var next;
            var hasNext;
            var hasPrevious;

            function setPrevious() {
                hasPrevious = index > 0;
                previous = hasPrevious ? that.get(index - 1) : null;
            }
            function setNext() {
                hasNext = index < that.count() - 1;
                next = hasNext ? that.get(index + 1) : null;
            }
            setPrevious();
            setNext();

            // Move the object rightwards as long as the element to the right
            // exists and is smaller than the new object.
            while (next !== null && gt(newObject, next)) {
                swap(index, index + 1);
                index++;
                setPrevious();
                setNext();
            }

            // Move the object leftwards as long as the element to the left
            // exists and is greater than the new object.
            while (previous !== null && lt(newObject, previous)) {
                swap(index, index - 1);
                index--;
                setPrevious();
                setNext();
            }
        }
    };
    SortDecorator.extend(ACD);

    return SortDecorator;
})();
