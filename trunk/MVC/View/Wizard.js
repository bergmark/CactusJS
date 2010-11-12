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
 * Given an array of menu elements and an array of elements (or an array of
 * arrays of elements), Wizard attaches events to toggle the active menu
 * element/element pair.
 * It gives the active pair the className "active" (which can be overridden).
 * If an array of arrays of elements is given, each one will have one active
 * element at any given time. That is, if page 1 is active, the 2nd element of
 * each inner array is marked as "active".
 */
Cactus.MVC.View.Wizard = (function () {
    var log = Cactus.Dev.log;
    var ClassNames = Cactus.DOM.ClassNames;
    var Events = Cactus.DOM.Events;
    var EventSubscription = Cactus.Util.EventSubscription;
    var Set = Cactus.Util.Set;

    /**
     * @param Array<HTMLElement> menuElements
     *   Will get onclick events assigned to them, for changing pages.
     * @param Array<HTMLElement> elements
     *   A set of "pages" for the wizard.
     *        Array<Array<HTMLElement>> elements
     *   Several sets of "pages".
     * @param optional natural initialActive = 0
     *   The index element that should be activated initially.
     *   Must be a valid index.
     */
    function Wizard(menuElements, elements, initialActive) {
        initialActive = initialActive || 0;

        if (!(elements[0] instanceof Array)) {
            elements = [elements];
        }

        // Check the length of all element arrays.
        for (var i = 0; i < elements.length; i++) {
            if (menuElements.length !== elements[i].length) {
                throw new Error(("menuElements(%s) and each set of elements(%s) "
                                 + "should have the same length")
                                .format(menuElements.length,
                                        elements[i].length));
            }
        }

        // Suffices to check one of the element arrays since they've all been
        // proven to be of equal length above.
        if (elements[0].length === 0) {
            throw new Error(
                "No elements were given, there must be at least one.");
        }

        this.menuElements = menuElements;
        this.elements = elements;
        this.items = this.elements[0].length;
        this.activatedIndices = new Set();

        this._setEvents();
        this.setActive(initialActive);
    } Wizard.prototype = {
        // Events.
        /**
         * Triggers when an element is activated (displayed).
         * This event can for instance be used when information needs to be
         * updated whenever the element becomes active.
         *
         * @param natural index
         *   The index of the activated element in the wizard.
         */
        onActivated : Function.empty,
        /**
         * Triggers when an element is dectivated (hidden).
         * Can for instance be used to deallocate data that is no longer needed,
         *  or to stop operations.
         *
         * @param natural index
         *   The index of the deactivated element in the wizard.
         */
        onDeactivated : Function.empty,
        /**
         * Triggers when an element is first activated (or "displayed"). If
         * a subscription is made after an activation, all previous events will
         * be immediately passed (synchronously).
         *
         * Use this event for delaying the setup of the element's bindings until
         * it needs to be displayed.
         *
         * @param natural index
         *   The index of the activated element in the wizard.
         */
        onFirstActivated : Function.empty,

        /**
         * @type positive
         * The number of elements (equal to the number of menuElements).
         */
        items : 0,
        /**
         * @type natural
         * The index of the currently active menuElement/element.
         */
        activeIndex : null,
        /**
         * @type string
         *   The class name set for the currently active wizard.
         */
        activeClassName : "active",
        /**
         * @type Set<natural>
         *   The indices of the elements that have been active.
         */
        activatedIndices : null,
        /**
         * Attaches events to the menu elements, to toggle the active element.
         */
        _setEvents : function () {
            for (var i = 0; i < this.items; i++) {
                Events.add(this.menuElements[i],
                           "click",
                           this.setActive.bind(this, i).returning(false));
            }
        },
        /**
         * Resets and sets classnames.
         */
        _setClassNames : function () {
            var className = this.activeClassName;
            for (var i = 0; i < this.menuElements.length; i++) {
                ClassNames.del(this.menuElements[i], className);
                for (var j = 0; j < this.elements.length; j++) {
                    ClassNames.del(this.elements[j][i], className);
                }
            }
            ClassNames.add(this.menuElements[this.activeIndex], className);
            for (var i = 0; i < this.elements.length; i++) {
                ClassNames.add(this.elements[i][this.activeIndex], className);
            }
        },
        /**
         * Activates the element under the given index.
         *
         * @param natural index
         */
        setActive : function (index) {
            if (typeof index !== "number" || index < 0 || index >= this.items) {
                throw new Error(
                    "Invalid index given to setActive: %s".format(index));
            }
            if (index === this.activeIndex) {
                return;
            }
            var previous = this.activeIndex;
            this.activeIndex = index;
            if (this.activatedIndices.add(index)) {
                this.onFirstActivated(index);
            }
            this._setClassNames();
            this.onActivated(index);
            if (previous !== null) {
                this.onDeactivated(previous);
            }
        },
        /**
         * Sets the next element as active. If the current element is the last,
         * the first one is changed to active instead.
         */
        showNext : function () {
            this.setActive((this.activeIndex + 1) % this.items);
        },
        /**
         * Override for subscribe. Fires onFirstActivation instantly if the
         * element has already activated.
         */
        subscribe : function (eventName, subscriber, removeOnTrigger) {
            EventSubscription.prototype.subscribe.call(this,
                                                       eventName,
                                                       subscriber,
                                                       removeOnTrigger);
            if (eventName === "FirstActivated") {
                if (removeOnTrigger) {
                    throw new Error(
                        "Removing FirstActivation on its first trigger is "
                        + "inappropriate since it triggers every time an"
                        + "element activates for the first time.");
                }

                for (var i = 0, ii = this.activatedIndices.size();
                     i < ii; i++) {
                    // Only trigger the event on the new subscriber since the
                    // old ones already received the event.
                    if (subscriber instanceof Function) {
                        subscriber(this, this.activatedIndices.get(i));
                    } else {
                        subscriber.onFirstActivatedTriggered(
                            this,
                            this.activatedIndices.get(i));
                    }
                }
            }
        },
        /**
         * @param natural pageIndex
         * @return HTMLElement
         *   The menu associated with the given page index.
         */
        getMenuElement : function (pageIndex) {
            return this.menuElements[pageIndex];
        },
        /**
         * @param natural index
         * @return Array<HTMLElement>
         *  The elements associated with the given page index.
         */
        getElements : function (pageIndex) {
            var elements = [];
            for (var i = 0; i < this.elements.length; i++) {
                elements.push(this.elements[i][pageIndex]);
            }
            return elements;
        }
    };

    // Insert EventSubscription overrides.
    var subscribe = Wizard.prototype.subscribe;
    EventSubscription.implement(Wizard);
    Wizard.prototype.subscribe = subscribe;

    return Wizard;
})();
