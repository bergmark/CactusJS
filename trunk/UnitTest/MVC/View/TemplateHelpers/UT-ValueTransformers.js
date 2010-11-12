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

Cactus.UnitTest.MVC.View.TemplateHelpers.ValueTransformers = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var ValueTransformers = Cactus.MVC.View.TemplateHelpers.ValueTransformers;
    var KVC = Cactus.Util.KeyValueCoding;
    var Template = Cactus.MVC.View.Template;
    var $ = Cactus.DOM.select;
    var $f = Cactus.DOM.selectFirst;
    var Element = Cactus.DOM.Element;

    var tc = new TestCase("MVC.View.TemplateHelpers.ValueTransformers");

    function O(x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
    } O.prototype = {
        x : 1,
        y : 2,
        setY : function (y) {
            this.y = y + 1;
        },
        getY : function () {
            return this.y * -1;
        }
    }; KVC.implement (O);

    function get(template, selector) {
        return $f(selector, template.getRootElement());
    }
    function valueOf(template, selector) {
        return parseInt(Element.getValue(get(template, selector)), 10);
    }

    // Test value transformers.
    tc.addTest (new Test (null, function () {
        var o = new O();

        var t = Template.create('<div>'
                                +  '<h1 class="x"></h1>'
                                +  '<h2 class="y"></h2>'
                                + '</div>');
        t.bindTo(o);
        var root = t.getRootElement();

        var h1 = $("h1", root)[0];
        var h2 = $("h2", root)[0];

        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                return v * 2;
            }
        });
        o.setValue ("x", 10);
        this.assertEqual ("20", Element.getValue(h1)); // String(10*2) => "20"

        t.setValueTransformer ({
            keyPath : "y",
            transform : function (v) {
                return v * 3;
            }
        });
        o.setValue ("y", 20);
        // (20 + 1) * -1 * 3 = 21*-3 = -63.
        this.assertEqual ("-63", Element.getValue(h2));

        // The second argument to a transform function should be the KVC object.
        var test = this;
        var triggered = false;
        t.setValueTransformer({
            keyPath : "y",
            transform : function (v, kvc) {
                test.assertEqual(o, kvc);
                triggered = true;
                return v;
            }
        });
        this.assert(triggered, "Value transformer did not trigger.");
    }));

    // Value transformers should be able to be set based on the selector the
    // data is displayed in as well as by key path.
    tc.addTest(function () {
        var t = Template.create('\
          <div class="root">\
            <div class="foo"><div class="x"></div></div>\
            <div class="bar"><div class="x"></div></div>\
          </div>\
        ');

        var o = new O(5);

        // This test tries set different value transformers for .foo .x and
        // .bar .x.
        t.setValueTransformer({
            selector : ".foo .x",
            transform : function (v) {
                return v * 10;
            }
        });
        t.bindTo(o);
        var root = t.getRootElement();
        this.assertEqual("50", Element.getValue($f(".foo .x", root)));
        this.assertEqual("5", Element.getValue($f(".bar .x", root)));

        // Set after binding.
        t.setValueTransformer({
            selector : ".bar .x",
            transform : function (v) {
                return v * 5;
            }
        });
        this.assertEqual("25", Element.getValue($f(".bar .x", root)));
    });

    // If both key path transformers and selector transformers exist for an
    // element, they should both be performed, and in that order.
    tc.addTest(function () {
        var t = Template.create('<div><div class="x"></div></div>');
        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                return Math.abs(v);
            }
        });
        t.setValueTransformer({
            selector : ".x",
            transform : function (v) {
                return Math.sqrt(v);
            }
        });
        var o = new O(-4);
        t.bindTo(o);

        this.assertEqual("2", Element.getValue($f(".x", t.getRootElement())));
    });

    // All selectors should be able to include the root.
    tc.addTest(function () {
        var t = Template.create('<div class="x"></div>');
        t.setValueTransformer({
            selector : "root",
            transform : Math.sqrt
        });
        var o = new O(4);
        t.bindTo(o);
        this.assertEqual("2", Element.getValue(t.getRootElement()));
    });


    // Selector transformers should be cloned, too.
    tc.addTest(function () {
        var t = Template.create('<div><div class="x"></div></div>');
        t.setValueTransformer({
            selector : ".x",
            transform : Math.sqrt
        });
        var o = new O(4);
        var t2 = Template.create(t);
        t2.bindTo(o);
        this.assertEqual("2", Element.getValue($f(".x", t2.getRootElement())));
    });

    // Several transformers should not be able to exist for the same
    // keyPath/selector, and later modifications should overwrite previous ones.
    tc.addTest(function () {
        var t = Template.create(
            '<div><h1 class="x"></h1></div>', {
                valueTransformers : [{
                    selector : ".x",
                    transform : function (v) {
                        return v + "b";
                    }
                }, {
                    keyPath : "x",
                    transform : function (v) {
                        return v + "a";
                    }
                }],
                kvcBinding : new O("_")
            });
        t.setValueTransformer({
            selector : ".x",
            transform : function (v) {
                return v + "d";
            }
        });
        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                return v + "c";
            }
        });
        this.assertEqual("_cd", Element.getValue($f(".x", t.getRootElement())));
    });

    // Create syntax for both selector and keypath.
    tc.addTest(function () {
        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>', {
                valueTransformers : [{
                    selector : ".y",
                    transform : Math.sqrt
                }, {
                    keyPath : "x",
                    transform : Math.sqrt
                }],
                kvcBinding : new O(4, -9)
            });
        var root = t.getRootElement()
        this.assertEqual("2", Element.getValue($f(".x", root)));
        this.assertEqual("3", Element.getValue($f(".y", root)));
    });

    // key path transformers should be applied before selector transformers.
    tc.addTest(function () {
        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>', {
                valueTransformers : [{
                    selector : ".x",
                    transform : Math.sqrt
                }, {
                    keyPath : "x",
                    transform : Math.abs
                }],
                kvcBinding : new O(-4)
            });
        this.assertEqual("2", Element.getValue($f(".x", t.getRootElement())));
    });

    // Value transformers should be cloned when the template is cloned.
    tc.addTest(function () {
        var o = new O(10);

        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>');
        t.bindTo(o);
        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                return v * 2;
            }
        });
        this.assertEqual("20",
                         Element.getValue($("h1", t.getRootElement())[0]));

        var t2 = Template.create(t);
        t2.bindTo(o);
        this.assertEqual(String(10 * 2),
                         Element.getValue($("h1", t2.getRootElement())[0]));
    });

    // Value transformers should be able to be set before the template is bound
    // to a KVC.
    tc.addTest (function () {
        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>');
        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                return v * 2;
            }
        });
        var o = new O();
        t.bindTo(o);
        o.setValue("x", 10);
        this.assertEqual("20",
                         Element.getValue($(".x", t.getRootElement())[0]));
    });

    // Transformations should be reversible.
    tc.addTest(function () {
        var o = new KVC();
        o.x = -4;
        o.y = -9;
        o.z = 1;
        o.w = 16;
        var t = Template.create('\
         <div>\
           <input class="x" type="text">\
           <input class="y" type="text">\
           <input class="z" type="text">\
           <input class="w" type="text">\
         </div>', {
             valueTransformers : [{
                 keyPath : "x",
                 transform : Math.abs,
                 reverse : Math.sqrt
             }, {
                 selector : ".y",
                 transform : Math.abs,
                 reverse : Math.sqrt
             }, {
                 selector : ".z"
                 // Omitting both transformers.
             },
             // Both types of reverse transformers.
             {
                 keyPath : "w",
                 reverse : function (v) {
                     return -v;
                 }
             }, {
                 selector : ".w",
                 reverse : Math.sqrt
             }],
             kvcBinding : o
         });

        // Key path transformer.
        this.assertEqual(4, valueOf(t, ".x"));
        get(t, ".x").onchange();
        this.assertEqual(2, valueOf(t, ".x"));
        // Selector transformer.
        this.assertEqual(9, valueOf(t, ".y"));
        get(t, ".y").onchange();
        this.assertEqual(3, valueOf(t, ".y"));
        // Omitting the regular transformer (the `transform` property).
        this.assertEqual(1, valueOf(t, ".z"));
        // Selector transformers should be executed before
        // key path transformers.
        this.assertEqual(16, valueOf(t, ".w"));
        get(t, ".w").onchange();
        this.assertEqual(-4, o.getValue("w"));
        this.assertEqual(-4, valueOf(t, ".w"));

        // Cloning of reverse transformers,
        // checking both selector and value transformers.
        var t2 = Template.create(t);
        t2.bindTo(o);
        o.setValue("w", 16);
        this.assertEqual(16, valueOf(t2, ".w"));
        get(t2, ".w").onchange();
        this.assertEqual(-4, o.getValue("w"));
        this.assertEqual(-4, valueOf(t2, ".w"));
    });

    // Regression test for a bug that caused the reverse transformer's value
    // to be set to the event object.
    tc.addTest(function () {
        var o = new KVC();
        o.foo = "";
        var value;
        var t = Template.create('<div><input type="text" class="foo"></div>', {
            kvcBinding : o,
            valueTransformers : [{
                keyPath : "foo",
                reverse : function (v) {
                    value = v;
                }
            }]
        });
        var input = get(t, ".foo");
        input.value = "bar";
        input.onchange("baz");
        this.assertEqual("bar", value);
    });

    return [tc];
};
