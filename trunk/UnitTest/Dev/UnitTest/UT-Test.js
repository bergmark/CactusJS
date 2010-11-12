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

Cactus.UnitTest.Dev.UnitTest.Test = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var log = Cactus.Dev.log;

    var tc = new TestCase ("Dev.UnitTest.Test");

    // assertException, passing an Error constructor as the argument.
    tc.addTest(function () {
        var t;

        t = new Test(null, function () {
            this.assertException(Error, function () {
                throw new Error("foo");
            });
        });
        t.run();
        this.assert(t.testFinished(), "Test did not finish.");
        this.assert(t.getSuccess(), "Test did not succeed.");

        t = new Test(null, function () {
            this.assertException(Error, Function.empty);
        });
        t.run();
        this.assert(t.testFinished(), "Test did not finish.");
        this.assertFalse(t.getSuccess(), "Test succeeded.");
    });

    // assertException should be able to take a regex to match the error message
    // as its first argument, instead of an Error constructor.
    tc.addTest(function () {
        var t;

        t = new Test(null, function () {
            this.assertException(/bar/, function () {
                throw new Error("foobarbaz");
            });
        });
        t.run();
        this.assert(t.testFinished(), "Test did not finish.");
        this.assert(t.getSuccess(), "Test failed.");

        t = new Test(null, function () {
            this.assertException(/qux/, function () {
                throw new Error("foobarbaz");
            });
        });
        t.run();
        this.assert(t.testFinished(), "Test did not finish.");
        this.assertFalse(t.getSuccess(), "Test succeeded.");

        // If no exception is thrown when a regex is supplied, the assertion
        // should fail with a descriptive message.
        t = new Test(null, function () {
            this.assertException(/foo/, Function.empty);
        });
        t.run();
        this.assert(t.testFinished(), "Test did not finish.");
        this.assertFalse(t.getSuccess());
        this.assert(/no exception/i.test(t.getMessage()));
    });

    // assertInstance.
    tc.addTest(function () {
        var t;

        t = new Test (null, function () {
            this.assertInstance (Array, []);
        });
        t.run();
        this.assert (t.testFinished(), "Test did not finish.");
        this.assert (t.getSuccess(), "[] instanceof Array assertion failed.");

        t = new Test (null, function () {
            this.assertInstance (Array, null);
        });
        t.run();
        this.assert (t.testFinished());
        this.assertFalse (t.getSuccess(), "null instanceof Array suceeded.");

        t = new Test (null, function () {
            this.assertInstance (null, []);
        });
        t.run();
        this.assert (t.testFinished());
        this.assertFalse (t.getSuccess(), "[] instanceof null suceeded.");
    });

    tc.addTest(function () {
        var t = new Test(null, function () {
            this.jsoneq([1, 2, 3], [1, 2, 3]);
        });
        t.run();
        this.assert(t.getSuccess(), "Test was not successful.");

        var t = new Test(null, function () {
            this.jsoneq(1, "1");
        });
        t.run();
        this.assertFalse(t.getSuccess(), "Test was successful.");
    });

    return tc;
};
