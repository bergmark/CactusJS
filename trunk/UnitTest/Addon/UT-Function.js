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

Cactus.UnitTest.Addon.Function = function () {
    var log = Cactus.Dev.log;
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;

    var tc = new TestCase("Addon.Function");
    tc.addTest(function () {
        var t = this;
        var o = {};
        var f;

        // Call in scope of o.
        f = (function () {
            t.assertEqual(o, this);
        }).bind(o);

        // Call in scope of o passing args to bind.
        f = (function (a, b) {
            t.assertEqual(1, a);
            t.assertEqual(2, b);
            t.assertEqual(o, this);
        }).bind(o, 1, 2);

        f();

        // Call in scope of o passing args to f.
        f = (function (a, b) {
            t.assertEqual(3, a);
            t.assertEqual(4, b);
            t.assertEqual(o, this);
        }).bind(o);

        f(3, 4);

        // Call in scope of o passing args to bind and f.
        f = (function (a, b, c, d) {
            t.assertEqual(5, a);
            t.assertEqual(6, b);
            t.assertEqual(7, c);
            t.assertEqual(8, d);
            t.assertEqual(o, this);
        }).bind(o, 5, 6);

        f(7,8);

        // Make sure no extra arguments are passed.
        (function () {
            t.assertEqual(3, arguments.length);
        }).bind(null, 0, 1, 2)();

        // > Should pass along the scope from the bind call if first arg to bind
        // is null.
        var o = {};
        (function () {
            t.assertEqual(o, this);
        }).bind(null).call(o);
    });

    // curry.
    tc.addTest(function () {
        var o = {};
        var test = this;

        // Curry arg.
        (function (a, b) {
            test.assertEqual("a", a);
            test.assertEqual("b", b);
        }).curry("a", "b")();

        // Call in scope of curry call.
        (function () {
            test.assertEqual(o, this);
        }).curry().call(o);

        // Pass along args to curried function.
        (function (c, d) {
            test.assertEqual("c", c);
            test.assertEqual("d", d);
        }).curry()("c", "d");

        // Combine curried arguments and passed arguments.
        (function (a, b, c, d) {
            test.assertEqual("a", a);
            test.assertEqual("b", b);
            test.assertEqual("c", c);
            test.assertEqual("d", d);
        }).curry("a", "b")("c", "d");
    });

    // extend.
    // Test instanceof.
    tc.addTest (function () {
        function A () { }
        function B () { }
        B.extend (A);
        this.assertInstance (A, new A());
        this.assertInstance (B, new B());
        this.assertInstance (A, new B());
        this.assertEqual(A, B.SuperClass);
        this.assertEqual(A, new B().SuperClass);
    });

    // extend.
    // Test inheritance and overrides.
    tc.addTest(function () {
        function A() { }
        A.prototype.x = 1;
        A.prototype.y = 2;
        function B() { }
        B.prototype.y = 3;
        B.prototype.z = 4;
        B.extend(A);

        var a = new A();
        var b = new B();
        this.assertEqual(1, a.x);
        this.assertEqual(2, a.y);
        this.assertEqual(1, b.x);
        this.assertEqual(3, b.y);
        this.assertEqual(4, b.z);
    });

    // extend.
    // Classes should be able to intervene when they are subclassed.
    tc.addTest(function () {
        function A() {}
        A.__onExtend = function (SubClass) {
            SubClass.x = 1;
        };
        function B() {}
        B.extend(A);
        this.assertEqual(1, B.x);

        // Should propagate up the inheritance chain.
        B.__onExtend = function (SubClass) {
            SubClass.y = 2;
        };
        function C() {}
        C.extend(B);
        C.__onExtend = function (SubClass) {
            SubClass.y = 3;
        };
        function D() {}
        D.extend(C);
        this.assertEqual(1, D.x);
        this.assertEqual(3, D.y);
    });

    // empty
    tc.addTest(function () {
        this.assertInstance (Function, Function.empty);
        Function.empty();
    });

    // Assert that the specified values are returned.
    tc.addTest (function () {
        this.assertEqual(2, (function () {
            return 1;
        }).returning(2)());
        this.assertEqual(3, Function.empty.returning(3)());
    });

    // Make sure that returning passes all arguments it gets through
    // to the inner function.
    tc.addTest (function () {
        var test = this;
        this.assertEqual(4, (function (a, b, c) {
            test.assertEqual(1, a);
            test.assertEqual(2, b);
            test.assertEqual(3, c);
        }).returning (4)(1, 2, 3));
    });
    // Should call the inner function in the scope of the outer.
    tc.addTest(function () {
        var o = {};
        var test = this;
        (function () {
            test.assertEqual(o, this);
        }).returning(0).call(o);
    });

    tc.addTest (function () {
        var called = false;
        function f() {
            called = true;
        }

        f.filter (1)(1);
        this.assert (called, "filter(1)(1) did not call f");

        called = false;
        f.filter (2)(3);
        this.assertFalse (called, "filter(2)(3) called f");

        called = false;
        f.filter (4, 5)(4, 5);
        this.assert (called, "(4,5)(4,5) did not call f");

        called = false;
        f.filter (6, 7)(6);
        this.assertFalse (called, "67 6 called f");

        called = false;
        f.filter (8)(8, 9);
        this.assert (called, "8 89 did not call f");

        called = false;
        f.filter ([])([]);
        this.assertFalse (called, "[] [] called f");

        called = false;
        f.filter(undefined)(1);
        this.assert(called, "undefined 1 called f");
    });

    tc.addTest (function () {
        var self = this;
        var triggered = false;
        var f = function (a, b, c) {
            triggered = true;
            self.assertEqual(3, arguments.length);
            self.assertEqual("x", a);
            self.assertEqual("y", b);
            self.assertEqual("z", c);
        }

        f.filter("x")("x", "y", "z");
        this.assert(triggered, "filter(x)(x, y, z) did not trigger");
    });

    // wait.
    tc.addTest(new Test(function () {
        var t = new Date();
        this.processResults.bind(this, t).wait(50)();
    }, function (time) {
        var t = new Date();
        // Due to the inexact behavior of setTimeout, the diff may be lower than
        // the specified time.
        this.assert(t - time >= 3,
                    "t(%s) - time(%s) = %s".format(t.getMilliseconds(),
                                                   time.getMilliseconds(),
                                                   t - time));
    }));
    // The scope of wait's returned function should propagate to the delayed
    // function.
    tc.addTest(new Test(function () {
        this.processResults.bind(null).wait(20).call(this);
    }, function () {
        this.assert(true);
    }));
    // Arguments should propagate from the function that executes the timeout
    // to the delayed function.
    (function () {
        var timeout;
        var arg0 = {};
        var arg1 = {};
        tc.addTest(new Test(function () {
            var that = this;
            timeout = setTimeout(this.processResults.bind(this, "timeout"),
                                 1000);
            var f = this.processResults.bind(this).wait(0);
            f(arg0, arg1);
        }, function (a, b) {
            clearTimeout(timeout);
            this.assert(a !== "timeout", "Test timed out.");
            this.assertEqual(arg0, a);
            this.assertEqual(arg1, b);
        }));
    })();

    // once.
    tc.addTest(function () {
        var executions = 0;

        var test = this;
        var f = function (a, b) {
            test.assertEqual("a", a);
            test.assertEqual("b", b);
            executions++;
            return "foo";
        }.once();

        this.assertEqual(0, executions);
        this.assertEqual("foo", f("a", "b"));
        this.assertEqual(1, executions);
        this.assertEqual(null, f());
        this.assertEqual(1, executions);
    });

    // skip.
    tc.addTest(function () {
        var test = this;

        // Skip one argument.
        var triggered = false;
        (function (b, c) {
            triggered = true;
            test.assertEqual(2, arguments.length);
            test.assertEqual("b", b);
            test.assertEqual("c", c);
        }).skip(1)("a", "b", "c");
        this.assert(triggered);

        // Skip two arguments.
        (function (c) {
            test.assertEqual(1, arguments.length, "Not 1 argument.");
            test.assertEqual("c", c);
        }).skip(2)("a", "b", "c");

        // Skip no arguments.
        (function (a, b) {
            test.assertEqual(2, arguments.length);
            test.assertEqual("a", a);
            test.assertEqual("b", b);
        }).skip(0)("a", "b");

        // Skip more arguments than are passed to the skipper.
        (function (a, b) {
            test.assertEqual(0, arguments.length);
        }).skip(2)();

        // Keep scope.
        var o = {};
        (function () {
            test.assertEqual(o, this);
        }).skip().call(o);
    });

    // none.
    tc.addTest(function () {
        var test = this;
        var o = {};
        var triggered = false;
        (function () {
            triggered = true;
            test.assertEqual(0, arguments.length);
            test.assertEqual(o, this);
        }).none().call(o, "a", "b", "c");
        this.assert(triggered, "Inner function did not trigger.");

        triggered = false;
        (function () {
            triggered = true;
            test.assertEqual(2, arguments.length);
        }).curry(1, 2).none()(3,4);
        this.assert(triggered, "Inner function did not trigger.");
    });

    // exec.
    tc.addTest(function () {
        var test = this;
        var triggers = 0;
        function f() {
            triggers++;
            return "foo";
        }
        this.assertEqual(f, f.exec());
        this.assertEqual(1, triggers);
        this.assertEqual("foo", f.exec()());
        this.assertEqual(3, triggers);
    });

    return tc;
};
