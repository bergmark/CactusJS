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

Cactus.UnitTest.DOM.tag = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var tag = Cactus.DOM.tag;
    var Browser = Cactus.Util.Browser;
    var log = Cactus.Dev.log;

    var tagTC = new UT.TestCase ("DOM.tag");
    tagTC.addTest (new Test (function () {
        this.processResults();
    }, function () {
        var o = tag ("p");
        o = tag ("img", {
            className : "foo",
            id : "bar",
            height : "0",
            width : 5
        });
        // Don't test in IE.
        this.assert(Browser.jscript || o instanceof window.HTMLImageElement);
        this.assertEqual ("foo", o.className);
        this.assertEqual ("bar", o.id);
        this.assertEqual (0,     o.height);
        this.assertEqual (5,     o.width);

        o = tag ("pre", null, "hello!");
        if (!Browser.jscript) {
            //            this.assert (o instanceof window.HTMLPreElement);
        }
        this.assertEqual (1, o.childNodes.length, "wanted 1, got " + o.childNodes.length + " hello! is supposed to be a childNode (textNode)");
        this.assertEqual ("hello!", o.firstChild.nodeValue);

        var a = tag ("a", null, "foo");
        this.assertEqual("foo", a.firstChild.nodeValue);

    }));

    // test adding a number as contents
    tagTC.addTest (new Test (null, function () {
        var e = tag ("span", null, 1);

        this.assert (e.hasChildNodes())
        this.assertEqual("1", e.firstChild.nodeValue);
    }));

    // test making a select tag with a selected option
    tagTC.addTest (new Test (null, function () {
        var select = tag ("select", null, [
            tag ("option", { value : "1" }, "1"),
            tag ("option", { value : "2", selected : "selected" }, "2"),
            tag ("option", { value : "2" }, "3")
        ]);

        this.assertEqual (1, select.selectedIndex,
                          "selectedIndex=1 wanted but got =" +
                          select.selectedIndex);
        this.assertEqual ("2", select.options [select.selectedIndex].value);
    }));

    tagTC.addTest (function () {
        tag ("p", null, ["a string"]);
    });

    tagTC.addTest (function () {
        var checkbox = tag ("input", { type : "checkbox" });
        this.assert (checkbox.value === null ||
                     checkbox.value === "" ||
                     checkbox.value === undefined,
                     "got value: " + checkbox.value);
    });

    // Make sure two radia buttons in a form can't be selected at once.
    tagTC.addTest(function () {
        var a = tag ("input", {
            type : "radio",
            name : "foo",
            value : "a"
        });
        var b = tag ("input", {
            type : "radio",
            name : "foo",
            value : "b"
        });
        var form = tag ("form", null, [a, b]);

        a.checked = true;
        b.checked = true;

        this.assertFalse(a.checked && b.checked,
                         "Both a and b are checked.");
    });

    // Make sure the innerHTML of options are set.
    tagTC.addTest(function () {
        var option = tag("option", {
            value : "value"
        }, "text");
        this.assertEqual("text", option.innerHTML);
    });

    // Should use opacity wrapper to set opacity.
    tagTC.addTest(function () {
        var el = tag("div", {
            style : {
                opacity : "10"
            }
        });
        this.assertEqual("0.1", el.style.opacity);
        // Can only test this in IE.
        this.assert(!Browser.ie || el.style.filter === "alpha(opacity=10)");
    });

    return tagTC;
};
