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
 * CompositeValidation implements the Composite pattern for validations.
 * An example of where it can be used is if you have a Wizard with validations
 * on each page. Use a Validation for each of these and have a global
 * CompositeValidation to see if the entire wizard is valid.
 *
 * Documentation of methods is purposely sparse since all that the methods do
 * is propagate calls either to the appropriate Validation component, or
 * to each component.
 */
Cactus.MVC.View.CompositeValidation = (function () {
    var log = Cactus.Dev.log;
    var Validation = Cactus.MVC.View.Validation;
    var Collection = Cactus.Util.Collection;
    var slice = Collection.slice;

    /**
     * @param Array<Validation> components
     */
    function CompositeValidation(components) {
        this.components = components;
    } CompositeValidation.prototype = {
        /**
         * @type Array<Validation>
         */
        components : null,
        /**
         * @param string methodName
         * @param string elementId
         */
        __callOnElement : function (methodName, elementId) {
            for (var i = 0; i < this.components.length; i++) {
                var c = this.components[i];
                if (c._hasConstraintsFor(elementId)) {
                    return c[methodName].apply(c, slice(arguments, 1));
                }
            }
            throw new Error(("CompositeValidation:__callOnElement: "
                            + "Could not find constraint for id %s")
                            .format(elementId));
        },
        __callOnAll : function (methodName) {
            var returnValues = []
            for (var i = 0; i < this.components.length; i++) {
                var c = this.components[i];
                returnValues.push(c[methodName]());
            }
            return returnValues;
        },
        /**
         * @param string elementId
         * @return boolean
         */
        _getElement : function (elementId) {
            return this.__callOnElement("_getElement", elementId);
        },
        /**
         * @param string elementId
         * @return boolean
         */
        isValid : function (elementId) {
            return this.__callOnElement("isValid", elementId);
        },
        /**
         * @return boolean
         */
        allValid : function () {
            var allValid = true;
            for (var i = 0; i < this.components.length; i++) {
                allValid = allValid && this.components[i].allValid();
            }
            return allValid;
        },
        /**
         * @param string elementId
         * @return boolean
         */
        validateHidden : function (elementId) {
            return this.__callOnElement("validateHidden", elementId);
        },
        /**
         * @param string elementId
         * @return boolean
         */
        validateVisible : function (elementId) {
            return this.__callOnElement("validateVisible", elementId);
        },
        /**
         * @return boolean
         */
        allValidated : function () {
            var validated = this.__callOnAll("allValidated");
            for (var i = 0; i < validated.length; i++) {
                if (!validated[i]) {
                    return false;
                }
            }
            return true;
        },
        /**
         *
         */
        validateAll : function () {
            for (var i = 0; i < this.components.length; i++) {
                var c = this.components[i];
                c.validateAll();
            }
        },
        /**
         * @return Hash<string elementId, Array<string violationMessage>>
         */
        getViolationMessages : function () {
            var tmpMessages = this.__callOnAll("getViolationMessages");
            var messages = {};
            for (var i = 0; i < tmpMessages.length; i++) {
                for (var p in tmpMessages[i]) {
                    messages[p] = tmpMessages[i][p];
                }
            }
            return messages;
        },
        /**
         * @param string elementId
         */
        getViolationMessagesFor : function (elementId) {
            return this.__callOnElement("getViolationMessagesFor", elementId);
        },
        /**
         * @param string elementId
         * @param string violationMsg
         */
        failHidden : function (elementId, violationMsg) {
            return this.__callOnElement("failHidden", elementId, violationMsg);
        },
        /**
         * @param string elementId
         * @param string violationMsg
         */
        failVisible : function (elementId, violationMsg) {
            return this.__callOnElement("failVisible", elementId, violationMsg);
        }
    };
    CompositeValidation.extend(Validation);

    return CompositeValidation;
})();

