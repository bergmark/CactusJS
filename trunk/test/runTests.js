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

(function () {
    var UT = Cactus.Dev.UnitTest;
    var TestCase = UT.TestCase;
    var TestSuite = UT.TestSuite;
    var UnitTestController = UT.UnitTestController;
    var Events = Cactus.DOM.Events;
    var loadJS = Cactus_setup.loadJS;
    var log = Cactus.Dev.log;

    var tests = [
        "Addon/Array",
        "Addon/Function",
        "Addon/Object",
        "Addon/Math",
        "Addon/String",
        "Dev/UnitTest/Test",
        "Dev/CustomLogger",
        "DOM/ClassNames",
        "DOM/Element",
        "DOM/Event",
        "DOM/EventManager",
        "DOM/Events",
        "DOM/Opacity",
        "DOM/tag",
        "DOM/select",
        "DOM/selectFirst",
        "DOM/formToHash",
        "MVC/Model/ArrayController",
        "MVC/Model/ArrayControllerDecorator",
        "MVC/Model/ActiveRecord",
        "MVC/Model/FilterDecorator",
        "MVC/Model/IdentityMap",
        "MVC/Model/PaginationDecorator",
        "MVC/Model/SortDecorator",
        "MVC/Model/ValueObject",
        "MVC/View/AbstractTemplate",
        "MVC/View/CompositeValidation",
        "MVC/View/TemplateHelpers/ValueTransformers",
        "MVC/View/Template",
        "MVC/View/ListTemplate",
        "MVC/View/PageViewer",
        "MVC/View/Validation",
        "MVC/View/Widget",
        "MVC/View/Wizard",
        "Remote/ConnectionProxy",
        "Remote/PersistanceManager",
        "Remote/YUIConn",
        "Util/Collection",
        "Util/Color",
        "Util/CountMap",
        "Util/EventIterator",
        "Util/EventPool",
        "Util/EventSubscription",
        "Util/generateComparator",
        "Util/JSON",
        "Util/KeyValueCoding",
        "Util/Money",
        "Util/Options",
        "Util/Range",
        "Util/Serializable",
        "Util/Set",
        "Util/StrictHash",
        "Util/StrictMap"
    ];

    // If GET parameters are specified, only those tests are run.
    if (location.search) {
        tests = location.search.substr (1).replace (/\./g, "/").split ("&");
    }

    // Load all unit test files.
    for (var i = 0; i < tests.length; i++) {
        var file = tests [i];
        var split = file.split ("/");
        var utFile = "UnitTest/" +
            split.slice (0, split.length - 1).join ("/") +
            "/UT-" + split.slice (split.length - 1);
        loadJS (file, utFile);
    }

    // Add all testcases to the testSuite.
    function recursiveAddTS (testSuite, object) {
        var test;
        for (var i = 0; i < tests.length; i++) {
            test = tests[i];

            var utPath = "Cactus.UnitTest." + test.replace(/\//g, ".");
            var testFunc = eval(utPath);
            if (!testFunc) {
                throw new Error("Missing UT path for: %s".format(utPath));
            }
            var testCases = testFunc();
            if (testCases instanceof TestCase) {
                testSuite.addTestCase (testCases);
            } else {
                if (testCases.length === 0) {
                    throw new Error("An empty collection of testcases for "
                                    + utPath);
                }
                for (var p in testCases) if (testCases.hasOwnProperty (p)) {
                    testSuite.addTestCase (testCases [p]);
                }
            }
        }
    }

    Events.add (window, "load", function () {
        var ts = new TestSuite();
        recursiveAddTS (ts, Cactus.UnitTest);
        var controller = new UnitTestController (ts);
        controller.runTests();
    });
})();
