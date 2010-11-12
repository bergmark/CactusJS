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
 * A test contains a function (testPerformer) which performs various operations,
 * it then sets some form of trigger (like an htmlelement onclick, a timeout or
 * triggers directly) that calls resultProcessor which asserts that the test
 * succeeded.
 * testPerformer has to call processResults somehow, otherwise the test will
 * never finish.
 * You can pass arguments to processResults and it will be forwarded to
 * resultProcessor.
 *
 * Note that assertions cannot be made in the testPerformer since errors aren't
 * caught.
 *
 * Implementation notes:
 * Errors are thrown rather than more specific subclasses, this is done in order
 * to  make  debugging  easier  since  Firebug  for  Firefox doesn't show thrown
 * subclasses of Error.
 *
 * Example:
 * new Test (function () { // testPerformer
 *   var o = { a : 1 };
 *   document.body.onclick = this.processResults.bind (this, o);
 * }, function (o) { // resultProcessor
 *   this.assertEqual (1, o.a);
 * });
 */

Cactus.Dev.UnitTest.Test = (function () {
    var log = Cactus.Dev.log;
    var Assertion = Cactus.Dev.UnitTest.Assertion;
    var EventSubscription = Cactus.Util.EventSubscription;
    var JSON = Cactus.Util.JSON;

    /*
     * Fetches the name of a function by using toString. Ugly but necessary
     * since you can't count on the name property being set on functions.
     *
     * @param Function func
     * @return string
     *   The name of the function.
     */
    function getFunctionName (func) {
        return func.name ||
            func.toString().match (/\s(\S+)\s*?\(/i)[1];
    }
    /*
     * The testPerformer used if none is specified.
     *
     * @type Function
     */
    var defaultTestPerformer = function () {
        this.processResults();
    };

    function Test (testPerformer, resultProcessor) {
        this.testPerformer = testPerformer || defaultTestPerformer;
        this.resultProcessor = resultProcessor;
    } Test.prototype = {
        // Events
        /**
         * Triggered when all assertions have been run, or one has failed.
         */
        onTestFinish : Function.empty,

        /**
         * @type Function
         *   The function to run before each test, it needs to call
         *   `processResults()` to finish the test.
         */
        testPerformer : defaultTestPerformer,
        /**
         * @type Function
         */
        resultProcessor : null,
        /**
         * @type boolean
         */
        success : null,
        /**
         * @type string
         */
        message : null,
        /**
         * @type integer
         */
        assertions : 0,
        /**
         * @return boolean
         */
        getSuccess : function () {
            if (this.success === null) {
                throw new Error ("Test:getSuccess:"
                                 + "Tried to get value of success before test "
                                 + "was performed");
            }
            return this.success;
        },
        /**
         * Stores the last assertion made. This is to enable us to check if an
         * assertion failure was the cause of a thrown Error.
         *
         * @type Assertion
         */
        lastAssertion : null,
        /**
         * @return string
         */
        getMessage : function () {
            if (this.message === null) {
                throw new Error
                ("Tried to get value of message before test was performed");
            }
            return this.message;
        },
        /**
         * Checks if the test has run.
         *
         * @return boolean
         */
        testFinished : function () {
            return this.success !== null;
        },
        /**
         * return Integer
         */
        getAssertions : function () {
            return this.assertions;
        },
        /**
         * @return Function
         */
        getFunction : function () {
            return this.func;
        },
        /**
         * If lastAssertion failed, then it was the cause of the exception thrown
         * from assert().
         * This method does not throw an error if lastAssertion is null.
         *
         * @return boolean
         */
        lastAssertionFailed : function () {
            return this.lastAssertion && this.lastAssertion.failed();
        },
        /**
         * Starts running the test
         */
        run : function () {
            this.testPerformer();
        },
        _ranResultProcessor : false,
        /**
         * Tries to execute the result processor to check if the test passed.
         */
        processResults : function () {
            if (this._ranResultProcessor) {
                throw new Error("Test:processResults: "
                                + "processResults was called more than once.");
            }
            this._ranResultProcessor = true;
            try {
                this.resultProcessor.apply (this, arguments);
            } catch (e) {
                // The last assertion failed, so it was the cause of
                // the error.
                if (this.lastAssertionFailed()) {
                    this.message = this.lastAssertion.getMessage();
                    this.success = false;
                } else {
                    var lineNumber = (function () {
                        try {
                            return e.lineNumber;
                        } catch (e) {
                            return "N/A";
                        }
                    })();

                    this.message = "<pre>" +
                        "uncaught exception: " + e.constructor.name +
                        "\nmessage: " + e.message +
                        "\nfileName: " + e.fileName +
                        "\nlineNumber: " + lineNumber +
                        "</pre>";
                    this.success = false;
                }
            }
            if (!this.testFinished()) {
                this.success = true;
            }
            this.onTestFinish();
        },
        /**
         * Assert takes an expression and makes sure that it's true. Note that a
         * truthy value will cause the assertion to fail.
         *
         * @param boolean expression
         * @param optional string message
         *   An error message to save if the assertion fails.
         * @throws Error
         *   If the assertion fails (i.e. expression is not true)
         */
        assert : function (expression, message) {
            this.assertions++;
            message = message ? message + "<br> " : "";
            message += "expected: +true+, but got: +" + expression + "+";
            this.lastAssertion = new Assertion (expression === true,
                                                message);
            if (this.lastAssertion.failed()) {
                throw new Error ("Assertion failed ");
            }
        },
        /**
         * A negated version of assert.
         *
         * @param boolean expression
         * @param optional string message
         *   An error message to save if the assertion fails.
         * @throws Error
         *   If the assertion fails (i.e. expression is not false)
         */
        assertFalse : function (expression, message) {
            message = message ||
                "expected +false+, but got: +" + expression + "+";
            this.assert (expression === false, message);
        },
        /**
         * Asserts that two values are identical without type coercing.
         *
         * @param mixed expectedResult
         * @param mixed expression
         *   The value to compare to expectedResult
         */
        assertEquals : function (expectedResult, expression, message) {
            message = (message ? message + "<br> " : "") + "expected: +" + expectedResult + "+," +
                " but got: +" + expression + "+";
            this.assert (expectedResult === expression, message);
        },
        /**
         * Asserts that a given exception is thrown when executing the given
         * function.
         *
         * @param Error/RegExp expectedException
         *   Error: The constructor of the error expected, or a superclass
         *          constructor.
         *   RegExp: A RegExp supposed to match the message of the exception.
         * @param Function func
         *   The function to execute.
         * @param optional string message
         *   An error message to save if the assertion fails.
         */
        assertException : function (expectedException, func, message) {
            var returnValue = "*not available*";
            var exception = null;
            try {
                returnValue = func();
            } catch (err) {
                exception = err;
            }
            if (message === undefined) {
                if (exception === null) {
                    if (expectedException instanceof RegExp) {
                        message = "expected an exception matching " +
                            expectedException +
                            ", but no exception was thrown." +
                            "<br>Function return value: +" + returnValue + "+";
                    } else {
                        message = "expected to catch +" +
                            getFunctionName (expectedException)  + "+," +
                            " but no exception was thrown." +
                            "<br>Function return value: +" + returnValue + "+";
                    }
                } else {
                    if (expectedException instanceof RegExp) {
                        message = "expected an exception message matching " +
                            expectedException + ", but got: " +
                            exception.message;
                    } else {
                        message = "expected to catch +" +
                            expectedException.name +
                            "+, but caught +" +
                            exception.constructor.name + "+";
                    }
                }
            }
            var exceptionThrown = !!exception;
            // Match regexp =~ error message if regexp is specified, otherwise
            // check the instance of the exception.
            var condition;
            if (expectedException instanceof RegExp) {
                if (!exception) {
                    condition = false;
                } else {
                    condition = expectedException.test(exception.message);
                }
            } else {
                condition = exception instanceof expectedException;
            }
            this.assert(exceptionThrown && condition, message);
        },
        /**
         * @param Constructor/string type
         *   If a Constructor is passed it's asserted that the object is an
         *   instance of it. If a string, we check types with typeof.
         * @param mixed object
         *   The object whose type we want to assert.
         * @param optional string message
         *   An error message to save if the assertion fails.
         */
        assertInstance : function (type, object, message) {
            var actualType;
            if (object === null || object === undefined) {
                message = message ||
                    "expected an object of type +" + type.name +
                    "+, but got +" + object + "+";
                this.assert(false, message);
            }
            // If we're checking a type based on a string value, using typeof
            else if (typeof type === "string") {
                actualType = typeof object;
                message = message ||
                    "expected an object of type +" + type +
                    "+, but got one of type +" + actualType + "+";

                this.assert (actualType === type, message);
            } else {
                // otherwise we want to check if the object is an instance of
                // the type (constructor)
                message = message ||
                    "expected an object of type +" +
                    ((typeof type === "object" || typeof type === "function") ?
                     type.name : typeof type) +

                "+, but got one of type +" + object.constructor.name + "+";
                this.assert (object instanceof type, message);
            }
        },
        /**
         * Checks whether two value objects are equal using their equals method.
         *
         * @param Object a
         * @param Object b
         * @throws Error
         *   If the assertion fails.
         */
        assertEquality : function (a, b, message) {
            message = message || "Expected: " + a + ", but got: " + b;
            this.assert (a.equals(b), message);
        },
        /**
         * Compares two values using their JSON representation.
         *
         * @param mixed a
         * @param mixed b
         * throws Error
         *   If the assertion fails.
         */
        jsoneq : function (a, b, message) {
            this.assertEqual(JSON.stringify(a), JSON.stringify(b));
        }
    };
    /**
     * @alias assertEquals
     */
    Test.prototype.assertEqual = Test.prototype.assertEquals;

    EventSubscription.implement (Test);

    return Test;
})();
