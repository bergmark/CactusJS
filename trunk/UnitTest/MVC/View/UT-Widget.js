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

Cactus.UnitTest.MVC.View.Widget = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Widget = Cactus.MVC.View.Widget;
    var tag = Cactus.DOM.tag;
    var $f = Cactus.DOM.selectFirst;
    var KVC = Cactus.Util.KeyValueCoding;

    function ProgressBar() {
    } ProgressBar.prototype = {
        _setup : function () {
            var rootElement = this._getRootElement();

            var barContainer = tag("div", {
                className : "widget_progressBar_container"
            });
            var bar = tag("div", {
                className : "widget_progressBar_bar"
            });

            rootElement.appendChild(barContainer);
            barContainer.appendChild(bar);

            this.barContainer = barContainer;
            this.bar = bar;
        },
        setValue : function (v) {
            var width = this.barContainer.offsetWidth;
            this.bar.style.width = (v * width) + "px";
        }
    };
    ProgressBar.extend(Widget);

    var tc = new TestCase("MVC.View.Widget");
    tc.teardown = function () {
        $f("#sandbox").innerHTML = "";
    };

    tc.addTest(function () {
        var rootElement = tag("div");
        var sandbox = $f("#sandbox")
        sandbox.appendChild(rootElement);

        var w = new ProgressBar();
        w.bindTo(rootElement);

        // Simulate style sheets.
        var barContainer = $f(".widget_progressBar_container", rootElement);
        var bar = $f(".widget_progressBar_bar", rootElement);
        rootElement.style.width = "200px";
        barContainer.style.width = "200px";

        this.assert("setValue" in w);
        w.setValue(0);
        this.assertEqual(0, bar.offsetWidth);
        w.setValue(0.5);
        this.assertEqual(100, bar.offsetWidth);
    });

    // Should support cloning.
    tc.addTest(function () {
        var wRoot = tag("div");
        var w2Root = tag("div");
        wRoot.style.width = "200px";
        w2Root.style.width = "200px";
        var sandbox = $f("#sandbox");
        sandbox.appendChild(wRoot);
        sandbox.appendChild(w2Root);
        var w = new ProgressBar();
        w.bindTo(wRoot);
        w.setValue(1);
        var w2 = w.clone();
        w2.bindTo(w2Root);
        w2.setValue(0.5);

        this.assertEqual(200, $f(".widget_progressBar_bar",
                                 wRoot).offsetWidth);
        this.assertEqual(100, $f(".widget_progressBar_bar",
                                 w2Root).offsetWidth);
    });

    // Writable widget.
    tc.addTest(function () {
        function WriteW(setter) {
            this.setter = setter;
        } WriteW.prototype = {
            value : null,
            setValue : function (value) {
                this.value = value;
            },
            _writeValue : function (value) {
                this.setter(value);
            },
            _setup : function () {

            }
        };
        WriteW.extend(Widget);

        var mainO = new KVC();
        mainO.a = 10;

        var root = tag("div");
        var w = new WriteW(mainO.setValue.bind(mainO, "a"));
        w.bindTo(root);
        w._writeValue(20);
        this.assertEqual(20, mainO.getValue("a"));
    });

    return [tc];
};
