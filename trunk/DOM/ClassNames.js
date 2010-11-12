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
 * ClassNames provides static methods for accessing CSS class names for
 * HTML Elements. Implements flyweight.
 */
Cactus.DOM.ClassNames = (function () {
    var log = Cactus.Dev.log;

    function ClassNames () {

    } ClassNames.prototype = {
        /**
         * Adds a class to an object. But only if the class doesn't already
         * exist on the object.
         *
         * @param HTMLElement o
         * @param string className
         */
        add : function (o, className) {
            // Only add if the className isn't already added.
            if (!this.has(o, className)) {
                if (!o.className) {
                    // If the className property is empty, we can simply
                    // overwrite it.
                    o.className = className;
                } else {
                    // If it isn't empty, we have to insert a space so that
                    // "a" and "b" becomes "a b".
                    o.className += " " + className;
                }
            }
        },
        /**
         * Checks if a given className is as a className of o. It assumes that
         * class names are separated by spaces and all other characters will be
         * counted as part of class names.
         *
         * @param HTMLElement o
         * @param string className
         * @return boolean
         */
        has : function (o, className) {
            if (!o.className) {
                return false;
            }
            var classNames = o.className.split(" ");
            for (var i = 0; i < classNames.length; i++) {
                if (className === classNames[i]) {
                    return true;
                }
            }
            return false;
        },
        /**
         * Removes a class from o. Does nothing if the class name doesn't exist.
         *
         * @param HTMLElement o
         * @param string className
         */
        del : function (o, className) {
            if (this.has (o, className)) {
                var classNames = this.get (o);
                Array.remove (classNames, className);
                o.className = classNames.join (" ");
            }
        },
        /**
         * Returns an array containing all classnames of an element.
         *
         * @param HTMLElement o
         * @return Array[string]
         */
        get : function (o) {
            var chars = o.className.split("");
            var classNames = [];
            var className = "";
            for (var i = 0; i < chars.length; i++) {
                if (chars[i] === " ") {
                    classNames.push(className);
                    className = "";
                } else {
                    className += chars[i];
                }
            }
            classNames.push(className);
            return classNames;
        }
    };
    return new ClassNames();
})();
