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

Cactus.UnitTest.Util.EventSubscription = function () {
    var UT = Cactus.Dev.UnitTest;
    var log = Cactus.Dev.log;
    var Test = UT.Test;
    var EventSubscription = Cactus.Util.EventSubscription;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;

    var es = new UT.TestCase ("Util.EventSubscription");

    function C() {
    } C.prototype = {
        onFoo : Function.empty,
        onBar : Function.empty
    };
    EventSubscription.implement(C);

    function S() {
    } S.prototype = {
        onFooTriggered : Function.empty,
        onBarTriggered : Function.empty
    };

    // Test init.
    es.addTest (function () {
        var c = new C();

        c.onFoo();
        this.assertEqual (Function.empty, c.onFoo,
                          "onFoo is not the empty function");

        this.assertFalse (c._hasEvent ("Foo"));
        this.assertFalse (c._hasEvent ("onFoo"));
        this.assert (c.implementsEvent ("Foo"), "Foo is not implemented");
        this.assertFalse (c.implementsEvent ("onFoo"));


    });
    // Whitebox.
    // _createEvent and _hasEvent.
    es.addTest (new Test (function () {
        this.processResults();
    }, function () {
        var c = new C();

        this.assertFalse (c._hasEvent ("Foo"));
        this.assertFalse (c._hasEvent ("onFoo"));

        c._createEvent ("Foo");
        // Make sure that the prototype property object is exchanged.
        this.assertFalse (c._subscribers === C.prototype._subscribers);
        this.assertFalse (c.onFoo === C.prototype.onFoo);

        this.assert (c._hasEvent ("Foo"), "does not have event Foo");
        this.assertFalse (c._hasEvent ("onFoo"));
    }));

    // Test subscribe.
    es.addTest (new Test (null, function () {
        var c = new C();
        var s = new S();
        var test = this;

        c.subscribe("Foo", s);

        this.assertEqual (s, c._subscribers.Foo[0].getSubscriber());

        var triggered = false;
        s.onFooTriggered = function (o) {
            triggered = true;
            test.assertEqual (c, o);
            test.assertEqual (s, this);
        }
        c.onFoo();
        this.assert (triggered, "not triggered");
    }));

    // Make sure different events don't interfere with each other.
    es.addTest (function () {
        var c = new C();
        var s = new S();
        var test = this;

        c.subscribe("Foo", s);
        c.subscribe("Bar", s);

        var triggeredFoo = false;
        var triggeredBar = false;
        s.onFooTriggered = function () {
            triggeredFoo = true;
        };
        s.onBarTriggered = function () {
            triggeredBar = true;
        };
        c.onFoo();
        this.assert (triggeredFoo, "foo not triggered");
        this.assertFalse (triggeredBar, "bar was not triggered");

        triggeredFoo = false; triggeredBar = false;
        c.onBar();
        this.assertFalse (triggeredFoo, "foo was triggered");
        this.assert (triggeredBar, "bar was not triggered");
    });

    // Make sure all observers are notified.
    es.addTest (function () {
        var c = new C();
        var s1 = new S();
        var s2 = new S();

        var s1triggered = false;
        var s2triggered = false;
        s1.onFooTriggered = function () {
            s1triggered = true;
        };
        s2.onFooTriggered = function () {
            s2triggered = true;
        };
        c.subscribe("Foo", s1);
        c.subscribe("Foo", s2);
        c.onFoo();

        this.assert (s1triggered);
        this.assert (s2triggered);
    });

    // Test subscribing with a function.
    es.addTest (function () {
        var c = new C();

        var triggered = false;
        c.subscribe("Foo", function () {
            triggered = true;
        });
        c.onFoo();
        this.assert (triggered, "subscriber function was not triggered");
    });

    // Test the automatic removal of subscriptions.
    es.addTest (function () {
        var c = new C();
        var o = {onFooTriggered : Function.empty};
        var p = {onFooTriggered : Function.empty};
        c.subscribe("Foo", o, true);
        c.subscribe("Foo", p);
        this.assertEqual (o, c._subscribers.Foo[0].getSubscriber());
        this.assertEqual (p, c._subscribers.Foo[1].getSubscriber());
        this.assertEqual (2, c._subscribers.Foo.length);
        c.onFoo();
        this.assertEqual (1, c._subscribers.Foo.length,
                          "Subscription was not removed");
        this.assertEqual (p, c._subscribers.Foo[0].getSubscriber());

        var oFooTriggered = false;
        o.onFooTriggered = function () {
            oFooTriggered = true;
        };
        var pFooTriggered = false;
        p.onFooTriggered = function () {
            pFooTriggered = true;
        };
        c.onFoo();
        this.assertFalse(oFooTriggered);
        this.assert(pFooTriggered);

        // Create and remove only one subscription.
        var c = new C();
        var o = { onFooTriggered : Function.empty };
        c.subscribe("Foo", o, true);
        c.onFoo();
        this.assertEqual (0, c._subscribers.Foo.length);

        // Removal when the subscriber is a function.
        c = new C();
        var triggers = 0;
        c.subscribe("Foo", function () {
            triggers++;
        }, true);
        c.onFoo();
        c.onFoo();
        this.assertEqual(1, triggers);

    });

    // Test adding ES to a single instance.
    es.addTest (new Test (null, function () {
        var o = {};
        EventSubscription.addToInstance (o);
        this.assert("subscribe" in o);
    }));

    // Make sure all  arguments passed to the event  by the observable
    // are passed along to the subscribers.
    es.addTest (new Test (null, function () {
        var c = new C();
        var args;
        c.subscribe("Foo", function (object, arg1, arg2) {
            args = arguments;
        });
        c.onFoo ("bar", "baz");
        this.assertEqual (c, args [0]);
        this.assertEqual ("bar", args [1]);
        this.assertEqual ("baz", args [2]);
    }));

    // Make sure errors are thrown if an object can't send out an event.
    es.addTest (new Test (null, function () {
        var c = new C();
        this.assertFalse (c.implementsEvent ("Bax"));
        this.assert (c.implementsEvent ("Foo"));
        this.assertException(Error,
                             c.subscribe.bind(null, "Bax", Function.empty));
    }));

    // Test hasSubscriber method.
    es.addTest (function () {
        var c = new C();
        var o = {};
        this.assertFalse(c.hasSubscriber (o, "Foo"),
                         "hasSubscriber false positive");
        c.subscribe("Foo", o);
        this.assert(c.hasSubscriber (o, "Foo"),
                    "hasSubscriber false negative");

        c.removeSubscriber (o, "Foo");
        this.assertFalse(c.hasSubscriber (o, "Foo"),
                         "hasSubscriber false positive after removal");
    });

    // subscribe should return the subscription ID.
    es.addTest(function () {
        var c = new C();
        var id1 = c.subscribe("Foo", {});
        var id2 = c.subscribe("Foo", {});
        this.assert(id1 !== id2,
                    "ID's were equal (%s)".format(JSON.stringify(id1)));
    });

    // Make sure addSubscriber is unusable.
    es.addTest(function () {
        var c = new C();
        this.assertException(/been renamed/,
                             c.addSubscriber.bind(c, {}, "Foo"));
    });

    // implementsInterface.
    es.addTest(function () {
        var p = EventSubscription.implementsInterface;
        this.assert(p(new C()));
        this.assert(p(new EventSubscription));
        this.assertFalse(p({}));
    });

    // Allow a client to subscribe to all events sent out.
    es.addTest(function () {
        var c = new C();
        var s = new S();

        var ids = c.subscribeAll(s);
        this.assertEqual(2, ids.length);
        var fooTriggered = false;
        s.onFooTriggered = function () {
            fooTriggered = true;
        };
        var barTriggered = false;
        s.onBarTriggered = function () {
            barTriggered = true;
        };

        c.onFoo();
        this.assert(fooTriggered);
        c.onBar();
        this.assert(barTriggered);

        var eventsTriggered = 0
        c.subscribeAll(function (_, eventName) {
            eventsTriggered++;
        });
        c.onFoo();
        c.onBar();
        this.assertEqual(2, eventsTriggered);
    });

    return es;
};
