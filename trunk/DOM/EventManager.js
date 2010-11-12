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

/**
 * @file
 *
 * Keeps track of events added to objects and allows the client to detach all
 * of them. Useful when a module subscribes to a lot of events and needs to
 * free any references.
 *
 * EventManager supports both the Util.EventSubscription and DOM.Events
 * interfaces. They may be mixed in the same instance.
 *
 * Instantiate the EventManager and then add objects using
 * `eventManager.add(object, eventName, callback)` and remove all of them with
 * `eventManager.detach()`. After a detach, the EventManager instance is back
 * at no subscriptions and may be used like it was new.
 */
Cactus.DOM.EventManager = (function () {
    var log = Cactus.Dev.log;
    var Events = Cactus.DOM.Events;
    var EventSubscription = Cactus.Util.EventSubscription;

    /**
     * Stores information about a single added event.
     *
     * @param EventSubscription/HTMLElement object
     *   The object the event was added to.
     * @param string eventName
     *   The name of the event, such as "click".
     */
    function Subscription(object, eventName) {
        this.object = object;
        this.eventName = eventName;
    } Subscription.prototype = {
        /**
         * @type ID
         */
        id : null,
        /**
         * @type EventSubscription/HTMLElement
         */
        object : null,
        /**
         * @type string
         */
        eventName : "",
        /**
         * @return ID
         */
        getId : function () {
            return this.id;
        },
        /**
         * @return HTMLElement
         */
        getObject : function () {
            return this.object;
        },
        /**
         * @return string
         */
        getEventName : function () {
            return this.eventName;
        },
        /**
         * @override
         */
        remove : function () {
            // .
        }
    };
    Subscription.create = function (object, eventName, callback) {
        if (EventSubscription.implementsInterface(object)) {
            return new ESSubscription(object, eventName, callback);
        } else {
            return new EventsSubscription(object, eventName, callback);
        }
    };

    function ESSubscription(object, eventName, callback) {
        Subscription.apply(this, arguments);
        this.id = object.subscribe(eventName, callback);

    } ESSubscription.prototype = {
        remove : function () {
            this.getObject().removeSubscriber(this.getId(),
                                              this.getEventName());
        }
    };
    ESSubscription.extend(Subscription);

    function EventsSubscription(object, eventName, callback) {
        Subscription.apply(this, arguments);
        this.id = Events.add(object, eventName, callback);

    } EventsSubscription.prototype = {
        remove : function () {
            Events.del(this.getObject(), this.getEventName(), this.getId());
        }
    };
    EventsSubscription.extend(Subscription);


    /**
     *
     */
    function EventManager() {
        this.attachedEvents = [];
    } EventManager.prototype = {
        /**
         * @type Array<Subscription>
         */
        attachedEvents : [],
        /**
         * Adds an event and saves the subscription information.
         *
         * @param HTMLElement element
         * @param string eventName
         * @param Function callback
         */
        add : function (element, eventName, callback) {
            this.attachedEvents.push(
                Subscription.create(element, eventName, callback));
        },
        /**
         * Removes all events that were added through the event manager.
         */
        detach : function () {
            while (subscription = this.attachedEvents.pop()) {
                subscription.remove();
            }
        }
    };

    return EventManager;
})();
