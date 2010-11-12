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

Cactus.UnitTest.DOM.EventManager = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var EventManager = Cactus.DOM.EventManager;
    var Events = Cactus.DOM.Events;
    var tag = Cactus.DOM.tag;
    var EventSubscription = Cactus.Util.EventSubscription;

    var tc = new TestCase("DOM.EventManager");

    tc.addTest(function () {
        var em = new EventManager();
        var divFoo = tag("div", { id : "foo" });
        var divBar = tag("div", { id : "bar" });

        var fooTriggered = false;
        var barTriggered = false;

        // Add events.
        em.add(divFoo, "click", function () {
            fooTriggered = true;
        });

        divFoo.onclick();
        this.assert(fooTriggered);
        em.add(divBar, "click", function () {
            barTriggered = true;
        });


        // Detach all subscribed events.
        em.detach();
        fooTriggered = false;
        barTriggered = false;
        divFoo.onclick();
        divBar.onclick();
        this.assertFalse(fooTriggered, "Foo was triggered.");
        this.assertFalse(barTriggered, "Bar was triggered.");
    });

    // Also support EventSubscription.
    tc.addTest(function() {
        var em = new EventManager();
        var es = new EventSubscription();
        es.onFoo = Function.empty;
        var fooTriggered = false;
        em.add(es, "Foo", function () {
            fooTriggered = true;
        });

        this.assertFalse(es.events instanceof Events,
                         "Instantiated DOM.Events.");

        es.onFoo();
        this.assert(fooTriggered);

        fooTriggered = false;
        em.detach();
        es.onFoo();
        this.assertFalse(fooTriggered);
    });

    return [tc];
};
