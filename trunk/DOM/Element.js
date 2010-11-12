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
 * Provides a flyweight instance for setting and getting values of HTML
 * Elements.
 * The focus is on form elements, it gives the opportunity to map properties of
 * an object onto HTML elements. For instance if we have a list of values, we
 * can show it in a HTML list with Element.setValue(htmlList, array). If we have
 * a group of checkboxes we can pass in the value of one of the checkboxes to
 * check it, or an array of values to check several.
 *
 * See the method documentation for all possible arguments.
 */
Cactus.DOM.Element = (function () {
    var $ = Cactus.DOM.select;
    var tag = Cactus.DOM.tag;
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;

    function Element () {
    } Element.prototype = {
        /**
         * Takes a HTMLElement and a value and adds the value
         * to the element appropriately. The behavior is
         * defined for arbitrary elements as setting their
         * innerHTML property.
         *
         * Tags that are treated special are:
         * a
         *   If a non-Object is passed in, it is set as the element's href.
         *   if an Object is passed, it's assumed to have url and text
         *   properties, which set href and innerHTML respectively.
         * img
         *   The src is set.
         * ol/ul
         *   The list is emptied and the value is assumed to be a
         *   collection, each item in the collection is placed in a li.
         * input
         *   radio:
         *     The radio is checked if the argument matches the radios value.
         *     If the radio has an associated form, every radio with the same
         *     name is checked for the value.
         *   checkbox:
         *      Array arg:
         *        All associated checboxes (checkboxes with the same name inside
         *        the same form) are checked if their value is in the
         *        array, otherwise they're unchecked.
         *        If the checkbox doesn't have a form associated with it, only
         *        its checked property is set.
         *      string arg:
         *        Checked is set if the argument matches the checkbox's value.
         *      bool arg:
         *        Box is checked/unchecked to match the argument.
         *   password:
         *     Uses default.
         *   default:
         *     the value attribute is set
         * select
         *   If value is a collection, the select is emptied and refilled
         *   with the options. the elements should be Hashes with value/text
         *   properties.
         * option
         *   Argument should be Hash{
         *       value : string,
         *       optional text : string
         *   }
         *   Sets the value of the option to the value of `value`.
         *   Sets the innerHTML if text is supplied.
         * textarea
         *   The value is supposed to be a string and is set as the value
         *   attribute.
         *
         *   Otherwise any option with a value attribute matching +value+
         *   will be selected, or an Error is thrown if none is found.
         *
         * @param HTMLElement element
         *   The element to set the value on
         * @param mixed value
         *   The value to set to the element (type varies depending on element
         *   type.)
         */
        setValue : function (element, value) {
            switch (element.tagName.toLowerCase()) {
            case "a":
                if (value instanceof Object) {
                    element.href = value.url;
                    element.innerHTML = value.text;
                } else {
                    element.href = value;
                }
                break;
            case "img":
                element.src = value;
                break
            case "ol": case "ul":
                while (element.hasChildNodes()) {
                    element.removeChild (element.firstChild);
                }
                for (var i = 0; i < value.length; i++) {
                    element.appendChild (tag ("li", null, String (value [i])));
                }
                break;
            case "input":
                switch (element.type) {
                case "radio":
                    var elements = [element];
                    if (element.form) {
                        elements = element.form.elements[element.name];
                    }
                    for (var i = 0; i < elements.length; i++) {
                        elements[i].checked = elements[i].value === String(value);
                    }
                    break;
                case "checkbox":
                    if (value instanceof Array) {
                        if (element.form) {
                            var elements = element.form.elements[element.name];
                            for (var i = 0; i < elements.length; i++) {
                                elements [i].checked =
                                    Collection.hasValue(value,
                                                        elements [i].value);
                            }
                        } else {
                            element.checked =
                                Collection.hasValue(value,
                                                    element.value);
                        }
                    }
                    else if (typeof value === "string") {
                        element.checked = element.value === value;
                    } else if (typeof value === "boolean") {
                        element.checked = value;
                    } else {
                        throw new Error("Invalid argument given to Element.setValue: " + value);
                    }
                    break;
                default:
                    element.value = value;
                    break;
                }
                break;
            case "select":
                var options = element.options;

                if (typeof value === "number") {
                    value = value.toString();
                }

                if (Collection.isCollection(value)) {
                    for (var i = 0; i < options.length; i++) {
                        if (Collection.hasValue(value, options[i].value)) {
                            options[i].selected = true;
                        }
                    }
                } else {
                    for (var i = 0; i < options.length; i++) {
                        if (options[i].value === value) {
                            options[i].selected = true;
                            return;
                        }
                    }
                    throw new Error('Could not find an option with value = "%s"'.format(value));
                }
                break;
            case "option":
                element.value = value.value;
                if ("text" in element) {
                    element.innerHTML = value.text;
                }
                break;
            case "textarea":
                element.value = value;
                break;
            default :
                // Insert as text.
                element.innerHTML = value;
                break;
            }
        },
        /**
         * Gets an array of values of objects from child nodes with a specific
         * tag name.
         *
         * @param HTMLElement element
         * @param string childTagName
         *   The tag name of the child nodes, case-insensitive.
         */
        _getValueArray : function (element, childTagName) {
            var a = Collection.select (element.childNodes, function (v) {
                return v.tagName.toLowerCase() === childTagName.toLowerCase();
            });
            var self = this;
            a = Collection.map (a, function (v) {
                return self.getValue(v);
            });
            return a;
        },
        /**
         * Returns a value for an element, it corresponds to the values passed
         * to setValue.
         *
         * a
         *   Returns a Hash with url and text properties.
         * img
         *   Returns the src.
         * ol/ul
         *   Returns an array of getValue called on all LI children.
         * input
         *   checkbox:
         *     Returns an array of all checked checkboxes with the same name
         *     if associated to a form, otherwise just checks the given
         *     checkbox, but still returns an array.
         *   radio:
         *     Fetches the checked radio from the radio's form and returns that
         *     value. Returns null if no radio is checked.
         *   password:
         *     Uses default.
         *   default:
         *     Returns the value of the value attribute.
         * select
         *   Returns the value of the selected option, or undefined if none is
         *   selected.
         *   For multiple selects, an array of selected values is returned.
         * option
         *   Hash{
         *       value : string,
         *       text : string
         *   }
         *   The value attribute as `value` and the innerHTML as `text`.
         * textarea
         *   The string value is returned.
         */
        getValue : function (element) {
            switch (element.tagName.toLowerCase()) {
            case "a":
                return {
                    url : element.href,
                    text : element.innerHTML
                };
                break;
            case "img":
                return element.src;
                break;
            case "ol": case "ul":
                return this._getValueArray(element, "li");
                break;
            case "input":
                switch (element.type) {
                case "checkbox":

                    var elements = [element];
                    if (element.form &&
                        !("tagName" in element.form.elements[element.name])) {
                        elements = element.form.elements[element.name];
                    }
                    var values = [];
                    for (var i = 0; i < elements.length; i++) {
                        if (elements[i].checked) {
                            values.push(elements[i].value);
                        }
                    }
                    return values;
                    break;
                case "radio":
                    if (element.checked) {
                        return element.value;
                    }

                    var radios = [element];
                    if (element.form && element.name) {
                        radios = element.form.elements[element.name];
                    }
                    for (var i = 0; i < radios.length; i++) {
                        if (radios[i].checked) {
                            return radios[i].value;
                        }
                    }

                    return null;

                    break;
                default:
                    return element.value;
                    break;
                }
            case "option":
                return {
                    value : element.value,
                    text : element.innerHTML
                }
                break;
            case "select":
                if (element.multiple) {
                    var values = [];
                    for (var i = 0; i < element.options.length; i++) {
                        if (element.options[i].selected) {
                            values.push(element.options[i].value);
                        }
                    }
                    return values;
                } else {
                    var option = element.options [element.selectedIndex];
                    return option.value;
                }
                break;
            case "textarea":
                if (!element.value) {
                    return "";
                }

                // Remove \r so that only \n is used for line breaks.
                return element.value.replace("\r","");
                break;
            default:
                return element.innerHTML;
                break;
            }
        }
    };

    var element = new Element();
    // This is defined to allow set/getValue to be called without being bound
    // to the Element instance.
    element.setValue = element.setValue.bind(element);
    element.getValue = element.getValue.bind(element);

    return element;
})();
