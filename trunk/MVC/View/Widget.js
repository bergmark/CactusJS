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
 * A widget can be used stand-alone or be added onto a template.
 * When instantiated it is assigned a root element that it takes ownership of.
 * The object owning the widget may insert new values into the widget by calling
 * setValue(value), the values that may be sent must be taken into account by
 * the client.
 *
 * A widget that can write a value can be created by letting the client pass a
 * setter function that sets the appropriate value when
 * For now, setting values is only possible one way, meaning widgets are read
 * only. This will be changed later.
 */
Cactus.MVC.View.Widget = (function () {
    var log = Cactus.Dev.log;

    /**
     */
    function Widget() {
    } Widget.prototype = {
        /*
         * @param HTMLElement rootElement
         *   The element the widget should use to display information.
         */
        bindTo : function (rootElement) {
            this.rootElement = rootElement;
            this._setup();
        },
        /**
         * @type HTMLElement
         *   The element of the template that uses the widget. The widget
         *   gets full control of this element, so the client may not make
         *   any assumptions of the contents.
         */
        rootElement : null,
        /**
         * The client passes values to setValue and the widget updates itself.
         *
         * @param mixed value
         */
        setValue : function (value) {
            // .
        },
        /**
         * This triggers as soon as the template is bound to a root element.
         * It is abstract. Its purpose is to set up any DOM structures and
         * initial data. It can be executed several times since the root element
         * may change.
         */
        _setup : function () {
            // .
        },
        /**
         * @return HTMLElement
         */
        _getRootElement : function () {
            return this.rootElement;
        },
        /**
         * Creates a new widget instance that behaves exactly like the current
         * one.
         */
        clone : function () {
            return new this.constructor();
        }
    };

    return Widget;
})();
