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
 * Given a form and a set of validations, Validation can validate the form data
 * and makes any violation messages retrievable.
 *
 * Note that fields are only validated after any of the validate methods are
 * explicitly called. The point of this is that validations for a form field
 * can be delayed until after the user has filled in that field, meaning it will
 * be simple to display only relevant error messages (Displaying a field as
 * incorrect before the user has gotten to it.
 *
 * At the moment it's only possible to validate atomic values, meaning
 * Validation will work with text fields, text areas, radio buttons and selects.
 * The compound form elements; checkbox and multiselect can usually not end up
 * in an invalid state unless the user is modifying the DOM himself (in which
 * case there is nothing we can do about it on the client side anyway).
 * Note that a single checkbox isn't "compound", so it can be validated.
 *
 * When creating the validation data structures it is possible to exchange the
 * `regex : RegExp` property for `mandatory : boolean` to only check whether
 * the value is "" or not. If the mandatory property is set and the value is
 * empty, no other validations will be performed.
 *
 * There is also a `func` property that allows a function to be used for
 * validation instead of a regex. This property can be attached to mandatory
 * fields as well, if you want a custom validation to act like a mandatory check
 * in other respects (that is, if it fails, no other validations are performed.)
 *
 * If you want to validate more complex structures, not correspondant to a
 * single form element (such as widgets), you can use a custom validation.
 * A custom validation is a hash with custom : true, and a func. The func is a
 * little special since there is no form value that it can receive as its
 * argument. Therefore you must fetch any values through a lexical context
 * (or, if you must, globally). You could also Function:curry the function.
 *
 * There are two main methods that trigger validations, validateVisible and
 * validateHidden. *Hidden simply checks whether a value is valid. *Visible will
 * does the same, and displays error messages in the UI if validation fails.
 * validateVisible does only triggers if it's an all custom validation or
 * if the form element value has changed.
 *
 * It is also possible to trigger custom validation errors by using either
 * failHidden or failVisible. These methods adds a violation message that will
 * disappear as soon as validation is triggered again. This is useful to alert
 * the user of some problem relating to a form field, but one that can't be
 * validated by the validations alone (such as custom asynchronous validation).
 * Note that if you want to use failVisible soon (within ~ 1 second) after an
 * onchange on a radio or checkbox, you will need to add an additional delay
 * since the delayed validation occuring later will remove this message
 * otherwise.
 *
 * If an constraint is marked with requireElement : false, it will be removed if
 * the form element does not exist. The property defaults to true.
 *
 * To make validation errors show up in the UI, a form element needs an error
 * container. The error container needs to be available in the DOM when the
 * validation is created. The default id for error containers is fieldName_error
 * and the container is populated with an UL of error messages (note that the
 * error container itself should NOT be an UL, since an UL is appended to it).
 * To change the default error container suffix from "error",
 * use setErrorContainerSuffix.
 */
Cactus.MVC.View.Validation = (function () {
    var log = Cactus.Dev.log;
    var Element = Cactus.DOM.Element;
    var Events = Cactus.DOM.Events;
    var tag = Cactus.DOM.tag;
    var $ = Cactus.DOM.select;
    var $f = Cactus.DOM.selectFirst;
    var EventSubscription = Cactus.Util.EventSubscription;
    var Set = Cactus.Util.Set;
    var Browser = Cactus.Util.Browser;

    /**
     * @param Map<string elementId,
     *          Array<
     *            Hash{
     *              optional regex : RegExp,
     *              violationMsg : string/Function,
     *                                      @return string
     *              optional mandatory : boolean,
     *              optional custom : boolean,
     *              optional func : Function
     *                                @param mixed value
     *                                @return boolean
     *            }>> validations
     *   Complicated signature, example:
     *   {
     *       foo : [{
     *           regex : /^\d+$/,
     *           violationMsg : "Should be all numbers."
     *       }, {
     *           regex : /^.{4}$/,
     *           violationMsg : "Should be 4 characters long."
     *       }, {
     *           func : function (s) { return s.charAt(0) !== "0"; },
     *           violationMsg : "First digit may not be a zero."
     *       }],
     *       baz : [{
     *           mandatory : true,
     *           violationMsg : function () { return "Is mandatory."; }
     *       }, {
     *           regex : /^[a-z]+$/,
     *           violationMsg : "Should be all letters."
     *       }]
     *       bax : [{
     *           custom : true,
     *           func : function () { var v = get(); return v; }
     *       }]
     *   }
     *   Validation takes ownership of the Map.
     * @param optional HTMLElement container = document
     *   The form element's container.
     * @param optional boolean valid = true
     *   Whether the validation should be considered successful before any
     *   validations have occured.
     */
    function Validation(validations, container, valid) {
        this.container = container || document;
        this.validations = validations;
        this.validatedFields = new Set();
        for (var p in validations) {
            var v = validations[p];
            if (v.length === 0) {
                this.validatedFields.add(p);
                continue;
            }
            var hasElement = this._hasElement(p);
            var allCustom = true;
            for (var i = v.length - 1; i >= 0; i--) {
                var w = v[i];
                if (!w) {
                    throw new Error('Validation: constraint for "%s" was %s.'.format(p,w));
                }
                if (!("requireElement" in w)) {
                    w.requireElement = true;
                }
                w.custom = !!w.custom;

                if (!hasElement && !w.requireElement) {
                    Array.remove(v, w);
                    continue;
                }

                if (w.custom && !("func" in w)) {
                    throw new Error(
                        ("Validation: The constraint %s[%s] is custom and therefore needs a func property.")
                        .format(p, i));
                }
                allCustom = allCustom && w.custom;
            }
            v.allCustom = allCustom;
        }
        this.violationMessages = {};
        this._attachEvents();
        this.valid = valid !== false;
        this.previousValues = {};
    } Validation.prototype = {
        // Events.
        /**
         * @param bool isValid
         */
        onValidChanged : Function.empty,

        /**
         * @type Set
         *   The ids of fields that have been validated at least once.
         */
        validatedFields : null,
        /**
         * @type boolean
         *   Assume valid at first.
         */
        valid : true,
        /**
         * @type HTMLElement
         *   The container of the elements to validate.
         */
        container : null,
        /**
         * @type Map
         */
        validations : {},
        /**
         * @type Map<string elementId, Array<string violationMessage>>
         *   Where elementId is the ID of a form element and
         *   violationMessage is the error message that's supposed to give
         *   the user a clue of what went wrong.
         */
        violationMessages : {},
        /**
         * @param string elementId
         * @return HTMLElement/null
         *   null if the element cannot be found.
         */
        _unsafeGetElement : function (elementId) {
            return $f("#%s".format(elementId), this.container);
        },
        /**
         * Checks if an element exists
         * @param string elementId
         * @return boolean
         */
        _hasElement : function (elementId) {
            return this._unsafeGetElement(elementId) !== null;
        },
        /**
         * Finds an element by ID.
         *
         * @param string elementId
         * @return HTMLElement
         *   Will be null if an invalid ID is supplied.
         * @throws Error
         *   If element doesn't exist.
         */
        _getElement : function (elementId) {
            var el = this._unsafeGetElement(elementId);
            if (!el) {
                throw new Error("Validation:_getElement: Could not find element #%s".format(elementId));
            }
            return el;
        },
        /**
         * @param string elementId
         * @return mixed
         */
        getElementValue : function (elementId) {
            return Element.getValue(this._getElement(elementId));
        },
        _hasConstraintsFor : function (elementId) {
            return elementId in this.validations;
        },
        /**
         * @param string elementId
         * @return mixed
         *   The value of the form element as returned by Element.getValue.
         * @throws Error
         *   If the element can't be found.
         */
        _getValue : function (elementId) {
            return Element.getValue(this._getElement(elementId));
        },
        /**
         * Attaches onblur events to the form elements specified in the
         * validations object.
         */
        _attachEvents : function () {
            // onblur is used over onchange since tabbing through an item
            // without changing it should still trigger validation.
            for (var elementId in this.validations) {
                var v = this.validations[elementId];
                var allCustom = true;
                for (var i = 0; i < v.length; i++) {
                    allCustom = allCustom && v[i].custom;
                }
                if (allCustom) {
                    continue;
                }

                var element = this._getElement(elementId);

                var validate = this.validateVisible.bind(this, elementId);

                // Delay the event since blur will trigger before change
                // when a checkbox or radio label is clicked.
                if (element.type === "checkbox" || element.type === "radio") {
                    Events.add(element, "blur", validate.wait(1000));
                }
                // Keeping this validation as well means unit tests can
                // be written without taking the timeout into consideration
                // and allows snappier validations in other cases.
                Events.add(element, "blur", validate);

                // Firefox 2 does not trigger the blur event for input file
                // fields. But change does trigger.
                if (Browser.ff2 && element.type === "file") {
                    Events.add(element, "change", validate);
                }
            }
        },
        /**
         * @type string
         *   The suffix used when looking for error containers for elements.
         *   For instance: The default suffix "error" will cause other functions to
         *   select #myelement_error when error messages are to be printed to the UI.
         */
        errorContainerSuffix : "error",
        /**
         * @return string
         */
        _getErrorContainerSuffix : function () {
            return this.errorContainerSuffix;
        },
        setErrorContainerSuffix : function (errorSuffix) {
            this.errorContainerSuffix = errorSuffix;
        },
        _getErrorContainer : function (elementId) {
            return $f("#%s_%s".format(elementId, this._getErrorContainerSuffix()), this.container);
        },
        /**
         * Prints any errors to the associated errorContainer if it exists.
         * The error messages disappear once another onblur triggers and
         * the field is valid.
         *
         * @param string elementId
         */
        _updateView : function (elementId) {
            var errorContainer = this._getErrorContainer(elementId);

            if (!errorContainer) {
                return;
            }
            var violationMessages = this.getViolationMessagesFor(elementId);
            errorContainer.innerHTML = "";

            if (violationMessages.length === 0) {
                errorContainer.style.display = "none";
            } else {
                var ul = tag("ul");
                errorContainer.appendChild(ul);
                Element.setValue(ul, violationMessages);
                errorContainer.style.display = "block";
            }
        },
        /**
         * Checks if an element contains valid data.
         * Does a hidden validation.
         *
         * @param string elementId
         *   The name of the form element to check.
         * @return boolean
         *   Whether the element has valid data.
         */
        isValid : function (elementId) {
            var constraints = this.validations[elementId];

            this.validateHidden(elementId);

            return this.getViolationMessagesFor(elementId).length === 0;
        },
        /**
         * Note: Forces validation of all elements.
         *
         * @return boolean
         *   Whether all elements in the form contains valid data.
         */
        allValid : function () {
            this.validateAll();

            return Object.isEmpty(this.getViolationMessages());
        },
        /**
         * Validates a form element and stores any errors so that they can be
         * accessed through getErrorMessages(For).
         *
         * @param string elementId
         *   The name of the form element.
         * @return boolean
         *   Whether the field is valid.
         */
        validateHidden : function (elementId) {
            function getViolationMsg(constraint) {
                if (constraint.violationMsg instanceof Function) {
                    return constraint.violationMsg();
                } else {
                    return constraint.violationMsg;
                }
            }

            var constraints = this.validations[elementId];
            var element = null;
            var getElement = function () {
                if (!element) {
                    element = this._getElement(elementId);
                }
                return element;
            }.bind(this);
            var value = null;
            var getValue = this._getValue.bind(this, elementId);
            if (!constraints) {
                throw new Error("Validation:validateHidden: No constraints exists for: " + elementId);
            }

            var valid = true;
            delete this.violationMessages[elementId];

            var that = this;
            function addViolation(elementId, violationMsg) {
                that._addViolation(elementId, violationMsg);
                valid = false;
            }

            // Look for a mandatory constraint among the constraints.
            var constraint;
            var continueValidation = true;
            var foundMandatory = false;
            for (var i = 0; i < constraints.length; i++) {
                constraint = constraints[i];

                if (!("mandatory" in constraint)) {
                    continue;
                }

                foundMandatory = true;

                function emptyValue() {
                    var v = getValue();
                    return v === "" || v === null || v === undefined;
                }

                if (constraint.mandatory) {

                    if (constraint.func) {
                        if (constraint.func.call(this, getValue())) {
                            // .
                        } else {
                            addViolation(elementId, getViolationMsg(constraint));
                            continueValidation = false;
                        }
                    }
                    // Checkboxes only need to be checked to satisfy
                    // the condition.
                    else if (getElement().tagName.toLowerCase() === "input"
                            && getElement().type.toLowerCase() === "checkbox") {
                        if (!getElement().checked) {
                            addViolation(elementId, getViolationMsg(constraint));
                            continueValidation = false;
                        }
                    } else if (emptyValue()) {
                        addViolation(elementId, getViolationMsg(constraint));
                        continueValidation = false;
                    }
                } else if (emptyValue()) {
                    continueValidation = false;
                }
                break;
            }

            // If mandatory field wasn't explicitly added its assumed to be
            // false.
            // This means that if a value is left blank and the field isn't
            // mandatory, other validations won't occur.

            // If all constraints are custom, validation must continue since
            // we don't know what the current value is.
            if (constraints.allCustom) {
                continueValidation = true;
            } else if (!foundMandatory && getValue() === "") {
                continueValidation = false;
            }

            if (continueValidation) {
                // Validate each constraint.
                for (var i = 0; i < constraints.length; i++) {
                    constraint = constraints[i];

                    // Mandatory constraints have already been checked.
                    if ("mandatory" in constraint) {
                        continue;
                    }

                    if ("regex" in constraint) {
                        if (!constraint.regex.test(getValue())) {
                            addViolation(elementId, getViolationMsg(constraint));
                        }
                    } else if ("func" in constraint) {
                        var func = constraint.custom
                            ? constraint.func.bind(this)
                            : constraint.func.bind(this, getValue());
                        if (!func()) {
                            addViolation(elementId, getViolationMsg(constraint));
                        }
                    } else {
                        throw new Error("Validation: Each validation must specify a regex or func property.");
                    }
                }
            }

            this.validatedFields.add(elementId);
            return valid;
        },
        /**
         * Validates a field and displays any error messages in the UI, if
         * error containers have been defined.
         *
         * @param string elementId
         * @return boolean
         *   Whether the field is valid.
         */
        validateVisible : function (elementId) {
            var constraints = this.validations[elementId];
            if (!constraints.allCustom) {
                // Stop validation if value hasn't changed.
                var hasPreviousValue = elementId in this.previousValues;
                if (hasPreviousValue) {
                    if (this.previousValues[elementId] === this._getValue(elementId)) {
                        return;
                    }
                }
                this.previousValues[elementId] = this._getValue(elementId);
            }

            var valid = this.validateHidden(elementId);
            this._updateView(elementId);
            this._checkAllValid();
            return valid;
        },
        /**
         * @return natural
         *   The number of elements that have validations.
         */
        _countValidations : function () {
            var i = 0;
            for (var p in this.validations) {
                i++;
            }
            return i;
        },
        /**
         * @return boolean
         *   Whether all fields have been validated at least once.
         */
        allValidated : function () {
            return this.validatedFields.size() === this._countValidations();
        },
        /**
         * Checks whether all validations passed. This is called after each
         * single validation at the moment.
         */
        _checkAllValid : function () {
            if (!this.allValidated()) {
                return;
            }
            var previouslyValid = this.valid;
            var allValid = true;
            for (var p in this.violationMessages) {
                if (this.violationMessages[p].length) {
                    allValid = false;
                    break;
                }
            }
            if (previouslyValid !== allValid) {
                this.valid = allValid;
                this.onValidChanged(allValid);
            }
        },
        /**
         * Forces validation of all form elements. Note that this might create
         * error messages for form fields the user hasn't edited yet.
         */
        validateAll : function () {
            var v = this.validations;
            for (var elementId in v) {
                this.validateVisible(elementId);
            }
        },
        /**
         * @return Map<string elementId, Array<string violationMessage>>
         */
        getViolationMessages : function () {
            return this.violationMessages;
        },
        /**
         * @param string elementId
         * @return Array
         *   An array of all violation messages for a given form element.
         */
        getViolationMessagesFor : function (elementId) {
            return this.violationMessages[elementId] || [];
        },
        /**
         * Adds a violation to the violation message collection.
         *
         * @param string elementId
         * @param string violationMessage
         */
        _addViolation : function (elementId, violationMsg) {
            this.violationMessages[elementId]
                = this.violationMessages[elementId] || [];
            this.violationMessages[elementId].push(
                violationMsg);
        },
        /**
         * Triggers a custom validation failure not related to any constraints.
         * Note that validations has to exist for the given element for this
         * to work. The violation message will disappear as soon as the field
         * is revalidated.
         *
         * @param string elementId
         * @param string violationMsg
         */
        failHidden : function (elementId, violationMsg) {
            this._addViolation(elementId, violationMsg);
        },
        /**
         * Same as failHidden, but shows the error in the UI.
         *
         * @param string elementId
         * @param string violationMsg
         */
        failVisible : function (elementId, violationMsg) {
            this._addViolation(elementId, violationMsg);
            this._updateView(elementId);
        }
    };
    EventSubscription.implement(Validation);

    return Validation;
})();
