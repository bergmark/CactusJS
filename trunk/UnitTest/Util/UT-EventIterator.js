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

Cactus.UnitTest.Util.EventIterator = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var EventIterator = Cactus.Util.EventIterator;
    var EventSubscription = Cactus.Util.EventSubscription;
    var log = Cactus.Dev.log;

    var tc = new UT.TestCase ("Util.EventIterator");

    function C (value) {
        this.value = value;
    } C.prototype = {
        // Events.
        onFinish : Function.empty,

        funcCalled : false,
        beforeCalled : false,
        afterCalled : false
    };
    EventSubscription.implement (C);

    // Make sure items are iterated in the right order (forward).
    tc.addTest (new Test (function () {
        var test = this;
        var v = -1;
        var a = [];
        C.prototype.f = function () {
            test.assert (v < this.value, "v >= this.value");
            v = this.value;
            setTimeout (this.onFinish.bind (this), 1);
        };
        for (var i = 0; i < 10; i++) {
            a.push (new C (i));
        }

        var ei = new EventIterator (a, "f", "Finish");

        ei.subscribe("Finish", this.processResults.bind (this));

        ei.startForward();
    }, function () {
        delete C.prototype.f;
    }));

    // Make sure items are iterated in the right order (backward).
    tc.addTest (new Test (function () {
        var test = this;
        var v = 10;
        var a = [];
        for (var i = 0; i < 10; i++) {
            a.push (new C (i));
        }
        C.prototype.f = function () {
            test.assert (v > this.value, "v <= this.value");
            v = this.value;
            setTimeout (this.onFinish.bind (this), 1);
        };

        var ei = new EventIterator (a, "f", "Finish");

        ei.subscribe("Finish", this.processResults.bind (this));

        ei.startBackward();
    }, function () {
        delete C.prototype.f;
    }));

    // before/afterProcessing.
    tc.addTest (new Test (function () {
        var test = this;
        var a = [];
        for (var i = 0; i < 10; i++) {
            a.push (new C (i));
        }
        C.prototype.f = function () {
            this.funcCalled = true;
            setTimeout (this.onFinish.bind (this), 1);
        };

        var ei = new EventIterator (a, "f", "Finish");
        ei.setBeforeProcessing (function () {
            this.beforeCalled = true;
        });
        ei.setAfterProcessing (function () {
            this.afterCalled = true;
        });
        ei.subscribe("Finish", this.processResults.bind (this, a));
        ei.startForward();
    }, function (a) {
        delete C.prototype.f;
        var v;
        for (var i = 0; i < a.length; i++) {
            v = a [i];
            this.assert (v.funcCalled, "func was not called");
            this.assert (v.beforeCalled, "before was not called");
            this.assert (v.afterCalled, "after was not called");
        }
    }));

    // onItemProcessed and onBeforeItemProcess.
    // Check the order of the events and make sure they trigger.
    tc.addTest(new Test(function () {
        var log = [];
        var test = this;
        var a = [];
        for (var i = 0; i < 2; i++) {
            a.push(new C(i));
        }
        C.prototype.f = function () {
            log.push("process: " + this.value);
            setTimeout(this.onFinish.bind(this), 1);
        };

        var ei = new EventIterator (a, "f", "Finish");
        ei.subscribe("ItemProcessed", function (ei, item) {
            log.push("processed: " + item.value);
        });
        ei.subscribe("BeforeItemProcess", function (ei, item) {
            log.push("before: " + item.value);
        });
        ei.subscribe("Finish", this.processResults.bind(this, log));
        ei.startForward();
    }, function (log) {
        this.assertEqual("before: 0, process: 0, processed: 0, "
                         + "before: 1, process: 1, processed: 1",
                         log.join(", "))

    }));

    // stop().
    tc.addTest (new Test (function () {
        var test = this;
        var a = [];
        for (var i = 0; i < 10; i++) {
            a.push (new C (i));
            a [a.length - 1].stopTest = true;
        }
        C.prototype.f =  function () {
            this.funcCalled = true;
            setTimeout (this.onFinish.bind (this), 1);
        };
        this.assertFalse (a [9].funcCalled, "last element started out as called");

        var ei = new EventIterator (a, "f", "Finish");
        ei.setBeforeProcessing (function () {
            this.beforeCalled = true;
        });
        ei.setAfterProcessing (function () {
            this.afterCalled = true;
        });
        ei.subscribe("Finish",
                     this.assert.bind(this, false, "onFinish triggered"));
        ei.subscribe("Stop", this.processResults.bind(this, a));
        ei.startForward();
        setTimeout(ei.stop.bind(ei), 1);

    }, function (a) {
        delete C.prototype.f;

        // Loop through and check that the last 4-6 objects haven't
        // run  and that no objects are in an inconsistent state.
        // (funcCalled, beforeCalled, afterCalled) should all have the
        // same value.
        this.assert (a [0].funcCalled, "first element was not called");
        this.assertFalse (a [9].funcCalled, "last element was called");
        for (var i = 0; i < a.length; i++) {
            this.assert (this.funcCalled === this.beforeCalled);
            this.assert (this.funcCalled === this.afterCalled);
        }
    }));

    // Methods should be called polymorphically by name and not be specified as
    // functions.
    tc.addTest (new Test (function () {
        var a = [new C (0), new C (1)];
        a [0].f = function () {
            this.triggeredA = true;
            setTimeout (this.onFinish.bind (this), 1);
        };
        a [1].f = function () {
            this.triggeredB = true;
            setTimeout (this.onFinish.bind (this), 1);
        };
        var ei = new EventIterator (a, "f", "Finish");
        ei.subscribe("Finish", this.processResults.bind(this, a));
        ei.startForward();
    }, function (a) {
        this.assert (a [0].triggeredA, "triggeredA did not trigger for a [0]");
        this.assert (a [1].triggeredB, "triggeredB did not trigger for a [1]");
    }));

    return tc;
};
