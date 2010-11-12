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

/**
 * @file
 *
 * Uses document.write to load JS files into the browser. This is only so that
 * Cactus can be tested without a server side language in the background.
 */
var Cactus_setup = (function () {
    CACTUS_ROOT = window.CACTUS_ROOT || "../trunk/";

    var loadJS = (function () {
        var loadedFiles = [];
        function hasValue (array, value) {
            for (var i = 0; i < array.length; i++) {
                if (array [i] === value) {
                    return true;
                }
            }
            return false;
        }

        return function (file1) {
            var root = window.CACTUS_ROOT || "";
            for (var i = 0; i < arguments.length; i++) {
                    /^(.+?)(?:\.js)?$/i.test(arguments [i]);
                var fileName = RegExp.$1;
                var URL = root +
                    fileName +
                    ".js";
                if (!hasValue (loadedFiles, URL)) {
                    document.write ('<script type="text/javascript" src="' +
                                    URL + '"></script>\n');
                    loadedFiles.push (URL);
                }
            }
        }
    })();

    function loadJSFrom (NSPath, file1) {
        for (var i = 1; i < arguments.length; i++) {
            loadJS (NSPath + arguments [i]);
        }
    }

    loadJS ("Base",
            "Addon/Function",
            "Addon/Object",
            "Addon/Math",
            "Addon/Array",
            "Util/Browser",
            "Dev/CustomLogger",
            "Dev/log",
            "Util/Range",
            "Util/Money",
            "DOM/Event",
            "DOM/Events",
            "Util/Collection",
            "Util/EventSubscription",
            "DOM/EventManager",
            "Util/Set",
            "Util/EventPool",
            "DOM/Opacity",
            "DOM/tag",
            "Util/JSON",
            "Util/Serializable",
            "Util/Color",
            "Util/StrictMap",
            "Util/StrictHash",
            "Util/Options"
           );

    loadJSFrom ("Dev/UnitTest/",
                "UnitTestController",
                "Assertion");

    loadJSFrom ("Util/",
                "EventIterator");

    loadJSFrom ("Dev/UnitTest/",
                "Test",
                "TestCase",
                "TestSuite");

    loadJS ("DOM/Ready");

    loadJS ("Addon/String");
    loadJS ("Util/KeyValueCoding",
            "Util/generateComparator");

    loadJSFrom("Remote/",
               "YUIConn");

    loadJSFrom ("MVC/Model/",
                "IdentityMap",
                "ValueObject",
                "ArrayController",
                "ActiveRecord",
                "ArrayControllerDecorator",
                "PaginationDecorator",
                "SortDecorator",
                "FilterDecorator");

    loadJSFrom("Remote/",
               "PersistanceManager"); // Depends on ActiveRecord.


    loadJSFrom("DOM/",
               "ClassNames",
               "select",
               "selectFirst",
               "Element",
               "formToHash");

    loadJSFrom("MVC/View/TemplateHelpers/",
               "ValueTransformers");
    loadJSFrom("MVC/View/",
               "AbstractTemplate",
               "Widget",
               "Template",
               "ListTemplate",
               "PageViewer",
               "Wizard");

    loadJSFrom ("Remote/",
                "Connection",
                "NewConnection",
                "ActiveConnection",
                "ClosedConnection",
                "ConnectionProxy");

    loadJSFrom("MVC/View/",
               "Validation",
               "CompositeValidation");

    return {
        loadJS : loadJS
    };
})();
