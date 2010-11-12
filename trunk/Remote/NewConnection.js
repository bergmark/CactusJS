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
 * Handles a new connection, where a request haven't been sent yet.
 * Is the start state of the State pattern implementation.
 */
Cactus.Remote.NewConnection = (function () {
    var ActiveConnection = Cactus.Remote.ActiveConnection;
    var Connection = Cactus.Remote.Connection;
    var log = Cactus.Dev.log;

    function NewConnection () {
        this._createConnectionObject();
    } NewConnection.prototype = {
        /**
         * Create a new XHR object to work with.
         */
        _createConnectionObject : function () {
            this.connection = null;
            if (window.XMLHttpRequest) {
                this.connection = new XMLHttpRequest();
            } else {

                // Using newer versions prevents a few bugs from appearing.
                var IE_XHR_VERSIONS = [
                    "MSXML2.XMLHTTP.6.0",
                    "MSXML2.XMLHTTP.3.0",
                    "Microsoft.XMLHTTP"
                ];
                for (var i = 0; i < IE_XHR_VERSIONS.length; i++) {
                    try {
                        this.connection = new ActiveXObject(IE_XHR_VERSIONS[i]);
                        break;
                    } catch (e) {
                        // .
                    }
                }
            }
            if (!this.connection) {
                throw new Error ("Could not initialize XMLHttpRequest object");
            }
        },
        /**
         * Adds a header to be sent along with the request.
         *
         * @param string header
         * @param string value
         */
        setRequestHeader : function (header, value) {
            if (Object.isEmpty (this.requestHeaders)) {
                this.requestHeaders = {};
            }
            this.requestHeaders [header] = value;
        },
        /**
         * Sends an asynchronous request to the server.
         *
         * @param string URL
         *   The complete URL to request.
         * @param optional string method = "GET"
         *   A HTTP method, GET/PUT/POST/DELETE.
         * @param optional string body = null
         *   The HTTP request body.
         */
        request : function (URL, method, body) {
            if (!method) {
                method = "GET";
            }
            if (!body) {
                body = null;
            }
            var asynchronous = true;

            this.connection.open (method, URL, asynchronous);
            if (method === "POST") {
                this.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                this.setRequestHeader("Content-length", body.length);
                this.setRequestHeader("Connection", "close");
            }
            for (var header in this.requestHeaders) if (this.requestHeaders.hasOwnProperty (header)) {
                var value = this.requestHeaders [header];
                this.connection.setRequestHeader (header, value);
            }
            this.connection.onreadystatechange = this.readyStateChanged.bind (this);
            this.connection.send (body);
        },
        /**
         * @return ActiveConnection
         *   The next state of the connection.
         */
        getNextState : function () {
            return new ActiveConnection (this.connection);
        },
        getResponseText : function () {
            throw new Error ("Can't get responseText before request has been sent");
        },
        getResponseXML : function () {
            throw new Error ("Can't get responseXML before request has been sent");
        },
        getStatus : function () {
            throw new Error ("Can't get status before request has been sent");
        },
        getStatusText : function () {
            throw new Error ("Can't get statusText before request has been sent");
        },
        abort : function () {
            // .
        }
    };
    NewConnection.extend (Connection);

    return NewConnection;
})();
