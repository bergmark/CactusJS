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
 * The Connection Proxy is a substitution proxy, a mix between the GoF patterns
 * Proxy and State.
 * (http://www.edea.se/?q=article/state_and_proxy)
 * It Uses the other classes NewConnection, ActiveConnection and
 * ClosedConnection to distribute behavior of an XHR request depending on the
 * connection state.
 *
 * This is the only public class in the Remote package ATM.
 *
 * Example usage:
 * var cp = new ConnectionProxy();
 * cp.subscribe("Complete", this); // EventSubscription.
 * cp.request("foo.txt", "POST");
 */
Cactus.Remote.ConnectionProxy = (function () {
    var NewConnection = Cactus.Remote.NewConnection;
    var Connection = Cactus.Remote.Connection;
    var ActiveConnection = Cactus.Remote.ActiveConnection;
    var ClosedConnection = Cactus.Remote.ClosedConnection;
    var log = Cactus.Dev.log;
    var EventSubscription = Cactus.Util.EventSubscription;

    function ConnectionProxy () {
        this._initialize();
    } ConnectionProxy.prototype = {
        // Events.
        /**
         * Fires when the underlying XHR object changes state to completed.
         */
        onComplete : Function.empty,
        /**
         * Fires when the state of the connection changes.
         */
        onStateChange : Function.empty,
        /**
         * Fires if the request hasn't completed after a specified amount of
         * time.
         */
        onTimeout : Function.empty,

        /**
         * @type integer
         *   The amount of time in milliseconds before the request is considered
         *   "timed out" and onTimeout is called.
         */
        timeoutLimit : 10000,
        /**
         * @type ID
         *   A reference to the timeout process of a request.
         */
        timeout : null,

        setTimeoutLimit : function (timeoutLimit) {
            this.timeoutLimit = timeoutLimit;
        },
        /**
         * Creates a new connection object
         */
        _initialize : function () {
            this._setState (new NewConnection());
        },
        /**
         * Resets a connection so that a new request can be sent with the same
         * proxy object.
         */
        reset : function () {
            this.abort();
            this._initialize();
        },
        /**
         * Changes the state object of the connection by attaching listeners to
         * the new state.
         *
         * @param Connection newState
         */
        _setState : function (newState) {
            if (this.currentState &&
                this.currentState.hasSubscriber (this,
                                                 "ReadyStateChanged")) {
                this.currentState.removeSubscriber (this, "ReadyStateChanged");
            }
            this.currentState = newState;
            if (!(this.currentState instanceof ClosedConnection)) {
                this.currentState.subscribe("ReadyStateChanged", this);
            }
        },
        /**
         * Triggered when the underlying XHR object sends out
         * onreadystatechange.
         */
        onReadyStateChangedTriggered : function (object) {
            var newState;
            switch (object.getReadyState()) {
            case Connection.STATE.LOADING:
            case Connection.STATE.LOADED:
            case Connection.STATE.INTERACTIVE:
                if (!(object instanceof ActiveConnection)) {
                    newState = new ActiveConnection (object.connection);
                }
                break;
            case Connection.STATE.COMPLETE:
                newState = new ClosedConnection (object.connection);
                break;
            }

            if (!newState) return;

            if (newState) {
                this._setState (newState);
            }
            this.onStateChange();
            if (this.getReadyState() == Connection.STATE.COMPLETE) {
                clearTimeout(this.timeout);
                this.onComplete();
            }
        },
        /**
         * Returns the state of the connection.
         *
         * @return string
         */
        getState : function () {
            if (this.currentState instanceof NewConnection) {
                return "new";
            }
            if (this.currentState instanceof ActiveConnection) {
                return "active";
            }
            if (this.currentState instanceof ClosedConnection) {
                return "closed";
            }
        },
        /**
         * Callback for when a request times out.
         */
        _timedOut : function () {
            this.abort();
            clearTimeout(this.timeout);
            this.timeout = null;
            this.onTimeout();
        },

        // Delegated methods.

        abort : function () {
            clearTimeout(this.timeout);
            this.currentState.abort();
        },
        request : function (URL, method, body) {
            this.timeout = setTimeout(this._timedOut.bind(this),
                                      this.timeoutLimit);
            this.currentState.request (URL, method, body);
        },
        getResponseText : function () {
            return this.currentState.getResponseText();
        },
        getResponseXML : function () {
            return this.currentState.getResponseXML();
        },
        getStatus : function () {
            return this.currentState.getStatus();
        },
        getStatusText : function () {
            return this.currentState.getStatusText();
        },
        getReadyState : function () {
            return this.currentState.getReadyState();
        },
        setRequestHeader : function (header, value) {
            return this.currentState.setRequestHeader (header, value);
        }
    };

    EventSubscription.implement (ConnectionProxy);

    return ConnectionProxy;
})();
