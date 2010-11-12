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

Cactus.UnitTest.Remote.ConnectionProxy = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var Remote = Cactus.Remote;
    var Connection = Remote.Connection;
    var ConnectionProxy = Remote.ConnectionProxy;
    var log  = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;

    var tc = new UT.TestCase ("Remote.ConnectionProxy");
    tc.addTest (function () {
        var cp = new Remote.ConnectionProxy();

        // State should be NewConnection by default.
        this.assertInstance (Remote.NewConnection, cp.currentState);

        // State should be reset to a new object on reset.
        var state = cp.currentState;
        cp.reset();
        this.assertFalse (state === cp.currentState,
                          "state === cp.currentState");
    });

    // Test getNextState.
    tc.addTest (function () {
        var cp = new ConnectionProxy();

        this.assertInstance (Remote.NewConnection, cp.currentState);
        cp.currentState.readyState = Remote.Connection.STATE.LOADING;
        cp.onReadyStateChangedTriggered (cp.currentState);
        this.assertInstance (Remote.ActiveConnection, cp.currentState);
        cp.currentState.readyState = Remote.Connection.STATE.COMPLETE;
        cp.onReadyStateChangedTriggered (cp.currentState);
        this.assertInstance (Remote.ClosedConnection, cp.currentState);
        cp.onReadyStateChangedTriggered (cp.currentState);
        this.assertInstance (Remote.ClosedConnection, cp.currentState);
    });

    // Request a text file.
    tc.addTest (new Test (function () {
        var test = this;
        var cp = new ConnectionProxy();
        cp.subscribe("Complete", function (object) {
            test.processResults (cp);
        });
        cp.request ("testfiles/text.txt");
    }, function (cp) {
        this.assertEqual (Connection.STATE.COMPLETE, cp.getReadyState());
        this.assert (/TEXT/.test (cp.getResponseText()),
                     "responseText was incorrect: " + cp.getResponseText());
        this.assertEqual (200, cp.getStatus());
    }));


    // Make sure that events are sent out for all states of the
    // connection, even if some of them aren't explicitly passed by
    // the XHR object.
    tc.addTest (new Test (function () {
        var test = this;
        var cp = new ConnectionProxy();
        var readyStateCallbacks = [];
        cp.subscribe("StateChange", function (object) {
            readyStateCallbacks.push(object.getState());

        });
        cp.subscribe("Complete", function (object) {
            test.processResults(cp, readyStateCallbacks);
        });
        cp.request("testfiles/text.txt");
    }, function (cp, readyStateCallbacks) {
        this.assertEqual("active,closed", readyStateCallbacks.join(","));
    }));

    // Try setting a few request headers.
    tc.addTest (new Test (function () {
                var test = this;
        var cp = new ConnectionProxy();
        cp.subscribe("Complete", function (object) {
            test.processResults();
        });
        cp.setRequestHeader ("X-Test", "Foo");
        cp.setRequestHeader ("X-Test-2", "Bar");
        cp.request ("testfiles/text.txt");
    }, function () {
        this.assert (true);
    }));

    // Request without setting a oncomplete callback.
    tc.addTest (function () {
        var cp = new ConnectionProxy();
        cp.request ("testfiles/text.txt");
        this.assert (true);
    });

    // Try resetting the connection.
    (function () {
        var cp = new ConnectionProxy();
        var subscriber;

        tc.addTest(new Test(function () {
            subscriber = cp.subscribe("Complete",
                                      this.processResults.bind(this));
            cp.request("testfiles/text.txt");
        }, function () {
            cp.reset();
            cp.removeSubscriber(subscriber, "Complete");
        }));
    })();

    // Should send out onTimeout.
    // This test cannot be run without a server that can sleep the request until
    // the timeout triggers. Seems to work though.
    /*
    tc.addTest(new Test(function () {
        var cp = new ConnectionProxy();
        cp.subscribe("complete", this.processResults.bind(this),
                         "Complete",
                         true);
        cp.subscribe("timeout", this.processResults.bind(this),
                         "Timeout",
                         true);
        cp.setTimeoutLimit(5);
        cp.request("testFiles/text.txt");
    }, function (event) {
        switch (event) {
        case "complete":
            this.assert(false, "The request didn't time out.");
            break;
        case "timeout":
            this.assert(true);
            break;
        default:
            this.assert(false, "Unreachable code.");
            break;
        }
    }));
    */

    return tc;
};
