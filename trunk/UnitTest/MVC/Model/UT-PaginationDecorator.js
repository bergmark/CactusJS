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

Cactus.UnitTest.MVC.Model.PaginationDecorator = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var Model = Cactus.MVC.Model;
    var AC = Model.ArrayController;
    var ACD = Model.ArrayControllerDecorator;
    var Paginator = Model.PaginationDecorator;
    var log = Cactus.Dev.log;

    var tc = new TestCase ("MVC.Model.PaginationDecorator");

    tc.setup = function () {
        this.ac = new AC([1, 2, 3, 4, 5, 6]);
        this.paginator = new Paginator(this.ac);
        this.paginator.setObjectsPerPage (4);
        var p = this.paginator;
        this.objects = function () {
            return p.getRange().join("");
        }
    };

    // Instantiation.
    tc.addTest (function () {
        // Two items per page.
        var p = new Paginator (this.ac, 2);
        this.assertEqual (3, p.getPageCount());
        this.assertEqual (0, p.getPage());
        this.assertEqual (2, p.getObjectsPerPage());
        this.assertEqual (1, p.get(0));
        this.assertEqual (2, p.get(1));
    });

    // Changing pages.
    tc.addTest (function () {
        var p = this.paginator;
        p.setObjectsPerPage (2);
        this.assertEqual (3, p.getPageCount());
        p.setPage (0);
        this.assertEqual ("12", this.objects());
        p.setPage (1);
        this.assertEqual ("34", this.objects());
        p.setPage (2);
        this.assertEqual ("56", this.objects());
    });

    // Viewing when the last page isn't full.
    tc.addTest (function () {
        var p = this.paginator;
        this.assertEqual (2, p.getPageCount());
        p.setPage (0);
        this.assertEqual ("1234", this.objects());
        p.setPage (1);
        this.assertEqual ("56", this.objects());
    });

    // Add objects to the end.
    tc.addTest (function () {
        var p = this.paginator;
        p.setPage (1);

        this.assertEqual (2, p.count());

        p.add (7);
        // Call should have propagated to the AC.
        this.assertEqual ("1234567", this.ac.getRange().join (""));
        this.assertEqual (3, p.count());

        // Add two objects to create a page.
        p.add (8);
        this.assertEqual (2, p.getPageCount());
        p.add (9);
        this.assertEqual (3, p.getPageCount());

        p.setPage (2);
        this.assertEqual ("9", this.objects());
    });

    // Swapping of objects.
    tc.addTest (function () {
        var p = this.paginator;
        var ac = this.ac;

        // Swap inside the page.
        p.swap (0, 1);
        this.assertEqual ("2134", this.objects());
        this.assertEqual ("213456", ac.getRange().join (""));


        ac = new AC (["a", "b", "c", "d"]);
        p = new Paginator (ac, 2, 0);

        // Swap with the last element of this page and the first element of the
        // next using the AC.
        ac.swap (1, 2);
        this.assertEqual ("acbd", ac.getRange().join (""));
        this.assertEqual ("ac", p.getRange().join (""));

        // Swap with an element on this page and an element on a previous page.
        ac = new AC (["a", "b", "c", "d"]);
        p = new Paginator (ac, 2, 1);
        ac.swap (1, 2);
        this.assertEqual ("acbd", ac.getRange().join (""));
        this.assertEqual ("bd", p.getRange().join (""));
    });

    function objs (controller) {
        return controller.getRange().join ("");
    }

    // addAtIndex.
    tc.addTest (function () {
        var ac = new AC (["a", "b", "c", "d"]);
        var p = new Paginator (ac, 2, 0);

        this.assertEqual ("abcd", objs (ac));
        this.assertEqual ("ab", objs (p));

        // Insertions from the paginator.
        // Add as the first element.
        p.addAtIndex (0, "e");
        this.assertEqual ("eabcd", objs (ac));
        this.assertEqual ("ea", objs (p));

        // Insertions from the ac.
        // Add to the left of the paginator's page.
        p.setPage (1);
        this.assertEqual ("bc", objs (p));
        ac.addAtIndex (0, "f");
        this.assertEqual ("feabcd", objs (ac));
        this.assertEqual ("ab", objs (p));

        // Add in the middle of the page, shifting elements out.
        p.setPage (1);
        this.assertEqual ("feabcd", objs (ac));
        this.assertEqual ("ab", objs (p));
        ac.addAtIndex (2, "g");
        this.assertEqual ("fegabcd", objs (ac));
        this.assertEqual ("ga", objs (p));
    });

    // replace.
    tc.addTest (function () {
        var ac = new AC (["a", "b"]);
        var p = new Paginator (ac, 2);

        // Replace on the ac.
        ac.replace ("a", "c");
        this.assertEqual ("cb", objs (ac));
        this.assertEqual ("cb", objs (p));

        // Replace on the paginator.
        p.replace ("b", "d");
        this.assertEqual ("cd", objs (ac));
        this.assertEqual ("cd", objs (p));
    });

    // Remove objects.
    tc.addTest (function () {
        var p = this.paginator;
        var ac = this.ac;
        p.add (7);
        p.setPage (0);

        this.assertEqual ("1234", this.objects());
        // Remove from the next page, nothing should change on the current page.
        p.remove (5);
        this.assertEqual ("1234", this.objects());
        p.setPage (1);
        this.assertEqual ("67", this.objects());

        p.setPage (1);
        this.assertEqual ("67", this.objects());
        p.remove (7);
        this.assertEqual ("6", this.objects());


        p.setPage (0);
        // If the active page is the last page and the last item is shifted off
        // it, the active page should be changed to the previous page.
        this.assertEqual ("12346", ac.getRange().join (""));
        this.assertEqual ("1234", this.objects());

        p.setPage (1);
        this.assertEqual ("6", this.objects());
        ac.remove (4);
        this.assertEqual (0, p.getPage());
        this.assertEqual ("1236", this.objects(), "Page not shifted correctly");

        // Unless the active page is 0, in which case it remains empty.
        ac = new AC ([1]);
        p = new Paginator (ac, 2, 0);
        this.assertEqual ("1", p.getRange().join (""));
        p.remove (1);
        this.assertEqual (0, p.count());
        this.assertEqual (1, p.getPageCount());

        // Remove from a page when the next page has items, which should mean
        // that the first item on the next page is shifted to the current one.
        ac = new AC([1,2,3])
        p = new Paginator(ac, 2, 0);
        this.assertEqual (2, p.getPageCount());
        this.assertEqual ("12", p.getRange().join(""));
        p.remove(2);
        this.assertEqual (1, p.getPageCount());
        this.assertEqual ("13", p.getRange().join(""));
    });

    // Test the Chain of Responsibility methods.
    tc.addTest (function () {
        var p = this.paginator;
        var acd = new ACD (p);

        this.assertEqual (0, acd.getPage());
        acd.setObjectsPerPage (1);
        this.assertEqual (1, acd.getObjectsPerPage());
        acd.setPage (1);
        this.assertEqual (1, acd.getPage());
        this.assertEqual (6, acd.getPageCount());
    });

    // Assert that onPageCountUpdated is triggered correctly.
    tc.addTest (function () {
        var test = this;
        var p = this.paginator;
        var pageCountUpdatedTriggered;
        var triggered;

        p.setObjectsPerPage (2);

        // Add a page using add and check that proper arguments are
        // passed.
        triggered = false;
        p.subscribe("PageCountUpdated",
                        function (paginator, pageCount, oldPageCount) {
            test.assertEqual (p, paginator);
            test.assertEqual (4, pageCount);
            test.assertEqual (3, oldPageCount);
            triggered = true;
        }, true);
        p.add(7);
        this.assert(triggered,
                   "pageCountUpdated did not trigger when add was used.");

        // Remove a page using remove.
        triggered = false;
        p.subscribe("PageCountUpdated",
                    function (paginator, pageCount, oldPageCount) {
            test.assertEqual (3, pageCount);
            test.assertEqual (4, oldPageCount);
            triggered = true;
        }, true);
        p.remove (7);
        this.assert(triggered,
                "pageCountUpdated did not trigger when remove was used.");

        // Add a page using insertObjectAtIndex.
        triggered = false;
        p.subscribe("PageCountUpdated",
                    function (paginator, pageCount, oldPageCount) {
            test.assertEqual (4, pageCount);
            test.assertEqual (3, oldPageCount);
            triggered = true;
        }, true);
        p.addAtIndex (0, 8);
        this.assert(triggered,
         "pageCountUpdated did not trigger when insertObjectAtIndex was used.");
    });

    // Assert that onPageChanged is triggered.
    tc.addTest (function () {
        var test = this;
        var p = this.paginator;
        var triggered;

        triggered = false;
        p.subscribe("PageChanged",
                    function (paginator, page, oldPage) {
            test.assertEqual (p, paginator);
            test.assertEqual (1, page);
            test.assertEqual (0, oldPage);
            triggered = true;
        }, true);
        p.setPage (1);
        this.assert (triggered, "pageChanged did not trigger");
    });

    // onObjectReplacedTriggered.
    tc.addTest (function () {
        var test = this;
        var p = this.paginator;
        var ac = this.ac;

        p.setObjectsPerPage(2);
        p.setPage(1);

        // Replace an object inside the current page.
        ac.replace (3, 7);
        this.assertEqual ("127456", objs (ac));
        this.assertEqual ("74", objs (p));

        ac.replace (4, 8);
        this.assertEqual ("127856", objs (ac));
        this.assertEqual ("78", objs (p));

        // Replace objects outside the current page, no change should be made to
        // the paginator.
        ac.replace (1, 9);
        this.assertEqual ("927856", objs (ac));
        this.assertEqual ("78", objs (p));
    });

    return tc;
};
