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
 *
 */
Cactus.MVC.View.TemplateHelpers.ValueTransformers = (function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;
    var $ = Cactus.DOM.select;

    function ValueTransformers(rootElement) {
        this.selectorTransformers = [];
        this.keyPathTransformers = {};
        this.rootElement = rootElement;
    } ValueTransformers.prototype = {
        /**
         * @type Hash<KeyPath,Hash>
         *   The keys are key paths for setting or getting a value, used for
         *   quickly looking up elements. See setValueTransformer documentation.
         */
        keyPathTransformers : null,
        /**
         * @type Array<Hash>
         *   Stores information regarding added value transformers for
         *   specific selectors.
         */
        selectorTransformers : null,
        bindTo : function (dataSource) {
            this.dataSource = dataSource;
        },
        _getDataSource : function () {
            return this.dataSource;
        },
        _getRootElement : function () {
            return this.rootElement;
        },
        /**
         * Transforms a value by using the value transformer
         * assigned to a specific key path. If none is defined
         * the given value is simply returned.
         *
         * @param string keyPath
         * @param mixed value
         */
        transformForKeyPath : function (keyPath, value) {
            if ((keyPath in this.keyPathTransformers)
                && this.keyPathTransformers[keyPath].transform) {
                return this.keyPathTransformers[keyPath].transform(
                    value,
                    this._getDataSource());
            } else {
                return value;
            }
        },
        /**
         * Transforms a value for a specific element. The value should already
         * have been transformed by the key path transformer.
         *
         * @param HTMLElement element
         * @param mixed value
         * @return mixed
         *   The new transformed value, or the old value if no transformer
         *   existed.
         */
        transformForElement : function (element, value) {
            var transformer = this._getSelectorTransformerForElement(element);
            if (!transformer) {
                return value;
            }
            if (transformer.transform) {
                return transformer.transform(value);
            }
            return value;
        },
        /**
         * Does a reverse transformation, from the element to a kvc value.
         * It first goes through any reverseselector transformer, and then
         * through any reverse value transformer.
         *
         * @param string keyPath
         *   The keyPath the element is observing.
         * @param HTMLElement element
         * @param mixed value
         *   The value of the element.
         */
        reverseTransform : function (keyPath, element, value) {
            var transformer = this._getSelectorTransformerForElement(element);
            if (transformer && transformer.reverse instanceof Function) {
                value = transformer.reverse(value);
            }

            if ((keyPath in this.keyPathTransformers) &&
                (this.keyPathTransformers[keyPath].reverse)) {
                value = this.keyPathTransformers[keyPath].reverse(value);
            }

            return value;
        },
        _getSelectorTransformerForElement : function (element) {
            for (var i = 0; i < this.selectorTransformers.length; i++) {
                var h = this.selectorTransformers[i];
                for (var j = 0; j < h.elements.length; j++) {
                    if (element === h.elements[j]) {
                        return h;
                    }
                }
            }
            return null;
        },
        clone : function (rootElement) {
            var clone = new ValueTransformers(rootElement);

            // Clone value transformers.
            for (var p in this.keyPathTransformers) {
                if (this.keyPathTransformers.hasOwnProperty(p)) {
                    var v = this.keyPathTransformers[p];
                    clone.add({
                        keyPath : p,
                        transform : v.transform,
                        reverse : v.reverse
                    });
                }
            }
            for (var p in this.selectorTransformers) {
                if (this.selectorTransformers.hasOwnProperty(p)) {
                    var v = this.selectorTransformers[p];
                    clone.add({
                        selector : v.selector,
                        transform : v.transform,
                        reverse : v.reverse
                    });
                }
            }
            return clone;
        },
        /**
         * Adds a value transformer for the given key path, or css selector.
         * A value transformer maps a value from a KVC property onto a string
         * that is to be displayed in the view. A value transformer can either
         * be set for a key path, in which case every HTML element displaying
         * the property will receive the transformed value. The other case is
         * where the transformation is restricted to one or more, but perhaps
         * not all, elements. This is accomplished by using the selector
         * property.
         *
         * Both types of transformers can be combined, and if they are, the
         * first replacement will be the global one (KVC -> string) and the
         * selector transformer will then do a second transformation
         * (string -> string).
         *
         * @param Hash{
         *   optional keyPath : string,
         *     The key path to add the transformer to.
         *   optional selector : string,
         *     If a key path isn't specified, a selector that matches one or
         *     more elements that have a corresponding key path in the KVC.
         *   transform : Function
         *                 @param mixed value
         *                 @return string value
         *   reverse : Function
         *               @param string value
         *               @return mixed value
         * }
         */
        add : function (option) {
            var keyPath = option.keyPath || option.selector;
            if (option.selector) {
                var selectorTransformers = Collection.select(
                    this.selectorTransformers,
                    function (v) {
                        return v.selector === option.selector;
                    });
                var elements;

                // Overriding an old transformer for this key path.
                if (selectorTransformers.length > 0) {
                    selectorTransformers[0].transform = option.transform;
                    elements = selectorTransformers[0].elements;
                } else {
                    if (option.selector === "root") {
                        elements = [this._getRootElement()];
                    } else {
                        elements = $(option.selector, this._getRootElement());
                    }
                    this.selectorTransformers.push({
                        selector : option.selector,
                        transform : option.transform,
                        reverse : option.reverse,
                        elements : elements
                    });
                }
            } else if (option.keyPath) {
                this.keyPathTransformers[option.keyPath] = {
                    keyPath : option.keyPath,
                    transform : option.transform,
                    reverse : option.reverse
                };
            } else {
                throw new Error("ValueTransformers:add: "
                                + "keyPath or selector must be specified.");
            }
        }
    };

    return ValueTransformers;
})();
