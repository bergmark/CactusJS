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
 * An interface signaling that an object can be serialized. The interface itself
 * does nothing but make this property explicit on classes and objects.
 * All serialized data should be JSON.
 */
Cactus.Util.Serializable = (function () {
    var log = Cactus.Dev.log;

    function Serializable() {

    } Serializable.prototype = {
        /**
         * Serializes the instance. Clients implementing the interface should
         * override this method. Serialization should be to JSON.
         *
         * @param optional boolean deep = true
         *   Whether a deep serialization should occur serializing all relevant
         *   data, or a shallow one, where as much detail as possible is
         *   omitted (such as using ID's instead of whole objects.
         * @param optional boolean convert = true
         *   If true, the result is returned as a string, otherwise as a hash.
         * @return Hash/string
         */
        serialize : function (deep, convert) {
            // .
        }
    };

    /**
     * Checks whether an object is serializable.
     *
     * @param Object object
     * @return boolean
     */
    Serializable.implementsInterface = function (object) {
        return object instanceof Object && "serialize" in object;
    };
    /**
     * Implements the serializable interface on a class. The class should
     * already have implemented its serialize method once this function is
     * called, or an error will be thrown.
     *
     * @param constructor Constructor
     */
    Serializable.implement = function (Constructor) {
        Serializable.addToInstance(Constructor.prototype);
    };
    /**
     * Implements the serializable interface on an object. The object should
     * already have implemented its serialize method once this function is
     * called, or an error will be thrown.
     *
     * @param constructor Constructor
     */
    Serializable.addToInstance = function (object) {
        if (!Serializable.implementsInterface(object)) {
            throw new Error("Serializable objects must have a serialize "
                            + "instance method.");
        }
    };

    return Serializable;
})();
