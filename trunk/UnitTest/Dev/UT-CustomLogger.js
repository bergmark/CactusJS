/*
 * Copyright (c) 2007-2009, Adam Bergmark
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

Cactus.UnitTest.Dev.CustomLogger = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var CustomLogger = Cactus.Dev.CustomLogger;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;
    var Element = Cactus.DOM.Element;
    var getValue = Element.getValue;
    var $f = Cactus.DOM.selectFirst;

    var tc = new TestCase("Dev.CustomLogger");

    tc.addTest(function () {
        var cl = new CustomLogger();
        var logValue = function () {
            return stringify(getValue(cl.logMessages));
        };

        var els = {
            container : cl.logContainer,
            clear : $f(".log_clear", cl.logContainer),
            width : $f(".log_width", cl.logContainer),
            height : $f(".log_height", cl.logContainer)
        };

        cl.log("log message");
        this.assertEqual(stringify(["log message"]), logValue());
        cl.clear();
        this.assertEqual(stringify([]), logValue());
        cl.log("log message");
        this.assertEqual(stringify(["log message"]), logValue());
        els.clear.click();
        this.assertEqual(stringify([]), logValue());
        cl.log("x");
        Element.setValue(els.width, "100");
        Element.setValue(els.height, "200");
        els.width.onchange();
        els.height.onchange();
        this.assertEqual(100, els.container.offsetWidth);
        this.assertEqual(200, els.container.offsetHeight);
        cl.detach();
    });

    return [tc];
};

