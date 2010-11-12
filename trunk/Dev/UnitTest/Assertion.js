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
 * Assertion  is  a simple  data  structure,  it  has two  properties:
 * success  and  message.  Success  indicates if  the  assertion  that
 * created the object succeeded. In the case that the assertion failed,
 * failed() will return true, and message  can be viewed to get a clue
 * about what went wrong.
 */
Cactus.Dev.UnitTest.Assertion = (function () {
    /**
     * @param boolean success
     * @param string message
     */
    function Assertion (success, message) {
        this.success = success;
        this.message = message;
    } Assertion.prototype = {
        /**
         * @type boolean
         */
        success : null,
        /**
         * @type string
         */
        message : null,
        /**
         * Negated accessor for success, indicates whether an assertion failed.
         *
         * @return boolean
         */
        failed : function () {
            return !this.success;
        },
        /**
         * @return boolean
         */
        succeeded : function () {
            return this.success;
        },
        /**
         * @return string
         */
        getMessage : function () {
            return this.message;
        }
    };

    return Assertion;
})();
