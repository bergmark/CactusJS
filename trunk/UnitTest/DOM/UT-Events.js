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

Cactus.UnitTest.DOM.Events = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var Events = Cactus.DOM.Events;
    var log = Cactus.Dev.log;
    var tag = Cactus.DOM.tag;

    var tc = new UT.TestCase ("DOM.Events");
    tc.setup = function () {
        this.o = {};
        this.oFunc = function () { };
        new Events(this.o);
        this.o.events.add("click", this.oFunc);
    };

    // Create an events object.
    tc.addTest(function () {
        var o = this.o;
        this.assert(o.events instanceof Events);
        this.assert(o.onclick instanceof Function);
        this.assertEqual(o, o.events.element.events.element);
    });

    // Test adding single event function.
    tc.addTest(function () {
        var o = this.o;
        this.assert(o.events instanceof Events);
        this.assertEqual(1, o.events.events.onclick.length);
    });

    // Test Events.add.
    tc.addTest(function () {
        var o = {};
        Events.add(o, "click", this.oFunc);
        this.assertEqual(1, o.events.events.onclick.length);
    });

    // Events.add should throw an error if element argument is an array.
    tc.addTest(function () {
        this.assertException(Error,
            Events.add.curry([], "click", Function.empty));
    });

    // Events.add should throw an error if callback argument isn't a function.
    tc.addTest(function () {
        this.assertException(Error,
            Events.add.curry({}, "click", "not a function"));
    });

    // Test event execution.
    tc.addTest(function () {
        var o = {};
        var triggered = false;
        Events.add(o, "click", function () {
            triggered = true;
        });
        o.onclick();
        this.assert(triggered);
        // Add two more events.
        triggered = false;
        var triggeredB = false;
        var triggeredC = false;
        Events.add(o, "click", function () {
            triggeredB = true;
        });
        Events.add(o, "click", function () {
            triggeredC = true;
        });
        o.onclick();
        this.assert(triggered);
        this.assert(triggeredB);
        this.assert(triggeredC);
    });

    // Test event deletion.
    tc.addTest(function () {
        var o = {};
        var triggered;

        triggered = false;
        var eventID = Events.add(o, "click", function () {
            triggered = true;
        });
        o.onclick();
        this.assert(triggered, "event did not trigger");

        o.events.del("click", eventID);
        triggered = false;
        o.onclick();
        this.assertFalse(triggered, "event was not removed");

    });

    // Make sure adding different event types works properly.
    tc.addTest(function () {
        var o = {};
        var triggeredClick = false;
        var triggeredFoo = false;
        Events.add(o, "click", function () {
            triggeredClick = true;
        });
        Events.add(o, "foo", function () {
            triggeredFoo = true;
        });

        o.onclick();
        this.assert (triggeredClick);
        this.assertFalse (triggeredFoo);

        triggeredClick = false;
        o.onfoo();
        this.assert(triggeredFoo);
        this.assertFalse(triggeredClick);
    });

    // Test return value of event.
    tc.addTest(function () {
        var o = {};
        var f = Function.empty.returning(false);
        Events.add(o, "click", f);

        this.assertFalse(o.onclick());

        // Make sure that all added events are triggered.  for this to
        // work we have to make sure that g is executed before h, but
        // how do we do this when for in iterates in an arbitrary
        // order and we don't want to enforce ordering?
        var hTriggered = false;
        var lastTrigger = "";
        function g () {
            lastTrigger = "g";
            return false;
        }
        function h () {
            lastTrigger = "h";
            hTriggered = true;
        }
        Events.add(o, "foo", g);
        Events.add(o, "foo", h);
        this.assertFalse(o.onfoo(), "onfoo did not return false");
        this.assertEqual("h", lastTrigger);
        this.assert(hTriggered, "h did not trigger");
    });

    // Make sure the default scope is the element.
    tc.addTest(function () {
        var test = this;
        var o = {};
        var fooTriggered = false;
        Events.add(o, "foo", function () {
            fooTriggered = true;
            test.assertEqual (o, this);
        });

        o.onfoo();
        this.assert(fooTriggered, "onfoo did not trigger");
    });

    // Make sure adding events returns an ID that we can use to remove
    // the event.
    tc.addTest(function () {
        var o = {};
        var fooTriggered = false;
        var id = Events.add(o, "foo", function () {
            fooTriggered = true;
        });

        o.onfoo();
        this.assert(fooTriggered);

        fooTriggered = false;
        Events.del(o, "foo", id);
        o.onfoo();
        this.assertFalse(fooTriggered);
    });

    // Trying to remove a non-existing event should throw an error.
    tc.addTest(function () {
        var o = {};
        this.assertException (Error, function () {
            Events.del(o, "click", "foo");
        });
    });

    // Test behavior when cloning HTML elements.
    tc.addTest(function () {
        var d1 = tag("div");
        var aTriggered = false;
        var bTriggered = false;
        Events.add(d1, "click", function () {
            aTriggered = true;
        });
        var d2 = d1.cloneNode(true);
        Events.add(d2, "click", function () {
            bTriggered = true;
        });
        d1.onclick();
        this.assert(aTriggered, "A did not trigger.");
        this.assertFalse(bTriggered, "B triggered.");
        d2.onclick();
    });

    // If 3rd party code uses the same method for binding events, we should
    // play nice and not remove the event.
    tc.addTest(function () {
      var initialScope = null;
      var intialE = null;
      var initialTriggered = false;
      var f = function (e) {
          initialTriggered = true;
          initialScope = this;
          initialE = e;
      };
      var el = {
          onclick : f
      };

      var secondaryTriggered = false;
      Events.add(el,"click",function () {
          secondaryTriggered = true;
      });
      var myE = {};
      el.onclick(myE);
      this.assert(initialTriggered, "Initial event did not trigger.");
      this.assert(secondaryTriggered, "New event did not trigger.");
      this.assertEqual(el, initialScope);
      this.assertEqual(myE, initialE);
    });

    return tc;
};
