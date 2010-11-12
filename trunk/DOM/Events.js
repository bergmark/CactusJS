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
 * Provides a wrapper for cross browser event handling. attachEvent and
 * addEventListener are not used. It also tries to avoid IE DOM memory leaks.
 *
 * You should not explicitly instantiate Events, just call Events.add and it
 * will do the job for you.
 *
 * Example usage:
 * // Create event
 * var eventID = Events.add (element, "click", myFunc);
 * // Remove event
 * Events.del (element, "click", eventID);
 *
 */
Cactus.DOM.Events = (function () {
    var Browser = Cactus.Util.Browser;
    var log = Cactus.Dev.log;

    function Events(o) {
        this.element = o;
        this.events = {};
        // Add access to the  Events object from element. This two-way
        // dependency is  necessary since HTMLElement  isn't native in
        // IE.
        this.element.events = this;
    }
    /**
     * Adds an event to a HTMLElement.
     *
     * @param HTMLElement o
     *   The element to enable the event handling on.
     * @param string eventName
     *   The type of event without the "on" prefix. e.g. "click" or "mouseover".
     * @param Function callback
     *   The function to call when the event triggers.
     * @return ID
     *   The ID of the event, can be used to delete events with del.
     */
    Events.add = function (element, eventName, callback) {
        // Throw an error  if o is falsy, this is  such a common error
        // that it's calls for an exception.
        if (!element) {
            throw new Error(("Called Events.add \"%s\" "+
                             "with a non-existant element.").format(eventName));
        }
        // Throw an error if arg is an array.
        if (element instanceof Array) {
            throw new Error(
                "Called Events.add with an array as the element argument");
        }
        if (!(callback instanceof Function)) {
            throw new Error(
               "Called Events.add without a function as the callback argument");
        }

        if (!element.events) {
            new Events(element);
        } else if (element.events.getElement() !== element) {
            // When cloneNode is used, the events attribute of the HTML Element
            // referencing the Events object might be cloned (the Events object
            // itself seems to never be cloned) so we need to make sure that
            // the Events instance's element matches the current one.
            //
            // Problem present:
            // | FF2 | FF3 | OP9.5 | SF3 | IE6 | IE7 |
            // | N   | N   | N     | N   | Y   | Y   |
            element.events = null;
            new Events(element);
        }

        // Only create the events object if it doesn't already exist.
        return element.events.add(eventName, callback);
    };
    /**
     * Removes a previously added event.
     *
     * @param HTMLElement o
     *   The element to remove the event from.
     * @param string eventName
     *   The event type of the event.
     * @param ID eventID
     *   The ID of the event to remove.
     * @throws Error
     *   If the event doesn't exist on the element.
     */
    Events.del = function (o, eventName, eventID) {
        if (!o.events) {
            throw new Error ("Element does not have any registered events.");
        }

        o.events.del (eventName, eventID);
    };
    /**
     * @type Array
     *   All event Arrays are also pushed onto this Array if the browser is
     *   IE <= 6. It's used so that we can delete all events manually onunload
     *   to prevent IE's memory leak.
     */
    Events._eventCollections = [];

    Events.prototype = {
        /**
         * @type HTMLElement
         *   Shortcut to the associated HTMLElement so that we can access it
         *   easily. (this === this.element.events)
         */
        element : null,
        /**
         * @return HTMLElement
         */
        getElement : function () {
            return this.element
        },
        /**
         * @type Hash
         *   Contains all the different kinds of events attached to this
         *   element.
         */
        events : null,
        /**
         * Adds an event to the associated HTMLElement.
         *
         * @param String ev
         *   The type of event to add. Examples: "click", "mouseover", "load".
         * @param Function f
         *   A function to execute when the event triggers.
         * @return ID
         *   A read only identification for the event that can be used with del
         *   to remove it.
         */
        add : function (ev, f) {
            // "click" => "onclick"
            var eventName = "on" + ev;

            // If 3rd party set the property it should be added as a regular event later.
            var previousEvent = this.element[eventName] && !(eventName in this.events) ? this.element[eventName] : null;

            // If no event of this type was defined previously.
            if (!this.events[eventName]) {
                // Create an empty array to store the events.
                this.events[eventName] = [];
                if (Browser.hasDOMMemoryLeaks) {
                    Events._eventCollections.push(this.events[eventName]);
                }
                // Set the event handler so it can execute the events added.
                this.element[eventName] = this._chainExecute.bind(this, this.events[eventName]);
            }
            
            if (previousEvent) {
                this.add(ev, previousEvent);
            }

            // Create an ID (corresponds to the index in the array).
            var id = this.events [eventName].length;
            this.events [eventName][id] = f;

            return id;
        },
        /**
         * Removes an event from the specified event collection.
         *
         * @param string eventName
         *   The type of event, such as "mouseover".
         * @param ID id
         *   The ID of the event to remove.
         */
        del : function (eventName, id) {
            if (!(id in this.events ["on" + eventName])) {
                throw new Error ("Events: " + this.element + ", " +
                                 eventName + " does not have a registered event with id = " + id);
            }
            delete this.events ["on" + eventName][id];
        },
        /**
         * @param Function[] events
         *   Functions to execute.
         * @param event e
         *   The events object.
         * @return boolean
         *   False if any of the event functions returned false signaling that
         *   the upcoming event processing should halt.
         */
        _chainExecute : function (events, e) {
            // If false  is returned from any function  the main event
            // will also return false.
            var returnValue = true;
            // Loop through each event function and call them.
            for (var p in events) {
                if (events [p].call (this.element, e) === false) {
                    returnValue = false;
                }
            }
            return returnValue;
        }
    };
    // Prevent, or at least minimize the effects of IE <= 6's memory leak by
    // looping through all attached events window.onunload and deleting them.
    if (Browser.hasDOMMemoryLeaks) {
        Events.add (window, 'unload', function () {
            for (var i = 0, evColl; evColl = Events._eventCollections [i]; i++) {
                for (var p in evColl) {
                    delete evColl [p];
                }
            }
        });
    }
    return Events;
})();
