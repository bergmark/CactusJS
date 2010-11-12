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

Cactus.UnitTest.MVC.Model.ArrayControllerDecorator = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var AC = Cactus.MVC.Model.ArrayController;
    var ACD = Cactus.MVC.Model.ArrayControllerDecorator;
    var log = Cactus.Dev.log;

    var tc = new TestCase ("MVC.Model.ArrayControllerDecorator");

    function objs(ac) {
        return ac.getRange().join(",");
    }

    // Initialization.
    tc.addTest (function () {
        var ac = new AC();
        var acd = new ACD (ac);

        this.assertEqual (ac, acd.getComponent());

        var acd2 = new ACD (acd);
        this.assertEqual (acd, acd2.getComponent());
        this.assertEqual (ac, acd2.getRootComponent());
    });

    // Object propagation.
    tc.addTest (function () {
        var ac = new AC ([1, 2, 3]);
        var acd = new ACD (ac);

        this.assertEqual("123", ac.getRange().join (""));

        // Add object to ac.
        ac.add(4);
        this.assertEqual("1234", acd.getRange().join (""));

        // Add to acd.
        acd.add(5);
        this.assertEqual("12345", acd.getRange().join (""));
        this.assertEqual("12345", ac.getRange().join (""));

        // Remove from ac.
        ac.remove(3);
        this.assertEqual ("1245", acd.getRange().join (""));

        // Remove from acd.
        acd.remove(2);
        this.assertEqual ("145", acd.getRange().join (""));
        this.assertEqual ("145", ac.getRange().join (""));

        // Swap on ac.
        ac.swap (0, 1);
        this.assertEqual ("415", acd.getRange().join (""));

        // Swapping on acd.
        acd.swap (0, 1);
        this.assertEqual ("145", acd.getRange().join (""));
    });

    // Chain of Responsibility.
    tc.addTest (function () {
        var test = this;
        var ac = new AC ([1, 2, 3]);
        var acd = new ACD (ac);
        var triggered = false;
        acd.f = function () {
            test.assertEqual (acd, this);
            triggered = true;
        };
        ACD.createChainOfResponsibilityMethod ("f");
        var acd2 = new ACD (acd);

        acd.f();

        this.assert (triggered, "CoR method did not trigger");

        // Add several methods using createChainOfResponsibilityMethods.
        var gTriggered;
        acd.g = function () {
            gTriggered = true;
        };
        var hTriggered;
        acd.h = function () {
            hTriggered = true;
        };
        ACD.createChainOfResponsibilityMethods ("g", "h");

        acd2.g();
        acd2.h();

        this.assert (gTriggered, "g did not trigger");
        this.assert (hTriggered, "h did not trigger");

        // The return value should propagate.
        acd.i = function () {
            return "i";
        };
        ACD.createChainOfResponsibilityMethod ("i");
        this.assertEqual ("i", acd2.i());
    });

    // replace.
    tc.addTest (function () {
        var ac = new AC ([1, 2]);
        var acd = new ACD (ac);

        // Replace on ac.
        ac.replace(1, 4);
        this.assertEqual ("42", ac.getRange().join (""));
        this.assertEqual ("42", acd.getRange().join (""));

        // Replace on acd.
        acd.replace(4, 5);
        this.assertEqual ("52", ac.getRange().join(""));
        this.assertEqual ("52", acd.getRange().join(""));
    });

    // addOAtIndex.
    tc.addTest(function () {
        var ac = new AC([1, 2]);
        var acd = new ACD(ac);

        // Call on ac.
        ac.addAtIndex(0, 3);
        this.assertEqual("3,1,2", objs(ac));
        this.assertEqual("3,1,2", objs(acd));

        // Call on acd.
        acd.addAtIndex(0, 4);
        this.assertEqual("4,3,1,2", objs(acd));
        this.assertEqual("4,3,1,2", objs(ac));
    });

    return tc;
};
