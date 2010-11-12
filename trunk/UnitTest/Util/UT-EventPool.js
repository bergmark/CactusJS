/*
 * Copyright (c) 2007-2010, Adam Bergmark
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

Cactus.UnitTest.Util.EventPool = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var EventPool = Cactus.Util.EventPool;

    var tc = new TestCase("Util.EventPool");

    // Create a new event, subscribe, trigger.
    tc.addTest(function () {
        var pool = new EventPool();
        pool.createEvent("Foo");
        var triggered = false;
        this.assert("onFoo" in pool);
        pool.subscribe("Foo", function () {
            triggered = true;
        });
        pool.onFoo();
        this.assert(triggered);
    });

    // Shall not be able to create an event that already exists.
    tc.addTest(function () {
        var pool = new EventPool();
        pool.createEvent("Foo");
        this.assertException(/EventPool.+Foo.+exists/, pool.createEvent.bind(pool, "Foo"));
    });

    // Object owning event should get the onEventName function.
    tc.addTest(function () {
        var pool = new EventPool();
        var o = {};
        pool.createEvent("Foo", o);
        this.assert("onFoo" in o, "Object creating event lacks onFoo method.");
        var receivedArg;
        pool.subscribe("Foo", function (arg, foo) {
            receivedArg = foo;
        });
        o.onFoo("foo");
        this.assertEqual("foo", receivedArg);
    });

    return [tc];
};
