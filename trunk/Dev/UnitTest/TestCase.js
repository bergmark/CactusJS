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
 * A TestCase instance contains an arbitrary amount of tests.
 * Setup and teardown methods are available through this class, to utilize them,
 * the class is first instantiated followed by either or both instance methods
 * being overridden. Setup is called before each Test, and teardown after each.
 *
 * TestCase uses EventIterator in order to wait for asynchronous tests to
 * finish. This allows tests that wait for user input (should rarely be used)
 * and remote calls. It needs to be used when objects pass out events to tell
 * that theyre finished.
 */
Cactus.Dev.UnitTest.TestCase = (function () {
    var Test = Cactus.Dev.UnitTest.Test;
    var EventSubscription = Cactus.Util.EventSubscription;
    var EventIterator = Cactus.Util.EventIterator;
    var log = Cactus.Dev.log;

    /**
     * @param string name  The name of the testcase, used to identify which
     *                     testcases failed
     */
    function TestCase (name) {
        this.name      = name || "";
        this.tests     = [];
    } TestCase.prototype = {
        // Events
        /**
         * Triggered when all tests have finished running
         */
        onFinish : Function.empty,

        /**
         * Called before every Test. This function is called in the scope of
         * that test. An empty function is provided by default to clean up the
         * code. Use it to set up data that is needed for all or several tests.
         * If only one test uses the data, it should probably be defined inside
         * that particular test function instead.
         *
         * @type Function
         */
        setup : Function.empty,
        /**
         * Called after every Test. This function is called in the scope of that
         * test. An empty function is provided by default tr clean up the code.
         * Use it to remove or reset data after a test is run.
         *
         * @type Function
         */
        teardown : Function.empty,
        /**
         * @type integer
         */
        assertions : 0,
        /**
         * @return integer
         */
        getAssertions : function () {
            return this.assertions;
        },
        /**
         * @type string
         */
        name : "",
        /**
         * @return string
         */
        getName : function () {
            return this.name;
        },
        /**
         * @type boolean
         */
        success : null,
        /**
         * @throws Error  if called before the tests have finished
         * @return boolean
         */
        getSuccess : function () {
            if (this.success === null) {
                throw new Error ("Called getSuccess before testCase ran");
            }
            return this.success;
        },
        /**
         * Whether all tests have finished running
         *
         * @return boolean
         */
        isFinished : function () {
            return this.success !== null;
        },
        /**
         * @type Array  Contains all tests added to the testcase.
         */
        tests : [],
        /**
         * Add a test to the testcase. The method instatiates Test with the
         * function provided. If more than one test is to be added, it might be
         * easier to use addTests().
         *
         * @param Test/Function test
         *   The test do add, if a function is provided it's transformed into a Test.
         */
        add : function (test) {
            if (test instanceof Function) {
                this.tests.push (new Test (null, test));
            } else {
                this.tests.push (test);
            }
        },
        /**
         * Calls this.add() for every argument. Syntactic sugar for adding
         * several tests at once.
         *
         * @param Test *tests
         */
        addTests : function () {
            for (var i = 0; i < arguments.length; i++) {
                this.add (arguments [i]);
            }
        },
        /**
         * Accessor for tests. Copies the array to avoid breaking encapsulation.
         *  But the tests are NOT copied.
         *
         * @return Array  a shallow copy of the tests collection
         */
        getTests : function () {
            return Array.clone (this.tests);
        },
        /**
         * Executes all tests in an arbitrary order. Setup is called
         * before a test is executed, and teardown afterwards.
         */
        run : function () {
            var ei = new EventIterator (this.tests, "run", "TestFinish");
            ei.subscribe("Finish", this);
            ei.setBeforeProcessing(this.setup);
            ei.setAfterProcessing(this.teardown);
            ei.startForward();
        },
        onFinishTriggered : function (ei) {
            for (var i = 0; i < this.tests.length; i++) {
                this.assertions += this.tests [i].getAssertions();
                if (!this.tests [i].getSuccess()) {
                    this.success = false;
                }
            }
            if (this.success === null) {
                this.success = true;
            }

            ei.removeSubscriber (this, "Finish");
            this.onFinish();
        }
    };

    TestCase.prototype.addTest = TestCase.prototype.add;

    EventSubscription.implement (TestCase);

    return TestCase;
})();
