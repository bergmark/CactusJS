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

Cactus.UnitTest.DOM.select = function () {
    var UT = Cactus.Dev.UnitTest;
    var TestCase = UT.TestCase;
    var Test = UT.Test;
    var tag = Cactus.DOM.tag;
    var $ = Cactus.DOM.select;
    var ClassNames = Cactus.DOM.ClassNames;
    var log = Cactus.Dev.log;

    var selectTC = new TestCase ("DOM.select");
    selectTC.setup = function () {
        var html = '<div id="_select_root" class="a">\
                      <ul id="_select_ul" class="a">\
                        <li class="l">a</li>\
                        <li class="l">b</li>\
                        <li class="l">c</li>\
                        <li class="l">d</li>\
                        <li class="l">e</li>\
                      </ul>\
                    </div>';
        this.sandbox = document.getElementById ("sandbox");
        this.sandbox.innerHTML += html;

        var html = '<div id="selectTC_a"><p class="s_a"></p></div>\
            <div id="selectTC_b"><p class="s_b"></p></div>';
        this.sandbox.innerHTML += html;
    };
    selectTC.teardown = function () {
        this.sandbox.removeChild (document.getElementById ("_select_root"));
        this.sandbox.removeChild (document.getElementById ("selectTC_a"));
        this.sandbox.removeChild (document.getElementById ("selectTC_b"));
    }

    // Test getting by ID.
    selectTC.addTest (function () {
        var a = $ ("#_select_root");

        this.assertEqual (1, a.length, "fetched more than one element");
        this.assertEqual ("_select_root", a [0].id);
        this.assertEqual ("a", a [0].className);
    });

    // Get by classname.
    selectTC.addTest (function () {
        var a = $ (".a", this.sandbox);
        var l = $ (".l", this.sandbox);

        this.assertEqual (2, a.length, "Expected two .a's.");
        this.assertEqual (document.getElementById ("_select_root"), a [0]);
        this.assertEqual (document.getElementById ("_select_ul"), a [1]);

        this.assertEqual (5, l.length);
        this.assertEqual ("l", l [0].className);
        this.assertEqual ("a", l [0].firstChild.nodeValue);
        this.assertEqual ("l", l [4].className);
        this.assertEqual ("e", l [4].firstChild.nodeValue);

    });
    // Get by tagname.
    selectTC.addTest (function () {
        var div = $ ("div", this.sandbox);
        var ul  = $ ("ul", this.sandbox);
        var li  = $ ("li", this.sandbox);
        this.assert (div instanceof Array, "div is not an array");
        this.assert (ul instanceof Array, "ul is not an array");
        this.assert (li instanceof Array, "ul is not an array");
        this.assertEqual (3, div.length, "more than one div found");
        this.assertEqual (1, ul.length, "more than one ul found");
        this.assertEqual (5, li.length);

        this.assertEqual ("_select_root", div [0].id);
        this.assertEqual ("_select_ul", ul [0].id);

        this.assertEqual ("l", li [0].className);
        this.assertEqual ("a", li [0].firstChild.nodeValue);
        this.assertEqual ("l", li [4].className);
        this.assertEqual ("e", li [4].firstChild.nodeValue);
    });
    selectTC.addTest (new Test(null, function () { // get by tagname "*"
        var selectRoot = $ ("#_select_root", this.sandbox)[0];
        var els = $ ("*", selectRoot);
        this.assertEqual (6, els.length);
    }));

    // Try selecting from several parents.
    selectTC.addTest (function () {

        var result = $("*", [$("#selectTC_a")[0], $("#selectTC_b")[0]]);

        this.assertEqual(2, result.length);
        this.assertEqual("p", result[0].tagName.toLowerCase());
        this.assertEqual("p", result[1].tagName.toLowerCase());
    });

    // Try a combined path.
    selectTC.addTest (function () {
        var result = $("#sandbox div p");

        this.assertEqual(2, result.length);
        this.assertEqual("p", result[0].tagName.toLowerCase());
        this.assertEqual("p", result[1].tagName.toLowerCase());

        result = $("div p", $("#sandbox"));

        this.assertEqual(2, result.length);
        this.assertEqual("p", result[0].tagName.toLowerCase());
        this.assertEqual("p", result[1].tagName.toLowerCase());
    });

    // Make sure an empty collection is returned if no elements are found.
    selectTC.addTest (function () {
        var root = tag ("div");
        var result = $("#foo", root);
        this.assertEqual (0, result.length);
        this.assertFalse (0 in result);
    });

    // Make sure selecting elements by id works even if the root isn't
    // appended to the document.
    selectTC.addTest (function () {
        var foo = tag ("div", { id : "foo" }, "bar");
        var root = tag ("div", null, foo);
        var result = $("#foo", root);
        this.assertEqual (foo, result[0]);
    });

    // $("body") should return the body.
    selectTC.addTest (function () {
        var b = $("body");
        this.assertEqual (1, b.length);
        this.assertEqual ("body", b[0].tagName.toLowerCase());
    });

    // Don't throw an error if a parent in the selector chain can't be found.
    selectTC.addTest(function () {
        var els = $("#foo #bar");
        this.assertInstance(Array, els);
        this.assertEqual(0, els.length);
    });

    return selectTC;
};
