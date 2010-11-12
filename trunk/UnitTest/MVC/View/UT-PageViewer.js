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

Cactus.UnitTest.MVC.View.PageViewer = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Paginator = Cactus.MVC.Model.PaginationDecorator;
    var PageViewer = Cactus.MVC.View.PageViewer;
    var tag = Cactus.DOM.tag;
    var $ = Cactus.DOM.select;
    var Element = Cactus.DOM.Element;
    var ClassNames = Cactus.DOM.ClassNames;

    var tc = new TestCase ("MVC.View.PageViewer");

    tc.setup = function () {
        this.paginator = new Paginator (["a", "b", "c", "d"], 2, 0);
        this.ol = tag ("ol");
        this.pageViewer = new PageViewer (this.paginator, this.ol);
    };

    tc.addTest (function () {
        var paginator = this.paginator;
        var ol = this.ol;
        var pageViewer = this.pageViewer;

        this.assertEqual(2, ol.childNodes.length);
        this.assertEqual("a", $("li", ol)[0].firstChild.tagName.toLowerCase());
        this.assertEqual("1", Element.getValue($("li a", ol)[0]).text);
        this.assertEqual("2", Element.getValue($("li a", ol)[1]).text);

        $("li", ol)[1].onclick();
        this.assertEqual(1, paginator.getPage());

        $("li", ol)[0].onclick();
        this.assertEqual(0, paginator.getPage());
    });

    // Class names.
    tc.addTest (function () {
        var paginator = this.paginator;
        var ol = this.ol;
        var pageViewer = this.pageViewer;

        this.assertEqual(0, paginator.getPage());
        this.assert(ClassNames.has ($("li", ol)[0], "active"),
                    "Active class name not set.");
        this.assertFalse(ClassNames.has ($("li", ol)[1], "active"),
                         "Inactive class has active class name.");

        $("li", ol)[1].onclick();
        this.assertEqual(1, paginator.getPage());
        this.assertFalse(ClassNames.has ($("li", ol)[0], "active"),
                         "Active class name not removed on page change.");
        this.assert(ClassNames.has ($("li", ol)[1], "active"));
    });

    // Events: onPageChanged.
    tc.addTest (function () {
        var paginator = this.paginator;
        var ol = this.ol;
        var pageViewer = this.pageViewer;

        paginator.setPage (1);
        this.assert (ClassNames.has ($("li", ol)[1], "active"),
                     "active class name not set onPageChanged");
        this.assertFalse (ClassNames.has ($("li", ol)[0], "active"),
                          "active class name not removed onPageChanged");
    });

    // Events: onPageCountUpdated.
    tc.addTest (function () {
        var paginator = this.paginator;
        var ol = this.ol;
        var pageViewer = this.pageViewer;

        this.assertEqual (2, $("li", ol).length);

        // Add a page.
        paginator.add ("e");

        this.assertEqual (3, $("li", ol).length);
        this.assertEqual ("3", Element.getValue($("li a", ol)[2]).text);

        // Remove a page.
        paginator.remove ("b");

        this.assertEqual (2, $("li", ol).length);
        this.assertEqual ("1", Element.getValue($("li a", ol)[0]).text);
        this.assertEqual ("2", Element.getValue($("li a", ol)[1]).text);
    });

    return [tc];
};
