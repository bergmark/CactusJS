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

Cactus.UnitTest.MVC.View.Template = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var Template = Cactus.MVC.View.Template;
    var tag = Cactus.DOM.tag;
    var KVC = Cactus.Util.KeyValueCoding;
    var $ = Cactus.DOM.select;
    var Element = Cactus.DOM.Element;
    var log = Cactus.Dev.log;
    var ClassNames = Cactus.DOM.ClassNames;
    var Widget = Cactus.MVC.View.Widget;
    var $f = Cactus.DOM.selectFirst;
    var CN = ClassNames;

    var templateTC = new TestCase("MVC.View.Template");

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

    templateTC.teardown = function () {
        $f("#sandbox").innerHTML = "";
    }

    function get(template, selector) {
        if (selector === "root") {
            return template.getRootElement();
        }
        return $f(selector, template.getRootElement());
    }
    function valueOf(template, selector) {
        return parseInt(Element.getValue(get(template, selector)), 10);
    }
    function setV(template, selector, value) {
        var el = get(template, selector);
        Element.setValue(el, value);
        el.onchange();
    }

    // Test Template.create.
    templateTC.addTest (new Test (null, function  () {
        var t = Template.create("<div><p></p></div>");
        this.assertEqual ("div", t.getRootElement().tagName.toLowerCase());
        var t2 = Template.create(t);
        this.assertFalse (t === t2, "t was not cloned to t2");
        this.assertEqual ("div", t2.getRootElement().tagName.toLowerCase());

        var t3 = Template.create (tag ("div", {}, tag ("p")));
        this.assertEqual ("div", t3.getRootElement().tagName.toLowerCase());

        var o = new O();
        var t4 = Template.create(t);
        t4.bindTo(o);
        this.assertEqual (o, t4._getDataSource());
    }));

    // Make sure Template.create(element) does not clone element.
    templateTC.addTest (function () {
        var o = tag("div");

        var t = Template.create(o);

        this.assert (o === t.getRootElement(),
                     "Template.create(element) clones the element");
    });

    // Assert that the template is updated when the KVC is, and that
    // the correct values are inserted.
    templateTC.addTest (new Test (null, function () {
        var dataSource = new O();

        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>');
        t.bindTo(dataSource);
        this.assertEqual(dataSource, t._getDataSource());
        var root = t.getRootElement();

        var h1 = $f("h1", root);
        var h2 = $f("h2", root);

        this.assertEqual (1, dataSource.getValue("x"));
        this.assertEqual ("1", Element.getValue(h1));
        this.assertEqual ("-2", Element.getValue(h2));
        dataSource.setValue ("x", 5);
        this.assertEqual ("5", Element.getValue(h1));
        dataSource.setValue ("y", 9);
        this.assertEqual (-10, dataSource.getValue ("y"));
        this.assertEqual ("-10", Element.getValue(h2), "h2");
    }));

    // Test read/write on text fields.
    templateTC.addTest(function () {
        var t = Template.create(
            '<div><input type="text" name="foo" class="foo" value=""></div>');
        var kvc = new KVC();
        kvc.foo = "bar";
        t.bindTo(kvc);
        var foo = $(".foo", t.getRootElement())[0];
        this.assertEqual("bar", Element.getValue(foo));

        foo.value = "baz";
        foo.onchange();
        this.assertEqual ("baz", kvc.getValue ("foo"));
        this.assertEqual ("baz", Element.getValue (foo));
    });

    // Read/write on password fields.
    templateTC.addTest(function () {
        var t = Template.create(
            '<div><input type="password" name="foo" class="foo" value=""></div>');
        var kvc = new KVC();
        kvc.foo = "bar";
        t.bindTo(kvc);
        var foo = $(".foo", t.getRootElement())[0];
        this.assertEqual("bar", Element.getValue(foo));

        foo.value = "baz";
        foo.onchange();
        this.assertEqual("baz", kvc.getValue("foo"));
        this.assertEqual("baz", Element.getValue(foo));
    });

    // Test toggling a bool with a read/write check box.
    templateTC.addTest (function () {
        var t = Template.create ('\
            <div>\
                <input type="checkbox" name="foo" class="foo" value="bar">\
            </div>');
        var kvc = new KVC();
        kvc.foo = true;
        t.bindTo (kvc);

        var box = $(".foo", t.getRootElement())[0];

        function simulateClick() {
            box.checked = !box.checked;
            box.onclick();
        }

        this.assert ("onclick" in box, "Box has no onclick.");

        this.assert (box.checked, "initial checked");
        simulateClick();
        this.assertEqual(false, kvc.getValue("foo"), "Foo is not false.");
        this.assertFalse (box.checked, "Box is checked.");


        simulateClick();
        this.assert (box.checked, "Box is not checked.");
        this.assertEqual(true, kvc.getValue("foo"), "Foo is not true.");
    });

    // Checkbox read/write events should go through reverse value transformers.
    templateTC.addTest(function () {
        var t = Template.create ('\
            <div>\
                <input type="checkbox" name="foo" class="foo" value="bar">\
            </div>', {
            // Negate the value of the key path, going both ways.
            valueTransformers : [{
                keyPath : "foo",
                transform : function (v) {
                    return !v;
                },
                reverse : function (v) {
                    return !v;
                }
            }]
        });

        var box = get(t, ".foo");
        function simulateClick() {
            box.checked = !box.checked;
            box.onclick();
        }

        var kvc = new KVC();
        kvc.foo = true;
        t.bindTo(kvc);

        this.assert(kvc.foo);
        this.assertFalse(box.checked);

        simulateClick();

        this.assertFalse(kvc.foo, "foo is true");
        this.assert(box.checked, "box is not checked");

    });

    // Read/Write for several associated checkboxes.
    templateTC.addTest (function () {
        var t = Template.create ('\
            <div>\
              <form>\
                <input type="checkbox" name="foo[]" class="foo" value="a">\
                <input type="checkbox" name="foo[]" class="foo" value="b">\
              </form>\
            </div>\
        ');
        var kvc = new KVC();
        kvc.foo = [];
        t.bindTo (kvc);

        function click(box) {
            box.checked = !box.checked;
            box.onclick();
        }

        var a = $(".foo", t.getRootElement())[0];
        var b = $(".foo", t.getRootElement())[1];

        kvc.setValue ("foo", ["a", "b"]);
        this.assert (a.checked, "a is not checked");
        this.assert (b.checked, "b is not checked");

        click(a);

        this.assertEqual ("b", kvc.getValue ("foo").join (""));

        this.assertFalse (a.checked, "a is checked");
        this.assert (b.checked, "b is not checked #2");

        click(a);
        this.assert (a.checked, "a is not checked");
        this.assert (b.checked, "b is not checked");
        this.assertEqual ("ab", kvc.getValue ("foo").join (""));
    });

    function simulateRadioClick(radio) {
        radio.checked = !radio.checked;
        radio.onclick({
            target : radio
        });
    }

    // Read/write for radios.
    templateTC.addTest(function () {
        var t = Template.create(
            '<div>\
              <form>\
                <input type="radio" class="a" name="a" value="1">\
                <input type="radio"           name="a" value="2">\
              </form>\
            </div>');
        var kvc = new KVC();
        var root = t.getRootElement();
        var radios = $("input", root);
        kvc.a = "2";
        t.bindTo(kvc);
        this.assertEqual("2", kvc.a);
        this.assertEqual("2", Element.getValue(radios[0]));

        simulateRadioClick(radios[0]);
        this.assertEqual("1", kvc.a);
        this.assertEqual("1", Element.getValue(radios[0]));

        simulateRadioClick(radios[1]);
        this.assertEqual("2", kvc.a);
        this.assertEqual("2", Element.getValue(radios[0]));
    });

    // Read/write for selects.
    templateTC.addTest (function () {
        var t = Template.create ('<div><select class="foop">\
                                   <option value="a">A</option>\
                                   <option value="b">B</option>\
                                 </select></div>');
        var kvc = new KVC();
        kvc.foop = "a";
        t.bindTo (kvc);

        var select = $("select", t.getRootElement())[0];

        this.assertEqual ("a", Element.getValue (select));

        select.selectedIndex = 1;
        select.onchange();

        this.assertEqual ("b", Element.getValue (select));
        this.assertEqual ("b", kvc.foop);

        kvc.setValue ("foop", "a");
        this.assertEqual ("a", Element.getValue (select));
    });

    // Button KP's matching a method on the bound object should create an
    // onclick=method.
    templateTC.addTest (function () {
        var t = Template.create ('<div>\
                                   <input class="foo" type="button">\
                                 </div>');
        var kvc = new KVC();
        var fooTriggered = false;
        kvc.foo = function () {
            fooTriggered = true;
        };
        t.bindTo (kvc);
        var foo = $(".foo", t.getRootElement())[0];

        this.assertInstance (Function, foo.onclick, "foo.onclick was not set");

        foo.onclick();

        this.assert (fooTriggered,
                     "foo was not triggered by the button's onclick");


        // Should also work for <button>s and input submits.
        var t = Template.create ('<div>\
                                   <input class="foo" type="submit">\
                                 </div>');
        var kvc = new KVC();
        var fooTriggered = false;
        kvc.foo = function () {
            fooTriggered = true;
        };
        t.bindTo (kvc);
        var foo = $(".foo", t.getRootElement())[0];

        this.assertInstance (Function, foo.onclick, "foo.onclick was not set");

        foo.onclick();

        this.assert (fooTriggered,
                     "foo was not triggered by the button's onclick");

        var t = Template.create ('<div><button class="foo">bar</button></div>');
        var kvc = new KVC();
        var fooTriggered = false;
        kvc.foo = function () {
            fooTriggered = true;
        };
        t.bindTo (kvc);
        var foo = $(".foo", t.getRootElement())[0];

        this.assertInstance (Function, foo.onclick,
                             "foo.onclick was not set on &lt;button&gt;");

        foo.onclick();

        this.assert (fooTriggered,
                     "foo was not triggered by the button's onclick");
    });

    // The root element should be able to get a value if it has a class name.
    templateTC.addTest (function () {
        var t = Template.create('<div class="foo"></div>');
        var kvc = new KVC();
        kvc.foo = true;
        kvc.setValue ("foo", "bar");
        t.bindTo (kvc);

        this.assertEqual ("bar", kvc.getValue ("foo"));
        this.assertEqual ("bar", t.getRootElement().innerHTML);
    });


    var eventBindingTC = new TestCase("MVC.View.Template event bindings");
    (function () {

        eventBindingTC.setup = function () {
            this.t = Template.create('<div>\
                                       <div class="x"></div>\
                                       <div class="y"></div>\
                                     </div>');
            this.root = this.t.getRootElement();
            this.o = new O();
            this.x = $f(".x", this.root);
            this.y = $f(".y", this.root);
        };

        // Add basic event bindings.
        eventBindingTC.addTest (function () {
            var xClickTriggered = false;

            this.t.createEventBindings ([{
                selector : ".x",
                event : "click",
                callback : function () {
                    xClickTriggered = true;
                }
            }]);
            this.t.bindTo (this.o);

            this.x.onclick();
            this.assert (xClickTriggered, "x's onclick did not trigger");
        });

        // Test the method syntax.
        eventBindingTC.addTest (function () {
            var fooTriggered = false;
            var boundObject;

            this.o.foo = function () {
                fooTriggered = true;
                boundObject = this;
            };

            this.t.createEventBindings ([{
                selector : ".x",
                event : "click",
                method : "foo"
            }]);
            this.t.bindTo (this.o);

            this.x.onclick();

            this.assert (fooTriggered, "foo did not trigger by method name.");
            this.assertEqual (this.o, boundObject,
                              "bound to the wrong object");
        });

        // Default event should be click.
        eventBindingTC.addTest (function () {
            var clickTriggered = false;
            this.t.createEventBindings ([{
                selector : ".x",
                callback : function () {
                    clickTriggered = true;
                }
            }]);
            this.t.bindTo (this.o);

            this.x.onclick();
            this.assert (clickTriggered,
                         "Default event name was not click");
        });

        // Throw an error if an array isn't passed in.
        eventBindingTC.addTest (function () {
            var t = this.t;
            this.assertException (Error, function () {
                t.createEventBindings({ selector : ".x" })
            });
        });

        // Make sure bindings are detached when the data source changes.
        eventBindingTC.addTest (function () {
            var callbacksTriggered = 0;
            this.t.createEventBindings ([{
                selector : ".x",
                callback : function () {
                    callbacksTriggered++;
                }
            }]);
            this.t.bindTo (this.o);
            var p = new O();
            this.t.bindTo (p);

            this.x.onclick();
            this.assertEqual (1, callbacksTriggered,
                              "Events were not detached from this.o");
        });

        // Events should be bound if added after bindTo is called, and refresh
        // is called.
        eventBindingTC.addTest (function () {
            var clickTriggered = false;
            this.t.bindTo (this.o);
            this.t.createEventBindings ([{
                selector : ".x",
                callback : function () {
                    clickTriggered = true;
                }
            }]);
            this.t.refresh();

            this.x.onclick();
            this.assert (clickTriggered, "click was not bound in refresh call");

        });

        // If neither callback or method is passed, an error should be thrown.
        eventBindingTC.addTest (function () {
            var t = this.t;
            var o = this.o;
            this.assertException (Error, function () {
                t.createEventBindings ([{
                    selector : ".x"
                }]);
                t.bindTo (o);
            });
        });


        // Throw error if data source doesn't have method by the name given.
        eventBindingTC.addTest (function () {
            var t = this.t;
            var o = this.o;

            this.assertException (Error, function () {
                t.createEventBindings ([{
                    selector : ".x",
                    method : "undefinedMethod"
                }]);
                t.bindTo (o);
            });
        });

        // Method should be able to be a kP.
        eventBindingTC.addTest (function () {
            var clickTriggered = false;
            this.o.p = new KVC();
            this.o.p.q = function () {
                clickTriggered = true;
            }
            this.t.createEventBindings ([{
                selector : ".x",
                method : "p.q"
            }]);
            this.t.bindTo (this.o);

            this.x.onclick();
            this.assert (clickTriggered,
                         "Nested keypaths not working. Click did not trigger");
        });

        // Cloning templates should copy the event bindings.
        eventBindingTC.addTest (function () {
            var triggered;
            this.t.bindTo (this.o);
            this.t.createEventBindings ([{
                selector : ".x",
                callback : function () {
                    triggered = true;
                }
            }]);

            var t = Template.create (this.t);
            t.bindTo (this.o);

            var x = $f(".x", t.getRootElement());
            this.assertInstance (Function, x.onclick, "onclick not set on .x");
            x.onclick();
            this.assert (triggered, "Inherited event binding did not trigger");
        });

        // Specifying event bindings after binding to a KVC.
        eventBindingTC.addTest(function () {
            var t = Template.create('<div><div class="x"></div></div>', {
                kvcBinding : new O()
            });
            t.createEventBindings([{
                selector : ".x",
                callback : Function.empty
            }]);
            var x = $f(".x", t.getRootElement());
            this.assertInstance(Function, x.onclick,
                                "onclick not set on .x when adding events after the KVC bind.");
        });

        // Adding a method event binding and binding to a new kvc object should
        // replace the event.
        eventBindingTC.addTest (function () {
            var oTriggered = false;
            var pTriggered = false;
            var o = new O();
            o.trigger = function () {
                oTriggered = true;
            };
            var p = new O();
            p.trigger = function () {
                pTriggered = true;
            };
            this.t.bindTo (o);
            this.t.createEventBindings ([{
                selector : ".x",
                method : "trigger"
            }]);
            this.t.bindTo (p);
            this.x.onclick();
            this.assertFalse (oTriggered, "o's onclick triggered");
            this.assert (pTriggered, "p's onclick did not trigger");
        });

        // It should be possible to bind events to the root of the template.
        eventBindingTC.addTest (function () {
            var triggered = false;
            var o = new O();
            this.t.createEventBindings ([{
                selector : "root",
                callback : function () {
                    triggered = true;
                }
            }]);
            this.t.bindTo (o);
            this.t.getRootElement().onclick();
            this.assert (triggered, "Event not bound on root.");
        });

        // Specify using Template.create.
        eventBindingTC.addTest(function () {
            var triggered = false;
            var t = Template.create('<div>\
                                      <div class="x"></div>\
                                    </div>', {
                eventBindings : [{
                    event : "click",
                    selector : ".x",
                    callback : function () {
                        triggered = true;
                    }
                }]
            });
            var root = t.getRootElement();
            var o = new O();
            t.bindTo(o);
            var x = $f(".x", root);
            x.onclick();
            this.assert(triggered);
        });

        // Shall make sure the selector is in the template.
        eventBindingTC.addTest(function () {
            this.t.createEventBindings([{
                selector : ".z",
                callback : Function.empty
            }]);
            this.assertException(/no element with the selector/i, Object.bound(this.t, "bindTo", this.o));
        });
    })();

    // Initial white space to Template.create(string) should not matter, the
    // element should be returned.
    templateTC.addTest (function () {
        var t = Template.create ('       <div class="foo"></div>');
        this.assertEqual ("foo", ClassNames.get (t.getRootElement()).join (""));
    });

    // Don't set the value of a button if the key path is a function.
    templateTC.addTest (function () {
        var t = Template.create (
            '<div><input type="button" class="foo" value="bar"></div>');
        var kvc = new KVC();
        kvc.foo = Function.empty;

        t.bindTo (kvc);

        this.assertEqual ("bar",
                          Element.getValue($(".foo", t.getRootElement())[0]));
    });

    // All events should be removed from the kvc object when the template is
    // bound to a new one.
    templateTC.addTest (function () {
        var o = new KVC();
        o.x = 1;
        o.y = 2;
        var p = new KVC();
        p.x = 3;
        p.y = 4;
        var t = Template.create(
            '<div><h1 class="x"></h1><h2 class="y"></h2></div>');
        t.bindTo(o);

        var x = $(".x", t.getRootElement())[0];
        var y = $(".y", t.getRootElement())[0];

        t.bindTo(p);

        this.assertEqual("3", Element.getValue (x));
        this.assertEqual("4", Element.getValue (y));

        o.setValue("x", 5);
        this.assertEqual("3", Element.getValue (x));

        p.setValue("x", 6);
        this.assertEqual("6", Element.getValue (x));
    });

    // If a keypath is used for showing object's children, when the object
    // is exchanged the template needs to refresh the child values as well.
    templateTC.addTest (function () {
        var t = Template.create('<div class="a_b"></div>');
        var root = t.getRootElement();

        var o = new KVC();
        var p = new KVC();
        p.b = 1;
        var q = new KVC();
        q.b = 2;

        o.a = p;

        t.bindTo (o);

        this.assertEqual (1, o.getValue("a.b"));
        this.assertEqual ("1", Element.getValue(root));

        o.setValue("a", q);

        this.assertEqual (2, o.getValue("a.b"));
        this.assertEqual ("2", Element.getValue(root));

    });

    // Create a template with a TR root element.
    templateTC.addTest (function () {
        var t = Template.create('<tr><td></td></tr>');
        this.assertEqual ("tr", t.getRootElement().tagName.toLowerCase());
    });


    // bindTo should throw an error if argument isn't KVC compatible.
    templateTC.addTest(function () {
        var t = Template.create("<div></div>");
        this.assertException(/KVC compliant/, function () {
            t.bindTo({});
        });
    });

    // Test nested KVC objects.
    templateTC.addTest(function () {
        var o = new KVC();
        o.p = new KVC();
        o.p.q = "r";

        var t = Template.create('<div class="p_q"></div>');
        t.bindTo(o);

        this.assertEqual("r", Element.getValue(t.getRootElement()));
    });

    // Templates should be able to expect a prefix on DOM class names.
    templateTC.addTest(function () {
        var o = new KVC();
        o.q = "r";
        var t = Template.create('<input type="text" class="p_q"></div>');
        t.setClassNamePrefix("p_");
        t.bindTo(o);

        // keyPath -> className
        this.assertEqual("r", Element.getValue(t.getRootElement()));

        // className -> keyPath
        t.getRootElement().value = "s";
        t.getRootElement().onchange();

        this.assertEqual("s", o.getValue("q"));
    });

    // Cloning should keep the class name prefix.
    templateTC.addTest(function () {
        var t = Template.create('<div class="foo_x"></div>');
        t.setClassNamePrefix("foo_");
        var t2 = Template.create(t);
        t2.bindTo(new O());
        this.assertEqual("1", Element.getValue(t2.getRootElement()));
    });

    // Classnames without the prefix should not be updated.
    templateTC.addTest(function () {
        var t = Template.create('\
            <div>\
                <div class="foo_x"></div>\
                <div class="x"></div>\
            </div>');
        t.setClassNamePrefix("foo_");
        var o = new O();
        t.bindTo(o);
        var root = t.getRootElement();

        var x = $f(".x", root);
        var foo_x = $f(".foo_x", root);

        this.assertEqual("1", Element.getValue(foo_x));
        this.assertEqual("", Element.getValue(x));
    });

    // Events should be attached to form elements when a class name prefix is
    // present as well.
    templateTC.addTest(function () {
        var t = Template.create('\
            <div>\
                <input type="text" class="foo_x"></textarea>\
                <span class="foo_x"></span>\
            </div>\
        ');
        var o = new O();
        t.setClassNamePrefix("foo_");
        t.bindTo(o);

        var root = t.getRootElement();
        var input = $f("input", root);
        var span = $f("span", root);

        this.assertEqual(1, o.getValue("x"));
        this.assertEqual("1", Element.getValue(input));
        this.assertEqual("1", Element.getValue(span));

        input.value = "2";
        input.onchange();

        this.assertEqual("2", Element.getValue(input));
        this.assertEqual("2", o.getValue("x"));
        this.assertEqual("2", Element.getValue(span));

    });

    // Onchange events should be addad to textareas.
    templateTC.addTest(function () {
        var t = Template.create('<textarea class="x"></textarea>');
        var o = new O();
        t.bindTo(o);

        var root = t.getRootElement();

        root.value = "a";
        root.onchange();

        this.assertEqual("a", o.getValue("x"));
    });

    // Automatically added events should be detached when the binding changes.
    templateTC.addTest(function() {
        var saves = [];

        function C(name) {
            this.name = name;
        } C.prototype = {
            save : function () {
                saves.push(this.name)
            }
        };
        KVC.implement(C);

        var t = Template.create(
            '<div><input type="button" class="save" value="Save"></div>');
        var saveButton = $f(".save", t.getRootElement());
        var a = new C("a");
        var b = new C("b");

        saves = [];
        t.bindTo(a);
        saveButton.onclick();
        this.assertEqual("a", saves.join(""));

        saves = [];
        t.bindTo(b);
        saveButton.onclick();
        this.assertEqual("b", saves.join(""));
    });

    // Used for testing widget support.
    function ProgressBar() {
    } ProgressBar.prototype = {
        _setup : function () {
            var rootElement = this._getRootElement();
            rootElement.innerHTML = "";

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
            this.bar.style.width = Math.round(v*100) + "%";
        }
    };
    ProgressBar.extend(Widget);

    var widgetTC = new TestCase("MVC.View.Template widgets");
    widgetTC.setup = function () {
        this.WidgetO = function () {
            this.x = 0.5;
            this.y = 1.0;
            this.a = new KVC();
            this.a.b = 0.25;
        };
        KVC.implement(this.WidgetO);
        this.t = Template.create('\
                                 <div>\
                                   <div class="x"></div>\
                                   <div class="y"></div>\
                                   <div class="a_b"></div>\
                                 </div>\
                                 ');
        this.root = this.t.getRootElement();
        this.container = function (className, root) {
            root = root || this.root;
            return $f(".%s .widget_progressBar_container".format(className),
                      root);
        };
        this.bar = function (className, root) {
            root = root || this.root;
            return $f(".%s .widget_progressBar_bar".format(className),
                      root);
        };
        $f("#sandbox").appendChild(this.root);
    };
    widgetTC.teardown = function () {
        $f("#sandbox").innerHTML = "";
    };

    // Widget support. Key paths used by the widget should be propagated to it.
    widgetTC.addTest(function () {
        var t = this.t

        var o = new this.WidgetO();

        t.bindTo(o);
        var root = t.getRootElement();

        // Add the widget.
        t.addWidget(".x", new ProgressBar());

        // Throw an error if a selector doesn't exist.
        this.assertException(/need a selector/i,
                             t.addWidget.bind(t, "random", new ProgressBar()));

        // Make sure the widget has been added, this test breaks encapsulation
        // somewhat, but the widget would document that it adds this class name,
        // so it's OK.
        var root = t.getRootElement();
        var bar = $f(".x .widget_progressBar_bar", root);
        var barContainer = $f(".x .widget_progressBar_container", root);
        this.assert(!!bar, "Could not find bar.");

        // Set the width of the bar container (CSS Simulation).
        barContainer.style.width = "200px";

        // Make sure the bar has the correct size.
        this.assertEqual(0.5, o.getValue("x"));
        this.assertEqual(100, bar.offsetWidth);

        // Change the width by updating the KVC.
        o.setValue("x", 0.25);
        this.assertEqual(0.25, o.getValue("x"));
        this.assertEqual(50, bar.offsetWidth);

    });

    // Adding two widgets using different key paths shouldn't cause problems.
    widgetTC.addTest(function () {
        var t = this.t
        var o = new this.WidgetO();
        t.bindTo(o);
        var root = this.root;

        t.addWidget(".x", new ProgressBar());
        t.addWidget(".y", new ProgressBar());

        this.container("x").style.width = "200px";
        this.container("y").style.width = "200px";

        this.assertEqual(100, this.bar("x").offsetWidth);
        this.assertEqual(200, this.bar("y").offsetWidth);
        o.setValue("x", 0.25);
        this.assertEqual(50, this.bar("x").offsetWidth);
        this.assertEqual(200, this.bar("y").offsetWidth);

    });

    // Add a Widget to a deep key path.
    widgetTC.addTest(function () {
        var t = this.t;
        var o = new this.WidgetO();
        t.bindTo(o);
        var root = this.root;

        t.addWidget(".a_b", new ProgressBar());
        this.container("a_b").style.width = "200px";
        this.assertEqual(50, this.bar("a_b").offsetWidth);
    });

    // Adding a widget before the template is bound to a KVC should work.
    widgetTC.addTest(function () {
        var o = new this.WidgetO();
        this.t.bindTo(o);
        this.t.addWidget(".x", new ProgressBar());

        this.container("x").style.width = "200px";
        this.assertEqual(0.5, o.getValue("x"));
        this.assertEqual(100, this.bar("x").offsetWidth);
    });

    // Rebinding the template should cause a set to be sent to the widget.
    widgetTC.addTest(function () {
        var o = new this.WidgetO();
        this.t.bindTo(o);
        this.t.addWidget(".x", new ProgressBar());

        this.container("x").style.width = "200px";
        this.assertEqual(100, this.bar("x").offsetWidth);

        var p = new this.WidgetO();
        p.x = 0.25;
        this.t.bindTo(p);
        this.assertEqual(50, this.bar("x").offsetWidth);
    });

    // Cloning a template should clone the widgets.
    widgetTC.addTest(function () {
        var t = this.t;
        t.addWidget(".x", new ProgressBar());
        var t2 = Template.create(t);
        var o = new this.WidgetO();
        o.x = 0.5;
        var o2 = new this.WidgetO();
        o2.x = 0.25;
        t.bindTo(o);
        t2.bindTo(o2);
        var tRoot = t.getRootElement();
        var t2Root = t2.getRootElement();
        $f("#sandbox").appendChild(t2Root);

        this.container("x", tRoot).style.width = "200px";
        this.container("x", t2Root).style.width = "200px";
        this.assertEqual(100, this.bar("x", tRoot).offsetWidth);
        this.assertEqual(50, this.bar("x", t2Root).offsetWidth);
    });

    // setValue on widgets should go through value transformers.
    widgetTC.addTest(function () {
        var t = this.t;
        t.setValueTransformer({
            keyPath : "x",
            transform : function (v) {
                // Invert the progress.
                return 1 - v;
            }
        });
        t.setValueTransformer({
            selector : ".x",
            transform : function (v) {
                // Subtract a quarter.
                return v - 0.25;
            }
        });
        t.addWidget(".x", new ProgressBar());
        var o = new this.WidgetO();
        o.x = 0.25;
        this.container("x").style.width = "200px";
        t.bindTo(o);
        this.assertEqual(100, this.bar("x").offsetWidth);
    });

    // Widgets should be able to be specified using selectors.
    // Also use the create syntax to add the widgets.
    widgetTC.addTest(function () {
        var t = Template.create('\
          <div>\
            <div class="z0"><div class="x"></div></div>\
            <div class="z1"><div class="x"></div></div>\
          </div>', {
              widgets : [{
                  selector : ".z0 .x",
                  widget : new ProgressBar()
              }, {
                  selector : ".z1 .x",
                  widget : new ProgressBar()
              }],
              kvcBinding : new this.WidgetO()
        });

        var root = t.getRootElement();
        $f("#sandbox").appendChild(root);

        this.container("z0 .x", root).style.width = "200px";
        this.assertEqual(100, this.bar("z0 .x", root).offsetWidth);

        this.container("z1 .x", root).style.width = "200px";
        this.assertEqual(100, this.bar("z1 .x", root).offsetWidth);
    });

    // The template should be able to tag its root with a className, based on a
    // boolean property.
    templateTC.addTest(function () {
        var t = Template.create('<div><div class="x"></div></div>');
        var o = new KVC();
        o.a = true;
        o.b = false;
        o.c = true;
        // Try adding before binding.
        t.addClassNameCondition("a", "a-trueDefaultNegation");
        t.addClassNameCondition("a", "a-true", false);
        t.addClassNameCondition("a", "a-false", true);
        t.addClassNameCondition("b", "b-true",  false);
        t.addClassNameCondition("b", "b-false", true);
        t.bindTo(o);

        var root = t.getRootElement();
        var has = CN.has.curry(root);
        var cn = root.className;

        this.assert(has("a-trueDefaultNegation"), "No a-trueDefaultNegation.");
        this.assert(has("a-true"), "No a-true.");
        this.assertFalse(has("a-false"), "a-false.");
        this.assert(has("b-false"), "No b-false.");
        this.assertFalse(has("b-true"), "b-true.");


        // Changing the value.

        o.setValue("a", false);
        o.setValue("b", true);
        this.assertFalse(has("a-trueDefaultNegation"), "a-trueDefaultNegation.");
        this.assertFalse(has("a-true"), "a-true.");
        this.assert(has("a-false"), "No a-false.");
        this.assertFalse(has("b-false"), "b-false.");
        this.assert(has("b-true"), "No b-true.");

        // Add condition after binding.
        t.addClassNameCondition("c", "c-true", false);
        t.addClassNameCondition("c", "c-false", true);
        this.assert(has("c-true"), "No c-true.");
        this.assertFalse(has("c-false"), "c-true.");

        // The create interface
        var o = new KVC();
        o.a = true;
        o.b = false;
        var t = Template.create('<div><div class="x"></div></div>', {
            classNameConditions : [{
                keyPath : "a",
                className : "a-trueDefaultNegation"
            },{
                keyPath : "a",
                className : "a-true",
                negate : false
            }, {
                keyPath : "a",
                className : "a-false",
                negate : true
            }, {
                keyPath : "b",
                className : "b-true",
                negate : false
            }, {
                keyPath : "b",
                className : "b-false",
                negate : true
            }],
            kvcBinding : o
        });
    });

    // Class name conditions should be inherited.
    templateTC.addTest(function () {
        var t = Template.create('<div></div>');
        var o = new O(3);
        o.a = true;
        t.addClassNameCondition("a", "a-true");
        var t2 = Template.create(t);
        t2.bindTo(o);
        this.assert(CN.has(t2.getRootElement(), "a-true"),
                    "Class name properties were not inherited.CN=\"%s\"".format(
                        CN.get(t2.getRootElement()).join(" ")
                    ));
    });

    // It should be possible to exclude a key path from being bound.
    templateTC.addTest(function () {
        var t = Template.create('<div>\
          <div class="x">10</div>\
          <div class="y">20</div>\
        </div>', {
            skipKeyPaths: ["y"]
        });

        var o = new KVC();
        o.x = 1;
        o.y = 2;
        t.bindTo(o);

        this.assertEqual(1, valueOf(t, ".x"));
        this.assertEqual(20, valueOf(t, ".y"));
    });

    // Send an onBound event.
    templateTC.addTest(function () {
        var o = new O(3);

        var triggered = false;
        var t = Template.create('<div class="x"></div>');
        t.setOnBound(function () {
            triggered = true;
        });
        t.bindTo(o);

        this.assert(triggered, "Did not trigger.");

        var triggered2 = false;
        var t2 = Template.create('<div class="x"></div>', {
            onBound : function () {
                triggered2 = true;
            },
            kvcBinding : o
        });
        this.assert(triggered2, "t2's onBound did not trigger.");

        triggered2 = false;
        var t3 = Template.create(t2);
        t3.bindTo(o);
        this.assert(triggered2, "t3's onBound did not trigger.");
    });

    // Properties should be able to be marked as read or write only. If read only, changes in the
    // form element won't propagate to the KVC object. Write only means changes in the KVC object
    // won't propagate to the element (write is applicable for all elements).
    templateTC.addTest(function () {
        var o = new KVC();
        o.setValue = function (keyPath, value) {
            KVC.prototype.setValue.call(this, keyPath, parseInt(value, 10));
        };
        o.w = 1;
        o.x = 1;
        o.y = 1;
        o.z = 1;
        var t = Template.create('<div>\
          <input type="text" class="w" value="0">\
          <input type="text" class="x" value="0">\
          <input type="text" class="y" value="0">\
          <input type="text" class="z" value="0">\
        </div>', {
            kvcBinding : o,
            modes : [
                { keyPath : "w", mode : "both" },
                { keyPath : "x", mode : "write" },
                { keyPath : "y", mode : "read" }
                // z should default to "both"
            ]
        });
        this.assertEqual(1, valueOf(t, ".w"), "w");
        this.assertEqual(0, valueOf(t, ".x"), "x");
        this.assertEqual(1, valueOf(t, ".y"), "y");
        this.assertEqual(1, valueOf(t, ".z"), "z");

        o.setValue("w", 2);
        o.setValue("x", 2);
        o.setValue("y", 2);
        o.setValue("z", 2);

        this.assertEqual(2, valueOf(t, ".w"), "w2");
        this.assertEqual(0, valueOf(t, ".x"), "x2");
        this.assertEqual(2, valueOf(t, ".y"), "y2");
        this.assertEqual(2, valueOf(t, ".z"), "z2");

        setV(t, ".w", 3);
        setV(t, ".x", 3);
        setV(t, ".y", 3);
        setV(t, ".z", 3);

        this.assertEqual(3, o.getValue("w"), "w3");
        this.assertEqual(3, o.getValue("x"), "x3");
        this.assertEqual(2, o.getValue("y"), "y3");
        this.assertEqual(3, o.getValue("z"), "z3");

    });

    templateTC.addTest(function () {
        var o = new O();
        o.setValue("x", null);
        var t = Template.create('<div class="x"></div>', {
            kvcBinding : o
        });
        this.assertEqual("", t.getRootElement().innerHTML);
    });

    // Cloning of skipKeyPaths.
    templateTC.addTest(function () {
        var t = Template.create('<div class="x">0</div>', {
            skipKeyPaths : ["x"]
        });
        var t2 = Template.create(t);
        t.bindTo(new O());
        t2.bindTo(new O());
        this.assertEqual(0, valueOf(t, "root"));
        this.assertEqual(0, valueOf(t2, "root"));
    });

    // Cloning of modes.
    templateTC.addTest(function () {
        var o = new O();
        var t = Template.create('<div class="x">0</div>', {
            modes : [{
                keyPath : "x",
                mode : "write"
            }],
            kvcBinding : o
        });
        var t2 = Template.create(t);
        t2.bindTo(o);
        o.setValue("x", 8);
        this.assertEqual(0, valueOf(t, "root"), "t");
        this.assertEqual(0, valueOf(t2, "root"), "t2");
    });

    // classNamePrefix.
    templateTC.addTest(function () {
        var o = new O();
        var t = Template.create('<div class="foo_x">0</div>', {
            classNamePrefix : "foo_",
            kvcBinding : o
        });
        this.assertEqual(1, valueOf(t, "root"));

        // Cloning.
        var t2 = Template.create(t, {
            kvcBinding : o
        });
        this.assertEqual("foo_", t2.classNamePrefix);
        o.setValue("x", 2);
        this.assertEqual(2, valueOf(t, "root"));
        this.assertEqual(2, valueOf(t2, "root"));
    });

    return [templateTC, eventBindingTC, widgetTC];
};
