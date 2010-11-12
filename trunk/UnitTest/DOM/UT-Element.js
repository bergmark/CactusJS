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

Cactus.UnitTest.DOM.Element = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var Element = Cactus.DOM.Element;
    var tag = Cactus.DOM.tag;
    var log = Cactus.Dev.log;
    var $ = Cactus.DOM.select;
    var Collection = Cactus.Util.Collection;
    var $f = Cactus.DOM.selectFirst;
    var JSON = Cactus.Util.JSON;

    var tc = new UT.TestCase('DOM.Element');

    tc.setup = function () {
        this.sandbox = $("#sandbox")[0];
    };

    tc.teardown = function () {
        this.sandbox.innerHTML = "";
    };

    // test setValue
    tc.addTest (function () {
        var div = tag ("div", {}, "foo");
        this.assertEqual ("foo", div.innerHTML);

        // setValue(element)
        Element.setValue (div, "bar");
        this.assertEqual ("bar", div.innerHTML);

        // setValue (ul/ol)
        var ul = tag ("ul");
        for (var i = 0; i < 5; i++) {
            ul.appendChild (tag("li", {}, String (i)));
        }

        var values = ["a", "b", "c", "d"];
        Element.setValue (ul, values);

        var lis = $ ("li", ul);
        var textArray = Collection.map (lis, function (v) {
            return v.innerHTML;
        });
        this.assertEqual ("a,b,c,d", textArray.join(","));


        // setValue (a, string)
        var a = tag ("a", null, "foo");
        var URL = "http://www.example.com/";
        Element.setValue (a, URL);
        this.assertEqual (URL, a.href);
        this.assertEqual ("foo", a.firstChild.nodeValue);

        // setValue (a, Hash)
        var a = tag ("a", null, "foo");
        var URL = "http://www.example.com/";
        Element.setValue (a, { url : URL, text : "bar" });
        this.assertEqual (URL, a.href);
        this.assertEqual ("bar", a.innerHTML);

        // setValue (img)
        var img = tag ("img");
        Element.setValue(img, URL);
        this.assertEqual(URL, img.src);
    });

    // test getValue
    tc.addTest (function () {
        var imgURL = "http://www.example.com/image.gif";
        this.assertEqual (imgURL, Element.getValue (tag ("img", {
            src : imgURL
        })));

        var text = "hello world!";
        this.assertEqual (text, Element.getValue (tag ("span", null, text)));

        var ul = tag ("ul", null, [
            tag ("li", null, "1"),
            tag ("li", null, "2"),
            tag ("li", null, "3")
        ]);

        this.assertEqual ("1,2,3", Element.getValue (ul).join (","));

        var a = tag ("a", { href : imgURL }, "foo");
        this.assertEqual (imgURL, Element.getValue (a).url);
        this.assertEqual ("foo", Element.getValue (a).text);

    });

    // setValue (input:radio)
    tc.addTest (function () {
        var a = tag("input", { type : "radio", name : "foo", value : "a" });
        var b = tag("input", { type : "radio", name : "foo", value : "b" });
        var form = tag("form", null, [a, b]);

        Element.setValue(a, "a");
        this.assert(a.checked, "a was not checked");
        this.assertFalse(b.checked, "b was checked");

        Element.setValue(b, "b");
        this.assert(b.checked, "b was not checked");
        this.assertFalse(a.checked, "a was checked.");

        // Calling setValue on the other radio should work.
        Element.setValue(b, "a");
        this.assertFalse(b.checked, "b was checked.");
        this.assert(a.checked, "a was not checked.");

        // Coerce the value into a string automatically.
        a.value = "1";
        b.value = "2";
        Element.setValue(b, 2);
        this.assertFalse(a.checked);
        this.assert(b.checked);
    });

    // getValue (input:radio)
    tc.addTest (function () {
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

        this.assertEqual ("a", Element.getValue (a));
        this.assertEqual ("a", Element.getValue (b));

        a.checked = false;
        this.assertEqual (null, Element.getValue (a));
    });

    // setValue (input:checkbox)
    tc.addTest (function () {
        var a = tag ("input", {
            type : "checkbox",
            name : "foo",
            value : "bar"
        });

        this.assertFalse (a.checked);

        // Check by providing the value attributes value.
        Element.setValue (a, "bar");
        this.assert (a.checked, "a should be checked");

        a.checked = false;
        // Check by passing a bool.
        Element.setValue (a, true);
        this.assert (a.checked, "a should be checked after setValue(true)");

        // Should break on bad arguments.
        a.checked = false;
        this.assertException (Error, Element.setValue.bind (null, a, {}));

        // Should be checked if value attribute is in array.
        a.checked = false;
        Element.setValue (a, ["bax", "bar"]);
        this.assert (a.checked, "a should be checked after setValue (array)")
    });

    // setValue (input:checkbox) with associated form
    tc.addTest (function () {
        var a = tag ("input", { type : "checkbox", name : "foo", value : "a" });
        var b = tag ("input", { type : "checkbox", name : "foo", value : "b" });
        var form = tag ("form", null, [a, b]);

        this.assertFalse (a.checked);
        this.assertFalse (b.checked);

        Element.setValue (a, true);

        this.assert (a.checked);
        this.assertFalse (b.checked);

        Element.setValue (b, true);
        this.assert (a.checked);
        this.assert (b.checked);

        Element.setValue (a, []);
        this.assertFalse (a.checked, "a is checked");
        this.assertFalse (b.checked, "b is checked");

        Element.setValue (a, ["a", "b"]);
        this.assert (a.checked);
        this.assert (b.checked);

        Element.setValue (a, ["b"]);
        this.assertFalse (a.checked);
        this.assert (b.checked);
    });

    // getValue (input:checkbox)
    tc.addTest (function () {
        var a = tag("input", {
            type : "checkbox",
            name : "foo",
            value : "bar"
        });

        this.assertEqual(0, Element.getValue(a).length,
                           "Wanted an empty array.");

        a.checked = true;
        var result = Element.getValue(a);
        this.assertEqual(1, result.length);
        this.assertEqual("bar", result[0]);

        // The checkbox is the only one, but has an associated form meaning
        // form.elements.name will be the element.
        var form = tag("form", null, a);
        a.checked = true;
        result = Element.getValue(a);
        this.assertEqual(1, result.length);
        this.assertEqual("bar", result[0]);
    });

    // getValue (input:checkbox) with associated checkboxes
    tc.addTest (function () {
        var a = tag ("input", { type : "checkbox", name : "foo", value : "a" });
        var b = tag ("input", { type : "checkbox", name : "foo", value : "b" });

        var form = tag ("form", null, [a, b]);

        a.checked = true;
        b.checked = false;

        this.assertEqual ("a", Element.getValue (a).join (""));
        this.assertEqual ("a", Element.getValue (b).join (""));

        a.checked = true;
        b.checked = true;

        this.assertEqual ("ab", Element.getValue (a).join (""));
    });

    // getValue (select)
    tc.addTest (function () {
        var select = tag ("select", null, [
            tag ("option", { value : "1" }, "a"),
            tag ("option", { value : "2", selected : "selected" }, "b"),
            tag ("option", { value : "2" }, "c")
        ]);

        this.assertEqual ("2", Element.getValue (select));
    });

    // setValue (select, atom)
    tc.addTest (function () {
        var select = tag("select", null, [
            tag("option", { value : "foo", selected : true }, "a"),
            tag("option", { value : "bar" }, "b")
        ]);

        Element.setValue(select, "bar");
        this.assertEqual("bar", Element.getValue(select));

        // Allow integer values to be set without forcing the client to convert
        // them to strings before the setValue call.
        var select = tag("select", null, [
            tag("option", { value : "1", selected : true }, "a"),
            tag("option", { value : "2" }, "b")
        ]);
        Element.setValue(select, 2);
        this.assertEqual("2", Element.getValue(select));
    });

    // getValue (select:multiple)
    tc.addTest (function () {
        var div = tag("div");
        div.innerHTML = '<select multiple="multiple">\
            <option value="foo" selected="selected">a</option>\
            <option value="bar">b</option>\
            <option value="baz" selected="selected">c</option>\
          </select>';
        this.assertEqual("foo baz",
                         Element.getValue($f("select", div)).join(" "));
    });
    // setValue(select:multiple)
    tc.addTest(function () {
        var div = tag("div");
        div.innerHTML = '<select multiple="multiple">\
            <option value="foo">a</option>\
            <option value="bar">b</option>\
            <option value="baz" selected="selected">c</option>\
        </select>';
        var select = $f("select", div);
        Element.setValue(select, ["foo", "baz"]);
        this.assertEqual("foo baz",
                         Element.getValue($f("select", div)).join(" "));
    });

    // setValue (input)
    // getValue (input)
    tc.addTest (function () {
        var input = tag ("input", { type : "text", value : "foo" });
        Element.setValue (input, "bar");
        this.assertEqual ("bar", input.value);
        this.assertEqual ("bar", Element.getValue (input));
    });

    // setValue (textarea)
    // getValue (textarea)
    tc.addTest (function () {
        var textarea = tag ("textarea", { value : "foo" });

        this.assertEqual ("foo", Element.getValue (textarea));

        Element.setValue (textarea, "foobar");
        this.assertEqual ("foobar", Element.getValue (textarea));

        Element.setValue (textarea, "foo\nbar");
        this.assertEqual ("foo\nbar", Element.getValue (textarea));
    });

    // setValue (input:password)
    // getValue (input:password)
    tc.addTest (function () {
        var p = tag ("input", { type : "password", name : "x", value : "a" });

        this.assertEqual ("a", Element.getValue (p));
        Element.setValue (p, "b");
        this.assertEqual ("b", Element.getValue (p));
    });

    // setValue(option)
    // getValue(option)
    tc.addTest(function () {
        var option = tag("option", {
            value : "a"
        }, "b");
        function getVal() {
            return JSON.stringify(Element.getValue(option));
        }

        this.assertEqual('{"value":"a","text":"b"}', getVal());
        Element.setValue(option, {
            value : "c",
            text : "d"
        });
        this.assertEqual('{"value":"c","text":"d"}', getVal());
    });

    // setValue and getValue should not break if methods are not bound to Element.
    tc.addTest(function () {
        Element.getValue.curry(tag("ul"))();
        Element.setValue.curry(tag("ul"), [1,2,3])();
    });

    return tc;
};
