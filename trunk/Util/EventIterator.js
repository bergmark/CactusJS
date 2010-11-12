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
 * The event iterator (EI) is an iterator that processes event based objects
 * sequentially. It should be used when a list of objects all should
 * perform the same operation. When working with events, objects might
 * finish their operations after an arbitrary amount of time has passed,
 * meaning observers have to be attached and we may not continue
 * processing the next item until the current one sends out this event.
 *
 * EventIterator is an abstraction of the behavior necessary to accomplish
 * this task. One instance should be created for every iteration performed.
 * It behaves in the same way as forEach does on an array of regular
 * objects (performing an operation on each item, not gathering a result).
 *
 * An example of when EI is used is for Queue in the animation library.
 * Queue contains a list of animations, each animation should be performed,
 * but an animation may not start until the one before it has finished.
 * Using EI to solve this problem adds a fundamental requirement
 * for the animation objects we are iterating through:
 * - An animation must send an EventSubscription message when it has
 *   finished animating.
 * onFinished is an appropriately named event, signifying that event in the
 * animation package.
 * Queues startForward method would then have the following body:
 * {
 *   var ei = new EventIterator (this.queue, "startForward", "Finished");
 *   ei.subscribe("Finish", this);
 *   ei.startForward();
 * }
 * the `subscribe` line is our queue object observing when the event
 * iterator finishes, so that it itself can send out a Finished event
 * (Queue being a subclass of Animation.Abstract after all).
 *
 * You can also add functions that are executed before and after each
 * iteration, on the current item. Pass that function to the
 * setBeforeProcessing and setAfterProcessing methods after
 * instantiating the EI. Note that afterProcessing is called after
 * the current item sends out its "finished" event.
 */
Cactus.Util.EventIterator = (function () {
    var log = Cactus.Dev.log;
    var EventSubscription = Cactus.Util.EventSubscription;

    /**
     * @param Array[Object] array
     *   The list to iterate through.
     * @param string methodName
     *   The name of the method to call on every item in the list.
     * @param string finishedEvent
     *   The event each list item sends when their action has finished.
     */
    function EventIterator (array, methodName, finishedEvent) {
        this.array = array;
        this.methodName = methodName;
        this.finishedEvent = finishedEvent;
        this["on" + finishedEvent + "Triggered"] = this._finishEventTriggered;
    } EventIterator.prototype = {
        // Events
        /**
         * Triggered when the iteration is completed.
         */
        onFinish : Function.empty,
        /**
         *
         * Triggered when the iteration is stopped prematurely using stop().
         */
        onStop : Function.empty,
        /**
         * Triggers before every item is processed, and before beforeProcessing
         * is called.
         *
         * @param Object currentItem
         */
        onBeforeItemProcess : Function.empty,
        /**
         * Triggered after each afterProcessing call, meaning after the
         * current item has finished, and after afterProcessing.
         */
        onItemProcessed : Function.empty,

        /**
         * @type Function
         *   Executed in the scope of the current item, before func is called.
         */
        beforeProcessing : Function.empty,
        /**
         * @type Function
         *   Executed in the scope of the current item, after func is called.
         */
        afterProcessing : Function.empty,
        /**
         * @type Array
         *   The array of objects to iterate through.
         */
        array : [],
        /**
         * @type String
         *   The name of the method to perform on each item in the collection.
         */
        methodName : "",
        /**
         * @type string
         *   The event that each item sends out when their operation is
         *   finished.
         */
        finishedEvent : null,
        /**
         * @type integer
         *   The current index for the iteration.
         */
        i : null,
        /**
         * @type Object
         *   The corrent item for the iteration.
         */
        currentItem : null,
        /**
         * @type boolean
         *   If the iteration is forward or backwards.
         */
        forward : true,
        /**
         * @type boolean
         *   If the object is iterating.
         */
        running : false,
        /**
         * @type boolean
         *   If true, it signalizes that the iteration should/will stop asap.
         */
        shouldStop : false,
        /**
         * @return Object
         */
        getCurrentItem : function () {
            return this.currentItem;
        },
        /**
         * @param Function beforeProcessing
         */
        setBeforeProcessing : function (beforeProcessing) {
            this.beforeProcessing = beforeProcessing;
        },
        /**
         * @pram Function afterProcessing
         */
        setAfterProcessing : function (afterProcessing) {
            this.afterProcessing = afterProcessing;
        },
        /**
         * Iterates through the list going forward (0->N)
         */
        startForward  : function () {
            this.forward = true;
            this.i = -1;
            this._start();
        },
        /**
         * Iterates through the list going backward (N->0)
         */
        startBackward : function () {
            this.forward = false;
            this.i = this.array.length;
            this._start();
        },
        /**
         * Starts the iteration. The iteration may not be running already.
         */
        _start : function () {
            if (this.running) {
                throw new Error ("Iteration already started");
            }
            this._next();
        },
        /**
         * Fetches the next item for the iteration.
         */
        _setItem : function () {
            if (this.forward) {
                this.i++;
            } else {
                this.i--;
            }
            // > This is a temporary fix for a possible removeOnTrigger bug
            // in EventSubscription.
            if (this.currentItem) {
                this.currentItem.removeSubscriber(this.___id,
                                                  this.finishedEvent);
            }
            this.currentItem = this.array [this.i];
        },
        /**
         * Gets the next item in the array, and sets up observers and processes
         * it.
         */
        _next : function () {
            this._setItem();

            if (this.currentItem !== undefined) {
                // > This is a temporary fix for a possible removeOnTrigger bug
                // in EventSubscription.
                this.___id = this.currentItem.subscribe(this.finishedEvent,
                                                        this, true);
                this.onBeforeItemProcess(this.currentItem);
                this.beforeProcessing.call (this.currentItem);
                 // Push the call down to the run loop to clear the call stack.
                setTimeout(this.currentItem[this.methodName].bind(
                    this.currentItem), 0);
            } else {
                // Done.
                this._finished();
            }
        },
        /**
         * Stops the iteration.
         */
        stop : function () {
            this.shouldStop = true;
        },
        /**
         * Called when the iteration is finished.
         */
        _finished : function () {
            this.running = false;
            this.onFinish();
        },
        /**
         * Called when an item in the array is finished.
         * If shouldStop is set, the next item will not be processed.
         *
         * @param Object object
         *   The current item
         */
        _finishEventTriggered : function (object) {
            this.afterProcessing.call(this.currentItem);
            this.onItemProcessed(this.currentItem);
            if (this.shouldStop) {
                this.shouldStop = false;
                this.onStop();
            } else {
                this._next();
            }
        }
    };

    EventSubscription.implement (EventIterator);

    return EventIterator;
})();
