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
 * Decorators can be attached to an Array Controller (and hence also another
 * decorator) to form a chain of controllers. Decorating an Array Controller
 * basically means to reorder or filter elements in it. All modifications to the
 * decorator are propagated to the root controller which then bubbles events
 * back through the chain (or possibly chains) of decorators.
 *
 * The order of which decorators are added can greatly affect performance and
 * behavior. For instance, if the decoration chain is
 * ArrayController <- sortDecorator <- filterDecorator it will mean that
 * sortDecorator will keep a sorted list of the whole arrayController and
 * filter will take out the wanted elements. If instead we change the order to
 * Arraycontroller <- filterDecorator <- sortDecorator, sortDecorator will only
 * be aware of elements that passed the filter, meaning it will have less data
 * to operate on, improving performance.
 *
 * An example when behavior changes is in the comparison of these two decorator
 * chains:
 * 1. ac <- sortDecorator <- paginationDecorator
 * 2. ac <- paginationDecorator <- sortDecorator
 *
 * In case 1 sortDecorator will sort all elements and let paginationDecorator
 * operate on a sorted list. In case 2 pagination happens first, so the list
 * gotten from
 * sortDecorator will still be sorted, but the elements on the
 * page will only be sorted amongst themselves, and other
 * elements could fit inside the page, if only they were checked.
 * The behavior of case 2 is probably unwanted.
 *
 * Problems might arise when lazy load is added, so changes
 * will probably be made, but their magnitude is unknown ATM.
 *
 * The array controller implements Chain of Responsibility (CoR). CoR methods
 * propagate a method call to the decorator's component and lets client
 * programmers call methods on inner decorators. Say we are using the setup
 * ArrayController <- PaginationDecorator <- SortDecorator (meaning each page's
 * contents will be individually sorted). If the client wants to modify the page
 * of the paginator he would normally have to be aware of the order of the
 * decorations and call sorter.getComponent.setPage(n), but since the paginator
 * tells ArrayControllerDecorator to implement CoR for setPage, the sorter will
 * propagate the request to the next component which is the paginator and the
 * method can be executed successfully. Note that if we were to have two
 * decorators implementing the same method, there will be no way for the CoR to
 * know that that's the case and the outermost decorator will receive the call.
 *
 * Terminology:
 *   Decorator is an instance of ArrayControllerDecorator
 *   Component is the object that is decorated by the decorator.
 */
