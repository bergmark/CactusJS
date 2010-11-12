/*
 * Copyright (c) 2006-2009, Adam Bergmark
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
 * Wrapper for handling CSS3 opacity cross browser.
 */
Cactus.DOM.Opacity = (function () {
    var log = Cactus.Dev.log;
    var Browser = Cactus.Util.Browser;

    function Opacity() {
    } Opacity.prototype = {
        /**
         * Set CSS3 opacity for a HTMLElement.
         *
         * @param HTMLElement obj
         * @param natural value
         *   0..100 where 0 is invisible and 100 is completely visible.
         */
        set : function (obj, value) {
            obj.style.opacity = "" + (value === 100 ? 99.999 : value) / 100;
            if (Browser.ie) {
                obj.style.filter = 'alpha(opacity=' + value + ')';
            }
        },
        /**
         * Gets CSS3 opacity for a HTMLElement.
         *
         * @param HTMLElement obj
         * @return positive e
         *   0..100 where 0 is invisible and 100 is completely visible.
         *   If opacity hasn't been defined previously, it is assumed that the
         *   opacity is 100.
         */
        get : function (obj) {
            // .style.opacity can be returned either way, since it's
            // always set by Opacity.set().
            return obj.style.opacity ? 100 * parseFloat(obj.style.opacity, 10) : 100;
        }
    };

    return new Opacity();
})();
