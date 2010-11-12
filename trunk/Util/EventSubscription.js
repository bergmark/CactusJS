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
 * EventSubscription is an interface for observing specific events
 * on objects. The advantage over Observable is that listeners do not
 * have to figure out what happened to the object (typically which
 * property was modified), it only has to fetch the new state.
 *
 * The subscriber can be either a function or an object.
 *  If a function, then the function will be called passing the
 * observed object as an argument.
 *  If an object, the method `onEventNameTriggered` will be called
 * on the subscriber, passing the observed object as an argument.
 *
 * To implement EventSubscription, simply call
 * `EventSubscription.implement (MyConstructor)`.
 * An object has to explicitly tell that it passes out an event,
 * this  is  done  by  implementing  a  method  named `"on" + eventName`.
 * The property  is typically given Function.empty as its value at this
 * point. Note that this function will be replaced once/if a subscriber
 * is added. Documentation for the event marks the events that can be
 * sent  to  the event from the ES instance itself (@param string foo
 * means that the event would notify subscribers by calling
 * `this.onEventName (someString)`.
 *
 * If an object tries to subscribe to a non-existant event an error is
 * thrown. If unsure, test the existance of the method with
 * `implementsEvent (eventName)`.
 */
Cactus.Util.EventSubscription = (function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;

    /**
     * Subscription is an abstract private class that provides a uniform
     * interface for notifying subscribers. It also stores information specific
     * to one subscription (subscription being the relation between a
     * subscriber, the event it subscribes to and the subject.), currently only
     * removeOnTrigger.
     *
     * Subclasses need to super the constructor, and implement notify.
     */
    function Subscription (subscriber, removeOnTrigger) {
        this.subscriber = subscriber;
        this.removeOnTrigger = !!removeOnTrigger;
    } Subscription.prototype = {
        /**
         * @type mixed
         *   Type decided by subclasses.
         */
        subscriber : null,
        /**
         * @type boolean
         *   Whether the subscription should be terminated after it has been
         *   triggered the first time.
         */
        removeOnTrigger : false,
        /**
         * @return mixed
         */
        getSubscriber : function () {
            return this.subscriber;
        },
        /**
         * @return boolean
         */
        getRemoveOnTrigger : function () {
            return this.removeOnTrigger;
        },
        /**
         * Notifies the subscriber once an event is triggered.
         * Subclasses will define how notifications occur.
         * Listeners should recieve the object triggering the event somehow.
         *
         * @param EventSubscription subject
         *   The object that triggered the event.
         * @param string eventName
         *   The event that was triggered.
         * @param mixed *args
         *   Arguments to pass to the subscriber.
         */
        notify : function (subject, eventName) {
            // .
        }
    };

    /**
     * Instantiates a subscription of the appropriate type given a subscriber.
     *
     * @param mixed subscriber
     *   Any supported subscriber type.
     * @param boolean removeOnTrigger
     *   Whether the event should be removed after the first time it's
     *   triggered.
     */
    Subscription.create = function (subscriber, removeOnTrigger) {
        if (subscriber instanceof Function) {
            return new FunctionSubscription (subscriber, removeOnTrigger);
        } else {
            return new ObjectSubscription (subscriber, removeOnTrigger);
        }
    };

    /**
     * Allows subscribers of events to be functions. These functions are
     * executed once the event triggers.
     *
     * @param Function func
     * @param boolean removeOnTrigger
     */
    function FunctionSubscription (func, removeOnTrigger) {
        Subscription.call (this, func, removeOnTrigger);
    } FunctionSubscription.prototype = {
        /**
         * Notifies listening functions by executing them, passing additional
         * arguments as arguments to it. The first argument will be the observed
         * object.
         *
         * @param EventSubscription subject
         *   The object that triggered the event.
         * @param string eventName
         *   The triggered event.
         * @param mixed *args
         *   Additional arguments to pass to the subscriber.
         */
        notify : function (subject, eventName) {
            var args = [subject].concat (Collection.slice (arguments, 2));

            this.subscriber.apply (window, args);
        }
    };
    FunctionSubscription.extend (Subscription);

    /**
     * Allow any object to subscribe to an event. A method correspoding to the
     * triggered event will be called on this object. if a Deleted event is
     * triggered, onDeleteTriggered will be called on the listener.
     *
     * @param Object object
     * @param boolean removeOnTrigger
     */
    function ObjectSubscription (object, removeOnTrigger) {
        Subscription.call (this, object, removeOnTrigger);
    } ObjectSubscription.prototype = {
        /**
         * Sends the observed object and additional arguments to the subscriber.
         *
         * @param EventSubscription subject
         * @param string eventName
         * @param mixed *args
         */
        notify : function (subject, eventName) {
            var args = [subject].concat (Collection.slice (arguments, 2));
            var methodName = "on" + eventName + "Triggered"
            var method = this.subscriber [methodName];

            if (!(method instanceof Function)) {
                throw new Error ("Subscriber has no method named " + methodName);
            }
            method.apply (this.subscriber, args);
        }
    };
    ObjectSubscription.extend (Subscription);

    function EventSubscription () {
    }
    /**
     * Implements the ES interface on a constructor.
     *
     * @param Constructor constructor
     */
    EventSubscription.implement = function (constructor) {
        Object.copy (EventSubscription.prototype, constructor.prototype);
    };
    /**
     * Adds the ES interface to an existing object.
     *
     * @param Object instance
     */
    EventSubscription.addToInstance = function (instance) {
        Object.copy (EventSubscription.prototype, instance);
    };
    EventSubscription.prototype = {
        /**
         * @type Hash<string,Array[Subscription]>
         */
        _subscribers : {},
        /**
         * @param string eventName
         *   An event in capitalized camel case.
         * @return boolean
         *   Whether the object may send out the given event.
         */
        implementsEvent : function (eventName) {
            return ("on" + eventName) in this;
        },
        /**
         * Checks if the object has initialized event handling for a specific
         * property.
         *
         * @param string eventName
         *   An event in capitalized camel case.
         * @return boolean
         *   Whether the event exists.
         */
        _hasEvent : function (eventName) {
            return eventName in this._subscribers;
        },
        /**
         * @param string eventName
         *   An event in capitalized camel case.
         */
        _createEvent : function (eventName) {
            // Overrides the object if empty, so instances don't share
            // the object.
            if (Object.isEmpty (this._subscribers)) {
                this._subscribers = {};
            }
            this._subscribers [eventName] = [];
            this ["on" + eventName] = this._chainExecute.bind (this, eventName);
        },
        /**
         * Removed method. Use subscribe instead.
         */
        addSubscriber : function () {
            throw new Error("addSubscriber has been renamed to subscribe and "
                            + "the eventName and subscriber arguments have been"
                            + " flipped. Use it instead.");
        },
        /**
         * Adds a subscription for a specific event, the subscriber can be
         * either a function or an object.
         *
         * @param string eventName
         * @param Function/Object subscriber
         * @param optional boolean removeOnTrigger = false
         *   Whether the event should be removed after the first time its
         *   triggered.
         * @return ID
         *   A subscription identifier.
         */
        subscribe : function (eventName, subscriber, removeOnTrigger) {
            if (!this.implementsEvent (eventName)) {
                throw new Error("Object does not send out " + eventName);
            } else if (!this._hasEvent(eventName)) {
                this._createEvent(eventName);
            }

            var subscription = Subscription.create(subscriber, removeOnTrigger);
            this._subscribers [eventName].push (subscription);

            return subscriber;
        },
        /**
         * The name of all events this instance implements.
         *
         * @return Array<String>
         */
        __getEventNames : function () {
            var events = [];
            for (var p in this) {
                if (p.hasPrefix("on")) {
                    events.push(p.substr(2));
                }
            }
            return events;
        },
        /**
         * Subscribes to all events sent out. This is rewritten into
         * several subscribe calls, so to unsubscribe you need to unsubscribe
         * to each one.
         *
         * @param Function/Object subscriber
         * @param optional boolean removeOnTrigger = false
         * @return Array<ID>
         */
        subscribeAll : function (subscriber, removeOnTrigger) {
            var subscriptionIds = []
            var events = this.__getEventNames();
            for (var i = 0; i < events.length; i++) {
                subscriptionIds.push(
                    this.subscribe(events[i], subscriber, removeOnTrigger));
            }
            return subscriptionIds;
        },
        /**
         * @param ID id
         * @param string eventName
         * @return boolean
         *   Whether the given object subscribes to event.
         */
        hasSubscriber : function (id, eventName) {
            if (!this.implementsEvent (eventName)) {
                throw new Error("Object does not send out " + eventName);
            }

            if (!this._hasEvent (eventName)) {
                return false;
            }

            var subscriber = this._getSubscriberBySubscriptionID (id);

            var subscriptions = this._subscribers [eventName];

            for (var p in subscriptions) if (subscriptions.hasOwnProperty (p)) {
                if (subscriptions [p].getSubscriber() === subscriber) {
                    return true;
                }
            }

            return false;
        },
        /**
         * Removes a subscription. A potential problem here is if you subscribe
         * with a bound function, in which case you need to pass in _that_
         * function. Also note the removeOnTrigger argument to addSubscriber.
         *
         * @param ID id
         *   The ID of the subscriber to remove.
         * @param string eventName
         *   The event type the subscriber is associated to.
         */
        removeSubscriber : function (id, eventName) {
            if (!this.implementsEvent (eventName)) {
                throw new Error ("Object does not send out " + eventName);
            } else if (!this._hasEvent (eventName)) {
                throw new Error ("Object has no subscribers for " + eventName);
            }

            var subscriber = this._getSubscriberBySubscriptionID (id);

            this._subscribers [eventName] = Collection.reject (this._subscribers [eventName], function (sub) {
                return sub.getSubscriber() === subscriber;
            });
        },
        /**
         * Gets a subscriptions subscriber by its ID.
         *
         * @param ID id
         * @return Object
         *   A subscriber.
         */
        _getSubscriberBySubscriptionID : function (id) {
            return id;
        },
        /**
         * Removes a Subscription from an event collection.
         *
         * @param Subscription subscription
         * @param string eventName
         */
        _removeSubscription : function (subscription, eventName) {
            Array.remove (this._subscribers [eventName], subscription, false);
        },
        /**
         * This function is what is really executed when a subject calls
         * this.onEvent(), although it is curried with the name of the event
         * when the specific event is initialized (_createEvent). It also
         * receives additional arguments passed when triggering the event, and
         * it passes them along to subscribers.
         *
         * @param string eventName
         * @param mixed *args
         */
        _chainExecute : function (eventName) {
            var args = Collection.slice (arguments, 1);

            var subscriber;
            if (this._hasEvent (eventName)) {
                for (var p in this._subscribers[eventName]) {
                    var subscription = this._subscribers[eventName][p];
                    subscription.notify.apply(subscription,
                                              [this, eventName].concat(args));
                    if (subscription.getRemoveOnTrigger()) {
                        this._removeSubscription(subscription, eventName);
                    }
                }
            }
        }
    };
    /**
     * @param Object instance
     * @return bool
     *   Whether the instance implements the ES interface.
     */
    EventSubscription.implementsInterface = function (instance) {
        if (!instance) {
            return false;
        }
        if ("subscribe" in instance && "removeSubscriber" in instance) {
            return true;
        }
        return false;
    };

    return EventSubscription;
})();
