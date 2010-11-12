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
 * A testsuite holds an arbitrary amount of testcases that it can execute.
 * After or during execution, data can be retrieved from the suite in order to
 * display it.
 */
Cactus.Dev.UnitTest.TestSuite = (function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var EventIterator = Cactus.Util.EventIterator;
    var EventSubscription  = Cactus.Util.EventSubscription;

    function TestSuite () {
        this.testCases = [];
    } TestSuite.prototype = {
        // Events
        /**
         * Triggered when all testcases have finished running.
         */
        onFinish : Function.empty,
        /**
         * @param TestCase testCase
         */
        onBeforeTestCaseStart : Function.empty,
        /**
         * @param TestCase testCase
         */
        onTestCaseFinished : Function.empty,

        /**
          * @type Array
          *   All testcases used in the suite.
          */
        testCases : [],
        /**
         * Adds a testcase to the suite.
         *
         * @param TestCase testCase
         */
        addTestCase : function (testCase) {
            this.testCases.push (testCase);
        },
        /**
         * Accessor for testCases, clones testCases before returning.
         *
         * @return Array
         *   A shallow copy of the collection of test cases.
         */
        getTestCases : function () {
            return Array.clone (this.testCases);
        },
        /**
         * Runs every attached test case.
         */
        run : function () {
            var ei = new EventIterator (this.testCases, "run", "Finish");
            // Call onfinish for the suite when all testcases have been iterated
            // through.
            ei.subscribe("Finish", function (ei) {
                this.onFinish(this);
            }.bind(this), true);
            // Call onTestCaseStarted before the EI processes an item.
            ei.subscribe("BeforeItemProcess", function (ei) {
                this.onBeforeTestCaseStart(ei.getCurrentItem());
            }.bind(this));
            // Call onTestCaseFinished after each item the EI processes.
            ei.subscribe("ItemProcessed", function (ei) {
                this.onTestCaseFinished(ei.getCurrentItem());
            }.bind(this));
            ei.startForward();
        }
    };
    EventSubscription.implement (TestSuite);

    return TestSuite;
})();
