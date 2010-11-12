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

Cactus.UnitTest.MVC.Model.FilterDecorator = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var AC = Cactus.MVC.Model.ArrayController;
    var ACD = Cactus.MVC.Model.ArrayControllerDecorator;
    var Filterer = Cactus.MVC.Model.FilterDecorator;

    var tc = new TestCase("MVC.Model.FilterDecorator");

    tc.setup = function () {
        this.reset = function () {
            this.ac = new AC([1, 2, 3, 4]);
            this.filterer = new Filterer(this.ac, function (v) {
                return v % 2 === 0;
            });
            // To make sure the filterer sends out the appropriate events.
            this.acd = new ACD(this.filterer);
        }
        this.reset();
        this.objs = function (ac) {
            ac = ac || this.filterer;
            return ac.getRange().join(",");
        };
    }

    // Instantiation.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        this.assertEqual(4, ac.count());
        // count.
        this.assertEqual(2, filterer.count());
        this.assertEqual(2, filterer.count());
        this.assertEqual("2,4", this.objs());
    });

    // get.
    tc.addTest(function () {
        var filterer = this.filterer;
        this.assertEqual(2, filterer.get(0));
        this.assertEqual(4, filterer.get(1));
    });

    // add.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        // Should not be added to filterer.
        filterer.add(5);
        // Should be added to filterer.
        filterer.add(6);

        this.assertEqual("2,4,6", this.objs());
        this.assertEqual("1,2,3,4,5,6", this.objs(ac));
        this.assertEqual("2,4,6", this.objs(acd),
                         "ACD has incorrect elements.");
    });

    // remove.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        filterer.remove(2);
        filterer.remove(3);

        this.assertEqual("4", this.objs());
        this.assertEqual("1,4", this.objs(ac));
        this.assertEqual("4", this.objs(acd));
    });

    // Swap.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        ac.add(6);
        ac.add(8);

        this.assertEqual("1,2,3,4,6,8", this.objs(ac));
        this.assertEqual("2,4,6,8", this.objs());
        this.assertEqual("2,4,6,8", this.objs(acd));

        // Swapping two existing elements (6 and 8);
        filterer.swap(2, 3);
        // The elements should swap places on the filterer and on the ac.
        this.assertEqual("2,4,8,6", this.objs());
        this.assertEqual("1,2,3,4,8,6", this.objs(ac));
        this.assertEqual("2,4,8,6", this.objs(acd));

        // Swapping with one and none of the elements in the filterer.
        ac.swap(0, 1); // 2 and 1.
        this.assertEqual("2,1,3,4,8,6", this.objs(ac));
        this.assertEqual("2,4,8,6", this.objs());
        this.assertEqual("2,4,8,6", this.objs(acd));
        ac.swap(1, 2); // 1 and 3.
        this.assertEqual("2,3,1,4,8,6", this.objs(ac));
        this.assertEqual("2,4,8,6", this.objs());
        this.assertEqual("2,4,8,6", this.objs(acd));
    });

    // Replace.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        // Replace an object on the filterer.
        filterer.replace(4, 6);
        this.assertEqual("2,6", this.objs());
        this.assertEqual("1,2,3,6", this.objs(ac));
        this.assertEqual("2,6", this.objs(acd));

        // Try to replace an object on the filterer with an object that doesn't
        // belong, the new object should not be added to the filterer.
        filterer.replace(6, 7);
        this.assertEqual("2", this.objs());
        this.assertEqual("1,2,3,7", this.objs(ac));
        this.assertEqual("2", this.objs(acd));

        // Try to replace an object that isn't in the filterer, but the new one
        // would be, the new object should be inserted relative to where it is
        // in the component.
        this.reset();
        ac = this.ac;
        filterer = this.filterer;
        acd = this.acd;
        ac.replace(3, 6);
        this.assertEqual("1,2,6,4", this.objs(ac));
        this.assertEqual("2,6,4", this.objs(filterer));
        this.assertEqual("2,6,4", this.objs(acd));
        // Edge case, when the new object should be insterted at index 0.
        ac.replace(1, 0);
        this.assertEqual("0,2,6,4", this.objs(ac));
        this.assertEqual("0,2,6,4", this.objs());
        this.assertEqual("0,2,6,4", this.objs(acd));

        // Try to replace an object not in the filterer with a new object that
        // shouldn't be added, nothing should happen to the filterer.
        this.reset();
        ac = this.ac;
        filterer = this.filterer;
        acd = this.acd;
        ac.replace(1, 5);
        this.assertEqual("5,2,3,4", this.objs(ac));
        this.assertEqual("2,4", this.objs(filterer));
        this.assertEqual("2,4", this.objs(acd));
    });

    // Allow changing the filter, should cause a refresh.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        filterer.setFilter(function (v) {
            return v % 2 === 1;
        });
        this.assertEqual("1,2,3,4", this.objs(ac));
        this.assertEqual("1,3", this.objs(filterer));
        this.assertEqual("1,3", this.objs(acd));
    });

    // setFilter should be CoR.
    tc.addTest(function () {
        var ac = this.ac;
        var filterer = this.filterer;
        var acd = this.acd;

        // Same as the other setFilter test, but setFilter is called on acd.
        acd.setFilter(function (v) {
            return v % 2 === 1;
        });
        this.assertEqual("1,2,3,4", this.objs(ac));
        this.assertEqual("1,3", this.objs(filterer));
        this.assertEqual("1,3", this.objs(acd));
    });

    // reFilter should rebuild the collection.
    tc.addTest(function () {
        var filterer = this.filterer;
        var acd = this.acd;
        var odd = function (v) {
            return v % 2 === 1;
        };
        var even = function (v) {
            return v % 2 === 0;
        }

        var f = odd;
        filterer.setFilter(function (v) {
            return f(v);
        });
        this.assertEqual("1,3", this.objs(filterer));
        f = even;
        filterer.reFilter();
        this.assertEqual("2,4", this.objs(filterer));

        // Should send out ObjectRearrange.
        var triggered = false;
        filterer.subscribe("ObjectRearrange", function () {
            triggered = true;
        });
        filterer.reFilter();
        this.assert(triggered, "ObjectRearrange did not trigger.");

        // Should be CoR.
        f = odd;
        acd.reFilter();
        this.assertEqual("1,3", this.objs(filterer));
    });

    return [tc];
};