Cactus.MVC.Model.ArrayControllerDecorator = (function () {
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var log = Cactus.Dev.log;

    /**
     * @param ArrayController/Array component
     *   The decoratee.
     *   Pass an array if no array controller exists/is needed, one will be
     *   created.
     */
    function ArrayControllerDecorator (component) {
        if (component instanceof Array) {
            this.component = new ArrayController (component);
        } else {
            this.component = component;
        }
        this._setObjects();
        this._addSubscriptions();
    } ArrayControllerDecorator.prototype = {
        /**
         * @type ArrayController
         *   The decorated controller.
         */
        component : null,
        /**
         * Subscribes to the events that ArrayController notifies of.
         */
        _addSubscriptions : function () {
            this.component.subscribe("ObjectAdded", this);
            this.component.subscribe("ObjectRearrange", this);
            this.component.subscribe("ObjectRemoved", this);
            this.component.subscribe("ObjectSwap", this);
            this.component.subscribe("ObjectReplaced", this);
        },
        /**
         * Gets the component, useful for "removing" the leaf decorator.
         *
         * @return ArrayController
         */
        getComponent : function () {
            return this.component;
        },
        /**
         * Gets the arraycontroller at the root of the decoration list,
         * effectively removing all decorations.
         *
         * @return ArrayController
         */
        getRootComponent : function () {
            if (this.getComponent() instanceof ArrayControllerDecorator) {
                return this.getComponent().getRootComponent();
            } else {
                return this.getComponent();
            }
        },
        /**
         * Fetches all objects from the component.
         * This method is always overridden by subclasses since it
         * controls which objects are displayed and in what order.
         * It's triggered by onObjectRearrange.
         */
        _setObjects : function () {
            this.objects = this.getComponent().getRange();
        },
        /**
         * Adds an object to the component, objects are added to the decorator
         * during the bubbling phase, unless they're discarded at some level.
         *
         * Subclasses may choose to prevent this call from propagating to the
         * component.
         *
         * @param mixed object
         *   The object to add.
         */
        add : function (object) {
            this.getComponent().add(object);
        },
        /**
         * Adds the object to the specified index on the component.
         * All subclasses should override this.
         *
         * @param natural index
         * @param mixed object
         */
        addAtIndex : function (index, object) {
            this.getComponent().addAtIndex(index, object);
        },
        /**
         * Swaps two objects on the component, objects are swapped on the
         * decorator during the bubbling phase.
         *
         * Subclasses need to translate the indices to the appropriate ones
         * on the component.
         *
         * @param natural indexA
         * @param natural indexB
         */
        swap : function (indexA, indexB) {
            this.getComponent().swap(indexA, indexB);
        },
        /**
         * Replaces an object on the component with a new one. Object is
         * replaced on the decorator during the bubbling phase.
         *
         * Subclasses need to override this if the object added may be inside
         * the decorator but not inside the component.
         *
         * @param mixed newObject
         * @param mixed oldObject
         */
        replace : function (oldObject, newObject) {
            this.getComponent().replace(oldObject, newObject);
        },
        /**
         * Removes an object from the component, objects are removed from the
         * decorator in the bubbling phase, assuming the component sends out the
         * onRemove event.
         *
         * @param mixed object
         *   The object to remove.
         */
        remove : function (object) {
            this.getComponent().remove(object);
        },
        /**
         * Triggered when the component sends out onObjectAdded. The default
         * behaviour is to add the object to the end of the array and bubble the
         * event. This method can be overriden by decorator subclasses to
         * prevent the object from being added or to modiy where in the array it
         * is added.
         *
         * @param ArrayController component
         * @param natural index
         *   The index on the component where the object was added.
         */
        onObjectAddedTriggered : function (component, index) {
            this.objects.push(component.get(index));
            this.onObjectAdded (this.objects.length - 1);
        },
        /**
         * Triggered when the component sends out onObjectRemoved. The default
         * behavior is to remove the object from the collection and then bubble
         * the event. Subclasses may run into problems if they override this
         * method, so it's not recommended unless the behavior can be defined.
         *
         * @param ArrayController component
         * @param mixed object
         *   The object that was added to the component.
         * @param natural componentIndex
         *   The index of the component that the object was placed at.
         */
        onObjectRemovedTriggered : function (component, object, componentIndex) {
            var index = Array.remove (this.objects, object);
            if (index === -1) {
                return;
            }

            this.onObjectRemoved (object, index);
        },
        /**
         * Triggered when the component sends aut onObjectRearrange. This method
         * should probably not be overridden by subclasses.
         *
         * @param ArrayController component
         */
        onObjectRearrangeTriggered : function (component) {
            this._setObjects();
            this.onObjectRearrange();
        },
        /**
         * Triggered when two objects swap places on the component. The default
         * behavior is to swap the elements at the same positions as on the
         * component, so this method will always be replaced by subclasses.
         *
         * @param ArrayController component
         * @param natural indexA
         * @param natural indexB
         */
        onObjectSwapTriggered : function (component, indexA, indexB) {
            ArrayController.prototype.swap.call (this, indexA, indexB);
        },
        /**
         * Triggered when an object is replaced on the component. Default
         * behavior is to replace the same objects on the decorator. Override
         * if the elements may not be in the decorator, or if the order matters.
         *
         * @param ArrayController component
         * @param natural index
         * @param mixed oldObject
         * @param mixed newObject
         */
        onObjectReplacedTriggered : function (component, index, oldObject, newObject) {
            ArrayController.prototype.replace.call(this, oldObject, newObject);
        }
    };
    ArrayControllerDecorator.extend (ArrayController);
    /**
     * @param string methodName
     * @throws Error
     *   If the method already is defined for ACD.
     */
    ArrayControllerDecorator.createChainOfResponsibilityMethod
        = function (methodName) {
        if (methodName in ArrayControllerDecorator.prototype) {
            throw new Error ("Could not create chain of responsibility " +
                             method + "<" + methodName + "> " +
                             "because the method is already implemented");
        }
        ArrayControllerDecorator.prototype[methodName] = function () {
            return this.getComponent()[methodName].apply(this.getComponent(),
                                                         arguments);
        }
    };
    /**
     * Shorthand for adding several CoR methods.
     *
     * @param string *methodNames
     * @throws Error
     *   If any of the methods already is defined for ACD.
     */
    ArrayControllerDecorator.createChainOfResponsibilityMethods
        = function (methodName1) {
        for (var i = 0; i < arguments.length; i++) {
            ArrayControllerDecorator.createChainOfResponsibilityMethod(
                arguments[i]);
        }
    };

    return ArrayControllerDecorator;
})();
