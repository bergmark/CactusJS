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

Cactus.UnitTest.MVC.View.ListTemplate = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var Template = Cactus.MVC.View.Template;
    var JSON = Cactus.Util.JSON;
    var KVC = Cactus.Util.KeyValueCoding;
    var $ = Cactus.DOM.select;
    var log = Cactus.Dev.log;
    var ListTemplate = Cactus.MVC.View.ListTemplate;
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var tag = Cactus.DOM.tag;
    var Element = Cactus.DOM.Element;
    var Events = Cactus.DOM.Events;
    var ClassNames = Cactus.DOM.ClassNames;
    var $f = function (selector, parent) {
        return $(selector, parent)[0];
    };

    var tc = new TestCase ("MVC.View.ListTemplate");

    function O (x, y) {
        this.x = x;
        this.y = y;
    } O.prototype = {
        x : 1,
        y : 2
    }; KVC.implement (O);

    /**
     * Creates an Array Controller with default values.
     *
     * @return ArrayController
     */
    function makeAC () {
        return new ArrayController([
            new O (1, 2),
            new O (3, 4),
            new O (5, 6)
        ]);
    }

    var templateP = Template.create ('<li><span class="x"></span><span class="y"></span></li>');

    tc.setup = function () {
        this.ac = makeAC();
        this.rootElement = tag("ul");
        this.listTemplate = ListTemplate.create(templateP, this.rootElement, {
            arrayController : this.ac
        });
        /**
         * Returns the integer value of the x of one of the list items.
         *
         * @return int
         */
        this.valueOf = function (listItemIndex) {
            return parseInt(Element.getValue($("li .x", this.rootElement)[listItemIndex]), 10);
        };
    };

    // Test initializing with empty array.
    tc.addTest (function () {
        var ac = new ArrayController();
        var rootElement = tag ("ul");
        var listTemplate = new ListTemplate (ac, templateP, rootElement);

        this.assertEqual (0, rootElement.childNodes.length);
    });

    // Test initializing with non-empty array.
    tc.addTest (function () {
        this.assertEqual (3, this.rootElement.childNodes.length);
        this.assertEqual (1, this.valueOf (0));
        this.assertEqual (3, this.valueOf (1));
        this.assertEqual (5, this.valueOf (2));
    });

    // Push an object onto the AC.
    tc.addTest (function () {
        this.ac.add (new O (7 ,8));
        this.assertEqual(4, this.rootElement.childNodes.length);

        this.assertEqual (7, this.valueOf (3));
    });

    // Remove objects.
    tc.addTest (function () {
        this.ac.removeAtIndex (2);
        this.assertEqual (2, this.rootElement.childNodes.length);
        this.assertEqual (1, this.valueOf (0));
        this.assertEqual (3, this.valueOf (1));

        this.ac.removeAtIndex (0);
        this.assertEqual (1, this.rootElement.childNodes.length);
        this.assertEqual (3, this.valueOf (0));
    });

    // Do a hard refresh.
    tc.addTest (function () {
        this.listTemplate.refresh();
        this.assertEqual (3, this.rootElement.childNodes.length);
    });

    // Swap two objects.
    tc.addTest (function () {
        this.ac.swap (0, 1);
        this.assertEqual (3, this.valueOf (0));
        this.assertEqual (1, this.valueOf (1));

        this.ac = makeAC();
        this.listTemplate.bindTo (this.ac);
        this.ac.swap (0, 2);
        this.assertEqual (5, this.valueOf (0));
        this.assertEqual (1, this.valueOf (2));
        this.assertEqual (3, this.valueOf (1));
    });

    // OnObjectReplace should cause a replace of a li for another one.
    tc.addTest (function () {
        var o = this.ac.get (0);
        this.ac.replace (o, new O (7, 8));

        this.assertEqual (7, this.ac.get (0).getValue ("x"),
                          "Object not replaced in AC.");
        this.assertEqual (7, this.valueOf (0),
                          "LI not replaced in ListTemplate.");
    });

    // Should have a bindTo method.
    tc.addTest (function () {
        var lt = this.listTemplate;
        this.assertInstance (Function, lt.bindTo, "No bindTo method.");

        var ac = new ArrayController ([new O (11, 12)]);
        lt.bindTo (ac);

        this.assertEqual (11, this.valueOf (0));
    });

    // Event bindings. Keypaths on inner templates should be able to be set for
    // the list template.
    // Callbacks should be called with the arguments:
    // ArrayController, objectIndex, e.
    tc.addTest (function () {
        var ac = this.ac;
        var lt = this.listTemplate;
        var test = this;

        var triggered = false;

        var firstListItem = lt.getListItem (0);
        var x = $(".x", firstListItem)[0];
        var e = {
            target : x
        };

        lt.createEventBindings ([{
            selector : ".x",
            event : "click",
            callback : function (ac2, objectIndex, e2) {
                test.assertEqual (ac, ac2);
                test.assertEqual (0, objectIndex);
                test.assertEqual (e, e2);
                triggered = true;
            }
        }]);

        // Add an event to .x to make it onclick:able, mock event propagation
        // until real simulations can be done.
        Events.add (x, "click", function () {
            lt.getRootElement().onclick (e);
        });

        x.onclick();

        this.assert (triggered, "click on inner template did not trigger");
    });

    // EventBindings should only be triggered if the clicked element matches the
    // selector.
    tc.addTest (function () {
        var ac = this.ac;
        var lt = this.listTemplate;

        var triggered = false;

        var firstListItem = lt.getListItem (0);
        var y = $(".y", firstListItem)[0];

        lt.createEventBindings ([{
            selector : ".x",
            event : "click",
            callback : function () {
                triggered = true;
            }
        }]);

        Events.add (y, "click", function () {
            lt.getRootElement().onclick ({
                target : this
            });
        });

        y.onclick();

        this.assertFalse (triggered,
                          "Click on inner template's .y triggered the "
                          + "ListTemplate's event binding.");
    });

    // There should be a method property for event bindings that binds events
    // to methods on the ArrayController.
    tc.addTest (function () {
        var ac = this.ac;
        var lt = this.listTemplate;

        // Create an event binding for removing a template from the list.
        lt.createEventBindings([{
            selector : ".x",
            event : "click",
            method : "removeAtIndex"
        }]);

        function simulateClick (element) {
            Events.add (element, "click", function () {
                lt.getRootElement().onclick ({
                    target : this
                });
            });
            element.onclick();
        }

        simulateClick ($(".x", lt.getListItem (0))[0]);

    });

    // The first element in the list should have .first as class name,
    // and the last a .last class name.
    // If there is only one element, it should have the class .single.
    tc.addTest (function () {
        var lt = this.listTemplate;
        var ac = this.ac;

        function resetAC () {
            ac = makeAC();
            lt.bindTo(ac);
        }

        function has (index, className) {
            return ClassNames.has(lt.getListItem(index), className);
        }
        function hasFirst (index) {
            return has(index, "first");
        }
        function hasLast (index) {
            return has(index, "last");
        }
        function hasSingle (index) {
            return has(index, "single");
        }

        this.assert (hasFirst (0), ".first not set on first LI.");
        this.assert (hasLast (2), ".last not set on last LI.");

        // Make sure the other nodes don't have .first.
        this.assertFalse (hasFirst (1), ".first set on second LI.");
        this.assertFalse (hasFirst (2), ".first set on last LI.");

        // Make sure the other nodes don't have .last
        this.assertFalse (hasLast (0), ".last set on first LI.");
        this.assertFalse (hasLast (1), ".last set on second LI.");


        // Later modifications should keep the class name at the first LI.

        resetAC();
        ac.remove (ac.get (0));
        this.assert (hasFirst (0), ".first wasn't reset when an object was removed.");
        resetAC();
        ac.remove (ac.get (ac.count() - 1));
        this.assert (hasLast (1), ".last wasn't reset when an object was removed.");

        resetAC();
        ac.addAtIndex(0, new O (7, 8));
        this.assert(hasFirst(0), ".first wasn't set when addAtIndex(0,_) was called.");
        this.assertFalse(hasFirst(1), ".first wasn't removed from the LI shifted from index 0 on swap.");
        resetAC();
        ac.addAtIndex(ac.count(), new O(7, 8));
        this.assertEqual(7, this.valueOf(ac.count() - 1));
        this.assert(hasLast(ac.count() - 1), ".last was not set when addAtIndex was called.");
        this.assertFalse(hasLast(ac.count() - 2), ".last was not removed when addAtIndex was called.");

        resetAC();
        ac.swap (0, 2);
        this.assert (hasFirst (0), ".first not set when swapping elements.");
        this.assert (hasLast (2), ".last not set when swapping elements.");
        this.assertFalse (hasFirst (2), ".first not removed when swapping elements.");
        this.assertFalse (hasLast (0), ".last not removed when swapping elements.");

        resetAC();
        ac.removeAtIndex (0);
        this.assert (hasFirst (0), ".first not added on removeAtIndex (0) call.");
        resetAC();
        ac.removeAtIndex (ac.count() - 1);
        this.assert (hasLast (ac.count() - 1), ".last not added on removeAtIndex (last) call.");

        resetAC();
        ac.replace (ac.get (0), new O (7, 8));
        this.assert (hasFirst (0), ".first not added on replace call.");
        resetAC();
        ac.replace(ac.get(ac.count() - 1), new O (7, 8));
        this.assert(hasLast(ac.count() - 1), ".last not added on replace call.");

        resetAC();
        ac.clear();
        ac.add(new O(9,10));
        this.assert(hasSingle(0), "Missing initial .last.");
        ac.add(new O(11,12));
        this.assertFalse(hasSingle(0));
        this.assertFalse(hasSingle(1));
        ac.removeAtIndex(0);
        this.assert(hasSingle(0), "Missing .last after removeAtIndex.");
    });

    // Allow for other types of "lists", such as a table with a row for each
    // template.
    tc.addTest(function () {
        var ac = makeAC();

        var trTemplate = Template.create('<tr><td class="x"></td><td class="y"></td></tr>');

        var table = tag("table");
        var root = tag("tbody");
        table.appendChild(root);

        var lt = new ListTemplate(ac, trTemplate, root);
        this.assertEqual(3, root.childNodes.length);
    });

    // Allow using a select as the root element.
    tc.addTest(function () {
        var ac = makeAC();
        var optionTemplate = Template.create(
            '<option class="x" value=""></option>', {
            valueTransformers : [{
                keyPath : "x",
                transform : function (v, o) {
                    return {
                        value : o.getValue("x")*10,
                        text : o.getValue("y")*10
                    };
                }
            }]
        });
        var select = tag("select");
        var lt = ListTemplate.create(optionTemplate, select, {
            arrayController : ac
        });
        this.assertEqual(3, $("option", lt.getRootElement()).length);
        this.assertEqual('{"value":"10","text":"20"}',
                         JSON.stringify(Element.getValue($f("option", lt.getRootElement()))));
    });

    // Make sure that the subscription collection isn't shared among instances.
    tc.addTest (function () {
        var t = Template.create('<li><span class="x"></span><input type="button" class="remove" value="remove"></li>');

        function O(x) {
            this.x = x;
        } O.prototype = {
            x : 0
        };
        KVC.implement(O);

        var ac = makeAC();

        var lt = new ListTemplate(ac, t, tag("ul"));
        lt.createEventBindings([{
            selector : ".remove",
            method : "removeAtIndex"
        }]);

        lt.onObjectRemovedTriggered = function () {
            ListTemplate.prototype.onObjectRemovedTriggered.apply(this,
                                                                  arguments);
        };

        var removeButton = $f(".remove", lt.getRootElement());
        Events.add(removeButton, "click", function () {
            lt.getRootElement().onclick({
                target : this
            });
        });

        var lt2 = new ListTemplate(makeAC(),
            Template.create('<li class="x"></li>'), tag("ul"));

        removeButton.onclick();

        this.assertEqual(2, ac.count(), "Too many objects in AC.");
        this.assertEqual(2, lt.getRootElement().childNodes.length, "Too many objects in ListTemplate.");
    });

    // Event bindings should return false to halt the event.
    tc.addTest(function () {
        var lt = this.listTemplate;
        var ac = this.ac;

        lt.createEventBindings([{
            selector : ".x",
            callback : Function.empty
        }]);

        var root = lt.getRootElement();

        var x = $f(".x", lt.getRootElement());

        // This code breaks in IE, for unknown reasons, so it's left commented
        // out for now.
        // this.assertEqual(false, root.onclick({
        //     target : x
        // }));
    });

    // It should be possible to use different templates for different KVC
    // subclasses.
    tc.addTest(function () {
        var root = tag("ul");
        var t1 = Template.create('<li class="a"></li>');
        var t2 = Template.create('<li class="b"></li>');
        function A(a) {
            this.a = a;
            this.b = "error";
        }
        KVC.implement(A);
        function B(b) {
            this.b = b;
            this.a = "error";
        }
        KVC.implement(B);

        var a = new A(1);
        var b = new B(2);
        var ac = new ArrayController([a, b]);

        var lt = new ListTemplate(ac, [{
            constructor : A,
            template : t1
        }, {
            constructor : B,
            template : t2
        }], root);

        var li1 = $("li", root)[0];
        var li2 = $("li", root)[1];

        this.assert(ClassNames.has(li1, "a"));
        this.assertEqual("1", Element.getValue(li1));
        this.assert(ClassNames.has(li2, "b"));
        this.assertEqual("2", Element.getValue(li2));


        // Throw an error if the array isn't well formed.
        this.assertException(/should be/i, function () {
            new ListTemplate(new ArrayController(), null, tag("ul"));
        });
        this.assertException(/malformed/i, function () {
            new ListTemplate(new ArrayController(), [{
                constructor : KVC
            }], tag("ul"));
        });
    });

    // A constructor method, `create` that behaves like Template.create.
    tc.addTest(function () {
        var ul = tag("ul");
        var t = Template.create('<div><div class="x"></div></div>');
        var o = new KVC();
        o.x = 2;
        var triggered = false;
        var ac = new ArrayController([o]);

        var lt = ListTemplate.create(t, ul, {
            arrayController : ac,
            eventBindings : [{
                selector : ".x",
                event : "click",
                callback : function () {
                    triggered = true;
                }
            }]
        });

        ul.onclick({
            target : $f(".x", ul)
        });
        this.assert(triggered);
    });

    // Binding to a different AC shall be possible and shall not break the
    // event bindings.
    tc.addTest(function () {
        var test = this;
        var lt = this.listTemplate;
        var ac = this.ac;
        var ac2 = makeAC();

        ac.removeAtIndex(0);
        this.assertEqual(2, lt.getRootElement().childNodes.length);

        var triggered = false;
        lt.createEventBindings([{
            selector : ".x",
            callback : function (ac, index) {
                triggered = true;
                test.assertEqual(ac2, ac);
            }
        }]);
        lt.bindTo(ac2);
        this.assertEqual(3, lt.getRootElement().childNodes.length);
        lt.getRootElement().onclick({
            target : $f(".x", lt.getListItem(0))
        });

        this.assert(triggered);
    });

    // Allow changing the names of the first/last/single class names.
    tc.addTest(function () {
        var ac = this.ac;
        var lt = ListTemplate.create(templateP, tag("ul"), {
            firstClassName : "fst",
            lastClassName : "lst",
            singleClassName : "sngl"
        });
        lt.bindTo(ac);

        function has(index, className) {
            return ClassNames.has(lt.getListItem(index), className);
        }
        this.assertFalse(has(0, "first"), "first");
        this.assert(has(0, "fst"), "fst");
        this.assertFalse(has(2, "last"), "last");
        this.assert(has(2, "lst"), "lst");
        ac.removeAtIndex(0);
        ac.removeAtIndex(0);
        this.assertFalse(has(0, "single"), "single");
        this.assert(has(0, "sngl"), "sngl");

        // At the same time as binding (in create).
        ac = makeAC();
        lt = ListTemplate.create(templateP, tag("ul"), {
            firstClassName : "fst",
            lastClassName : "lst",
            singleClassName : "sngl",
            arrayController : ac
        });
        this.assertFalse(has(0, "first"), "first");
        this.assert(has(0, "fst"), "fst");
        this.assertFalse(has(2, "last"), "last");
        this.assert(has(2, "lst"), "lst");
        ac.removeAtIndex(0);
        ac.removeAtIndex(0);
        this.assertFalse(has(0, "single"), "single");
        this.assert(has(0, "sngl"), "sngl");

        // After binding has occurred.
        ac = makeAC();
        lt = ListTemplate.create(templateP, tag("ul"), {
            arrayController : ac
        });
        lt.setFirstClassName("_first");
        lt.setLastClassName("_last");
        this.assertFalse(has(0, "first"), "first after");
        this.assert(has(0, "_first"), "_first");
        this.assertFalse(has(2, "last"), "last after");
        this.assert(has(2, "_last"), "_last");
        ac.removeAtIndex(0);
        ac.removeAtIndex(0);
        lt.setSingleClassName("_single");
        this.assertFalse(has(0, "single"), "single after");
        this.assert(has(0, "_single"), "_single");
    });
    return tc;
};
