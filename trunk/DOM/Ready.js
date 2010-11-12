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
 * Provides a cross browser event for when the DOM has finished loading on a
 * given page. Ready should usually be used over window.onload since it
 * doesn't wait for external resources such as images to finish loading.
 *
 * This module is not part of the test suite since it's hard to verify this
 * functionality.
 */
Cactus.DOM.Ready = (function () {
    var Browser = Cactus.Util.Browser;
    var Events = Cactus.DOM.Events;
    var log = Cactus.Dev.log;

    function Ready () {
        if (Browser.ie) {
            document.write ('<script id=__ie_onload defer ' +
                            'src=javascript:void(0)><\/script>');
            var scriptElement = document.getElementById ("__ie_onload");
            scriptElement.onreadystatechange = (function (scriptElement) {
                if (scriptElement.readyState === "complete") {
                    this._execute();
                }
            }).bind (this, scriptElement);
        } else if (Browser.op || Browser.gecko || Browser.sf3) {
            document.addEventListener("DOMContentLoaded",
                                      this._execute.bind (this), false);
        // Safari 2.0
        } else if ("readyState" in document) {
            this.interval = setInterval ((function () {
                if (/loaded|complete/.test (document.readyState)) {
                    this._execute();
                }
            }).bind (this), 10);
        } else {
            Events.add (window, 'load', this._execute, this);
        }
    } Ready.prototype = {
        /**
         * @type boolean
         *   If the DOM has loaded.
         */
        DOMLoaded : false,
        /**
         * @type Array
         *   Container for all functions that are to be executed.
         */
        functions : [],
        /**
         * Adds a function `f` to the array of functions that are to be executed
         * when Ready occurs. They are called in the scope of `scope`.
         * If Ready has already occured when add is called, `f` is instantly
         * executed.
         *
         * @param Function f
         *   The function to register.
         */
        add : function (f) {
            if (this.DOMLoaded) {
                f();
            } else {
                this.functions.push(f);
            }
        },
        /**
         * Executes all functions that were added.
         */
        _execute : function () {
            this.DOMLoaded = true;
            var func;
            // Go through  all added functions in the  order they were
            // added and then delete the array reference.
            while (func = this.functions.shift ()) {
                func();
            }
            delete this.functions;
            // If an interval was set, clear it and delete the reference.
            if (this.interval) {
                clearInterval (this.interval);
                delete this.interval;
            }
        }
    };

    return new Ready();
})();
