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

Cactus.UnitTest.Util.KeyValueCoding = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var KVC = Cactus.Util.KeyValueCoding;
    var log = Cactus.Dev.log;

    var kvcTC = new TestCase ("Util.KeyValueCoding");

    // Test setting and getting values for simple key paths. Reading
    // values right of the properties and using accessor methods.
    kvcTC.addTest (new Test (null, function () {
        var o = new KVC();
        o.a = 1;

        this.assertEqual (1, o.getValue ("a"));
        o.setValue("a", 2);
        this.assertEqual (2, o.getValue ("a"));

        o.setX = function (v) {
            this.x = v + 1;
        }
        o.getX = function (v) {
            return this.x * -1;
        }
        o.x = 5;

        this.assertEqual (-5, o.getValue ("x"));
        o.setValue ("x", 7); // Sets to -8.
        this.assertEqual (-8, o.getValue ("x"));
    }));

    // Test nested paths.
    kvcTC.addTest (new Test (null, function () {
        var o = new KVC();
        o.p = new KVC();
        o.p.q = new KVC();
        o.a = 1;
        o.p.b = 2;
        o.p.q.c = 3;

        this.assertEqual (1, o.getValue("a"));
        this.assertEqual (2, o.getValue("p.b"));
        this.assertEqual (3, o.getValue("p.q.c"));

        o.setValue ("a", 4);
        o.setValue ("p.b", 5);
        o.setValue ("p.q.c", 6);

        this.assertEqual (4, o.getValue("a"));
        this.assertEqual (5, o.getValue("p.b"));
        this.assertEqual (6, o.getValue("p.q.c"));
    }));

    kvcTC.addTest (new Test (null, function () {
        var o   = new KVC();
        o.p     = new KVC();
        o.p.q   = new KVC();
        o.a     = 1;
        o.p.b   = 2;
        o.p.q.c = 3;

        // existing keyPaths
        this.assert (o.hasKeyPath("a"));
        this.assert (o.hasKeyPath("p"));
        this.assert (o.hasKeyPath("p.b"));
        this.assert (o.hasKeyPath("p.q"));
        this.assert (o.hasKeyPath("p.q.c"));

        // non-existing keyPaths
        this.assertFalse(o.hasKeyPath("b"));
        this.assertFalse(o.hasKeyPath("a.q"));
        this.assertFalse(o.hasKeyPath("p.q.b"));
        this.assertFalse(o.hasKeyPath("p.q.p"));
        this.assertFalse(o.hasKeyPath("q.p"));
    }));

    // test adding kvc to an instance
    kvcTC.addTest (new Test (null, function () {
        var o = {};
        KVC.addToInstance (o);
        this.assert ("hasKeyPath" in o);
        this.assert ("subscribe" in o);
    }));

    // test onValueChanged
    kvcTC.addTest (new Test (null, function () {
        var o = new KVC();
        o.p = null;
        o.setValue("p", new KVC());
        o.p.q = null;
        o.setValue("p.q", new KVC());
        o.p.q.r = null;
        o.setValue("p.q.r", new KVC());
        var triggered = false;
        var objectArg;
        var keyPathArg;
        o.subscribe("ValueChanged", function (object, keyPath) {
            triggered = true;
            objectArg = object;
            keyPathArg = keyPath;
        }, true);

        o.setValue("p.q.r", 5);

        this.assert (triggered, "onValueChanged was not triggered for o");
        this.assertEqual (o, objectArg);
        this.assertEqual ("p.q.r", keyPathArg);
    }));

    // Throw an error if trying to set/get value of KP "value" or
    // checking if "value" exists as a KP.
    kvcTC.addTest (function () {
        var o = new KVC();
        this.assertException (Error, function () {
            o.setValue ("value", "bar");
        });
        this.assertException (Error, function () {
            o.getValue ("value");
        });
    });

    // There should be a class method for checking whether instances implement
    // the interface.
    kvcTC.addTest (function () {
        var o = new KVC();
        var p = {};

        this.assert(KVC.implementsInterface(o),
                    "o does not implement interface.");
        this.assertFalse(KVC.implementsInterface(p),
                         "p implements interface.");
        this.assertFalse(KVC.implementsInterface(null),
                         "null implements interface.");
    });

    // Naming a property "isX" should not interfere with properties named "X".
    kvcTC.addTest(function () {
        var o = new KVC();
        o.isX = 3;
        o.x = 2;
        this.assertEqual(2, o.getValue("x"));
        this.assertEqual(3, o.getValue("isX"));
    });

    // A root should listen to its aggregates for changes, so that
    // onValueChanged can be triggered for it (along with compounds).
    kvcTC.addTest(function () {
        function O() {}
        O.prototype = {
            p : null,
            p2 : null,
            _compounds : { p : ["p2"] },
            getP2 : function () {
                return this.p;
            }
        }
        KVC.implement(O);
        function P() {

        } P.prototype = {
            q : null
        };
        KVC.implement(P);
        var o = new O();
        var valueChanges = {};
        o.subscribe("ValueChanged", function (_, keyPath) {
            if (!(keyPath in valueChanges)) {
                valueChanges[keyPath] = 0;
            }
            valueChanges[keyPath]++;
        });
        var p = new P();
        o.setValue("p", p);

        this.assertEqual(1, valueChanges.p, "p");
        this.assertEqual(1, valueChanges.p2, "p2");

        p.setValue("q", "r");
        this.assertEqual(1, valueChanges.p);
        this.assertEqual(1, valueChanges["p.q"]);

        var p2 = new P();
        o.setValue("p", p2);
        this.assertEqual(2, valueChanges.p);
        p.setValue("q", "r2");
        this.assertEqual(1, valueChanges["p.q"]);
        p2.setValue("q", "r3");
        this.assertEqual(2, valueChanges["p.q"]);

        // Keypaths more than one level down should not be subscribed to,
        // since these event will propagate.
        var p3 = new P();
        p2.setValue("q", p3);
        this.assertEqual(3, valueChanges["p.q"]);
        o.setValue("p.q.q", "r4");
        this.assertEqual(1, valueChanges["p.q.q"]);
    });

    // Setters should not prevent events from occurring.
    kvcTC.addTest(function () {
        function O() {
        } O.prototype = {
            y : 2,
            setY : function (y) {
                this.y = y + 1;
            },
            getY : function () {
                return this.y * -1;
            }
        }; KVC.implement (O);
        var o = new O();

        var valueChanges = {};
        o.subscribe("ValueChanged", function (_, keyPath) {
            if (!(keyPath in valueChanges)) {
                valueChanges[keyPath] = 0;
            }
            valueChanges[keyPath]++;
        });
        this.assertEqual(-2, o.getValue("y"));
        o.setValue ("y", 9);
        this.assertEqual(-10, o.getValue ("y"));
        this.assertEqual(1, valueChanges.y);
    });

    // Should not trigger onValueChanged if a value is set to the same
    // as an old value.
    kvcTC.addTest(function () {
        var log = Cactus.Dev.log;

        function O() {
        } O.prototype = {
            x : null
        };
        KVC.implement(O);
        var o = new O();
        var changes = [];
        o.subscribe("ValueChanged", function (o, kp) {
            changes.push([kp, o.getValue(kp)]);
        });
        o.setValue("x", 1);
        this.assertEqual(1, changes.length);
        o.setValue("x", 2);
        this.assertEqual(2, changes.length);
        o.setValue("x", 2);
        this.assertEqual(2, changes.length,
                         "Triggered event when value did not change.");

        var o = new KVC();
        o.p = new KVC();
        o.p.q = 1;
        changes = [];
        o.subscribe("ValueChanged", function (o, kp) {
            changes.push([o, kp, o.getValue(kp)]);
        });
        o.setValue("p.q", 1);
        this.assertEqual(0, changes.length);
    });

    // get should concatenate its arguments into a keypath.
    kvcTC.addTest(function () {
        var o = new KVC();
        o.p = new KVC();
        o.p.q = new KVC();
        o.p.q.r = 1;
        this.assertEqual(1, o.getValue("p","q","r"));
        this.assertEqual(1, o.getValue("p.q","r"));
        this.assertEqual(1, o.getValue("p","q.r"));
    });

    return kvcTC;
};
