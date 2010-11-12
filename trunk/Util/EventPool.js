/*
 * Copyright (c) 2007-2010, Adam Bergmark
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
 * EventPool is designed to be a centralized object taking care of event
 * handling.
 * At some global point in your code space you can create an event pool and
 * components should then be able to retrieve the reference to it. A component
 * can then create events and add subscriptions for events that other components
 * send out.
 * EventPool implements EventSubscription so subscribers can use that interface.
 * Additionally there is a createEvent method that components use to add new
 * events.
 */
Cactus.Util.EventPool = (function () {
    var log = Cactus.Dev.log;
    var EventSubscription = Cactus.Util.EventSubscription;
    var Collection = Cactus.Util.Collection;

    function EventPool() {

    } EventPool.prototype = {
        /**
         * @param String eventName
         *   The name of a new event to be created.
         *   There may not exist an event by this name already.
         *   The event name should not have the "on"-prefix.
         * @param optional Object owner = null
         *   The object that owns the event, it will receive the same
         *   onEventName method that the pool has.
         */
        createEvent : function (eventName, owner) {
            if (this.implementsEvent(eventName)) {
                throw new Error("EventPool:createEvent: Event with name %s already exists.".format(eventName));
            }
            this["on" + eventName] = Function.empty;
            if (owner) {
                // Add an onEventName method relaying to pool.onEventName.
                owner["on" + eventName] = function (self) {
                    var args = Collection.slice(arguments, 1);
                    self["on" + eventName].apply(self, args);
                }.curry(this);
            }
        }
    };
    EventSubscription.implement(EventPool);

    return EventPool;
})();
