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
 * Provides a wrapper for the events object.
 */
Cactus.DOM.Event = (function () {
    var log = Cactus.Dev.log;
    var Browser = Cactus.Util.Browser;

    function Event (e) {
        this.e = e || window.event;
    } Event.prototype = {
        /**
         * @type Object
         *   A DOM event object.
         */
        e : null,
        /**
         * @return HTMLElement
         *   The innermost element where the event triggered.
         */
        getTarget : function () {
            // event.srcElement for IE and e.target for the rest.
            return this.e.target || this.e.srcElement;
        },
        // How to retrieve the mouse position:
        //        | x/y | clientX/clientY
        // IE6    | Y   | Y
        // IE7    | Y   | Y
        // OP9.50 | Y   | Y
        // FF2    | N   | Y
        // FF3    | N   | Y
        // SF3    | Y   | Y
        /**
         * Scrolling may or may not be taken into account.
         *
         * @return natural
         */
        getMouseX : function () {
            return this.e.clientX;
        },
        /**
         * Scrolling may or may not be taken into account.
         *
         * @return natural
         */
        getMouseY : function () {
            return this.e.clientY;
        },
        __getScroll : function () {
            // /C=standards compliance mode
            // Otherwise quirks mode.
            //
            // Y=Correct value.
            // N=null/undefined.
            // I=Is always 0.
            //                                  | FF | FF/C | OP | OP/C | SF |  SF/C | IE6 | IE6/C | IE7 | IE7/C |
            // window.pageX/YOffset             |  Y |  Y   | Y  |  Y   | Y  |   Y   |  N  |   N   |  N  |   N   |
            // document.body.scrollLeft/Top     |  Y |  I   | Y  |  I   | Y  |   Y   |  Y  |   I   |  Y  |   I   |
            // d.documentElement.scrollLeft/Top |  I |  Y   | I  |  Y   | I  |   I   |  I  |   Y   |  I  |   Y   |
            var x;
            var y;

            if (Browser.ie) {
                x = Math.max(document.documentElement.scrollLeft || 0,
                             document.body.scrollLeft || 0);
                y = Math.max(document.documentElement.scrollTop || 0,
                             document.body.scrollTop || 0);
            } else {
                x = window.pageXOffset;
                y = window.pageYOffset;
            }

            return {
                x : x,
                y : y
            };
        },
        getScrollX : function () {
            return this.__getScroll().x;
        },
        getScrollY : function () {
            return this.__getScroll().y;
        }
    };

    return Event;
})();
