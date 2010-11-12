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
 * A List Template uses an array controller with KVC objects, a template
 * prototype and a HTML list. It displays the KVC objects through template
 * instances and reacts on changes to the array controller.
 *
 * So, use it to display several objects of the same type.
 *
 * ListTemplate restricts the type of the dataSource to
 * ArrayController<KeyValueCoding>.
 *
 * You can use the list templates with any element that can contain several
 * child elements. The most obvious examples would be lists (OL and UL) and
 * tables. It's also possible to use selects, but note that each option will
 * expect its key path to be a hash of value and text to display in the option.
 *
 * Event bindings exist for ListTemplates also. Events are bound to each list
 * item and when an event triggers on one of them, the callback passes the AC
 * along with the index of the object associated with the list item that was
 * clicked. Event bindings for ListTemplates allows the client to manipulate the
 * list itself. An example is if a list contains a "remove" button, that when
 * clicked should remove the object from the list/AC. This cannot be done
 * in a smooth manner if using only Template event bindings.
 * Therefore, use Template event bindings when manipulating the object itself,
 * and use ListTemplate event bindings when manipulating the collection.
 *
 * For styling purposes, three classnames exist for list items,
 * ".first" and ".last" is placed on the first and last element, respectively.
 * ".single" is placed on a list item when it is the only item in the list.
 * Therefore, a single element will also have the first and last classnames.
 */
Cactus.MVC.View.ListTemplate = (function () {
    var log = Cactus.Dev.log;
    var Template = Cactus.MVC.View.Template;
    var Collection = Cactus.Util.Collection;
    var tag = Cactus.DOM.tag;
    var $ = Cactus.DOM.select;
    var Events = Cactus.DOM.Events;
    var AbstractTemplate = Cactus.MVC.View.AbstractTemplate;
    var ClassNames = Cactus.DOM.ClassNames;
    var Event = Cactus.DOM.Event;
    var KVC = Cactus.Util.KeyValueCoding;
    var JSON = Cactus.Util.JSON;

    /**
     * @param ArrayController arrayController
     *   The collection with objects to display
     * @param Template templatePrototypes
     *   The template to clone to show the KVC objects in the array controller.
     *        Collection[Hash{constructor : constructor , template : Template }]
     *   Allows you to provide different templates for different KVC subclasses.
     * @param HTMLListElement rootElement
     */
    function ListTemplate(arrayController, templatePrototypes, rootElement) {
        if (templatePrototypes instanceof Array) {
            // Check the array for well-formedness.
            for (var i = 0; i < templatePrototypes.length; i++) {
                var setting = templatePrototypes[i];
                if (!(setting instanceof Object)
                    || !("constructor" in setting)
                    || !("template" in setting)
                    || !(setting.constructor instanceof Function)
                    || !(setting.template instanceof Template)) {
                    throw new Error("ListTemplate: templatePrototype setting "
                                    + "is malformed, got: "
                                    + JSON.stringify(setting));
                }
            }

            this.templatePrototypes = templatePrototypes;
        } else if (!(templatePrototypes instanceof Template)) {
            throw new Error("ListTemplate: templatePrototypes argument should "
                            + "be a Hash or Template.");
        } else {
            this.templatePrototypes = [{
                constructor : KVC,
                template : templatePrototypes
            }];
        }
        this.templates = [];
        this.rootElement = rootElement;
        this.subscriptions = [];
        if (arrayController) {
            this.bindTo(arrayController);
        }
    } ListTemplate.prototype = {
        /**
         * @type Array[Template] templates
         *   Currently used templates.
         */
        templates : null,
        /**
         * @type Collection[Hash{
         *     constructor : constructor,
         *     template : Template
         * }]
         *   The prototypes used for creating new template instances.
         */
        templatePrototypes : null,
        /**
         * @type Array[Hash]
         *   Holds event types, the subscribed object along with the
         *   subscription ID's in order to be able to remove them.
         */
        subscriptions : null,
        /**
         * Adds a single subscription. Helper for _addSubscriptions.
         * Events are bound to the corresponding onTriggered methods.
         *
         * @param string eventName
         *   The type of event to add.
         */
        _addSubscription : function (eventName) {
            this.subscriptions.push ({
                object : this._getDataSource(),
                event : eventName,
                id : this._getDataSource().subscribe(eventName, this)
            });
        },
        /**
         * Adds subscriptions to the Array Controller.
         */
        _addSubscriptions : function () {
            var subscription;
            while (subscription = this.subscriptions.pop()) {
                subscription.object.removeSubscriber(subscription.id,
                                                     subscription.event);
            }
            this._addSubscription("ObjectAdded");
            this._addSubscription("ObjectRemoved");
            this._addSubscription("ObjectSwap");
            this._addSubscription("ObjectReplaced");
            this._addSubscription("ObjectRearrange");
        },
        /**
         * Deletes all templates and clears the HTML list.
         */
        _clear : function () {
            Array.empty(this.templates);
            var root = this.getRootElement();
            while (root.firstChild) {
                root.removeChild(root.firstChild);
            }
        },
        /**
         * Clears the templates and creates new ones.
         */
        refresh : function () {
            var dataSource = this._getDataSource();
            this._addSubscriptions();
            this._clear();
            for (var i = 0, ii = dataSource.count(); i < ii; i++) {
                var template = this._createTemplateForObject(
                    dataSource.get(i));
                this.templates.push(template);
                this.getRootElement().appendChild(template.getRootElement());
            }
            this._setClassNames();
            this._addSubscriptions();
        },
        /**
         * @type string
         *   A CSS class name.
         */
        firstClassName : "first",
        /**
         * @param string className
         */
        setFirstClassName : function (className) {
            var hasElem = this.hasDataSource() && this._getDataSource().count() !== 0;
            if (hasElem) {
                ClassNames.del(this.getListItem(0), this.firstClassName);
            }
            this.firstClassName = className;
            if (hasElem) {
                ClassNames.add(this.getListItem(0), this.firstClassName);
            }
        },
        /**
         * @type string
         *   A CSS class name.
         */
        lastClassName : "last",
        /**
         * @param string className
         */
        setLastClassName : function (className) {
            var count;
            var hasElem = this.hasDataSource() && (count = this._getDataSource().count()) !== 0;
            if (hasElem) {
                ClassNames.del(this.getListItem(count - 1), this.lastClassName);
            }
            this.lastClassName = className;
            if (hasElem) {
                ClassNames.add(this.getListItem(count - 1), this.lastClassName);
            }
        },
        /**
         * @type string
         *   A CSS class name.
         */
        singleClassName : "single",
        /**
         * @param string className
         */
        setSingleClassName : function (className) {
            var hasElem = this.hasDataSource() && this._getDataSource().count() === 1;
            if (hasElem) {
                ClassNames.del(this.getListItem(0), this.singleClassName);
            }
            this.singleClassName = className;
            if (hasElem) {
                ClassNames.add(this.getListItem(0), this.singleClassName);
            }
        },
        /**
         * Attaches .first and .last class names to the first and last element
         * of the HTML List, respectively. Also makes sure no other LI's have
         * this class name.
         */
        _setClassNames : function () {
            var count = this._getDataSource().count();
            if (count) {
                ClassNames.add(this.getListItem(0), this.firstClassName);
                ClassNames.add(this.getListItem(count - 1), this.lastClassName);
            }
            for (var i = 0; i < count; i++) {
                if (i !== 0) {
                    ClassNames.del(this.getListItem(i), this.firstClassName);
                }
                if (i !== count - 1) {
                    ClassNames.del(this.getListItem(i), this.lastClassName);
                }
                ClassNames.del(this.getListItem(i), this.singleClassName);
            }
            if (count === 1) {
                ClassNames.add(this.getListItem(0), this.singleClassName);
            }
        },
        /**
         * @param natural controllerIndex
         *   The index of an object in the array controller.
         * @return HTMLLIElement
         *   The LI at the specified index.
         */
        getListItem : function (controllerIndex) {
            return this.getRootElement().childNodes [controllerIndex];
        },
        /**
         * When a new object is added to the array controller a template is
         * created and displayed at the appropriate position in the HTML list.
         *
         * @param ArrayController arrayController
         * @param natural index
         */
        onObjectAddedTriggered : function (arrayController, index) {
            var template = this._createTemplateForObject(
                this._getDataSource().get(index));
            this.templates.splice(index, 0, template);

            var li = template.getRootElement();

            // Gets the element currently at the position
            // we're inserting at.
            var htmlPosition = this.getListItem (index);
            // If there is no object at this index, we appendChild
            // otherwise we use insertBefore.
            if (htmlPosition) {
                this.getRootElement().insertBefore(li, htmlPosition);
            } else {
                this.getRootElement().appendChild(li);
            }
            this._setClassNames();
        },
        /**
         * Clears the templates and creates new ones for all objects in the
         * array controller.
         *
         * @param ArrayController arrayController
         */
        onObjectRearrangeTriggered : function (arrayController) {
            this.refresh();
        },
        /**
         * @param ArrayController arrayController
         * @param KeyValueCoding object
         * @param natural controllerIndex
         */
        onObjectRemovedTriggered : function (arrayController, object,
                                             controllerIndex) {
            var item = this.getListItem(controllerIndex);
            this.getRootElement().removeChild(item);
            this._setClassNames();
        },
        /**
         * Swaps the positions of two list items.
         *
         * @param ArrayController arrayController
         * @param natural indexA
         * @param natural indexB
         */
        onObjectSwapTriggered : function (arrayController, indexA, indexB) {
            var a = this.getListItem (indexA);
            var b = this.getListItem (indexB);
            this.getRootElement().insertBefore (b, a);

            if (indexB === this.getRootElement().childNodes.length - 1) {
                this.getRootElement().appendChild (a);
            } else {
                var after = this.getListItem (indexB);
                this.getRootElement().insertBefore (a, after);
            }
            this._setClassNames();
        },
        /**
         * Replaces a list item with a new one for the newly added object.
         *
         * @param ArrayController arrayController
         * @param natural index
         * @param KeyValueCoding oldObject
         * @param KeyValueCoding newObject
         */
        onObjectReplacedTriggered : function (arrayController, index,
                                              oldObject, newObject) {
            var template = this._createTemplateForObject (newObject);
            var li = template.getRootElement();
            this.templates[index] = newObject;
            this.getRootElement().replaceChild(li, this.getListItem(index));
            this._setClassNames();
        },
        /**
         * Clones a template and binds it to the object.
         *
         * @param KeyValueCoding object
         * @return Template
         */
        _createTemplateForObject : function (object) {
            var settings = this.templatePrototypes;
            var setting;
            for (var i = 0; i < settings.length; i++) {
                setting = settings[i];
                // KVC isn't a superclass of any of the classes implementing its
                // interface. But setting KVC as the constructor should match
                // any of these object.
                if (setting.constructor === KVC) {
                    return Template.create(setting.template, {
                        kvcBinding : object
                    });
                }
                if (object instanceof setting.constructor) {
                    return Template.create(setting.template, {
                        kvcBinding : object
                    });
                }
            }
            throw new Error("ListTemplate:_createTemplateForObject: "
                          + "Could not find appropriate constructor for KVC: "
                            + JSON.stringify(object));
        },
        /**
         * Event Bindings on a ListTemplate operates by catching propagating
         * events from the inner templates. The method calls invoke methods
         * on the ListTemplate, passing along the index of the template where
         * the event occured, and the event object. The same arguments are
         * passed to callbacks.
         *
         * @param Array[Hash] bindings
         *   See AbstractTemplate:createEventBindings.
         */
        createEventBindings : function (bindings) {
            var that = this;
            var rootElement = that.getRootElement();
            Collection.each (bindings, function (binding) {
                binding.event = binding.event || "click";

                Events.add(that.getRootElement(), binding.event, function (e) {
                    var ev = new Event(e);

                    // Traverse up to the root of the sub template so we know
                    // which list item had its event triggered.
                    var el = ev.getTarget();
                    while (el.parentNode !== rootElement) {
                        el = el.parentNode;

                        // The template has been removed from the list template,
                        // cancel.
                        if (!el) {
                            return;
                        }
                    }

                    // Check the index of this list item.
                    var elIndex = 0;
                    for (;elIndex < rootElement.childNodes.length; elIndex++) {
                        if (rootElement.childNodes [elIndex] === el) {
                            break;
                        }
                    }

                    // Make sure the element that the event triggered on matches
                    // the given selector.
                    if ($(binding.selector,
                          that.getRootElement().childNodes[elIndex])[0]
                        !== ev.getTarget()) {
                        return;
                    }

                    if (binding.callback) {
                        binding.callback(that._getDataSource(), elIndex, e);
                    } else {
                        that._getDataSource()[binding.method](elIndex);
                    }
                    return false;
                });
            });
        }
    };

    ListTemplate.create = function (template, rootElement, settings) {
        settings = settings || {};

        var listTemplate = new ListTemplate(null, template, rootElement);

        if (settings.eventBindings) {
            listTemplate.createEventBindings(settings.eventBindings);
        }

        if (settings.firstClassName) {
            listTemplate.setFirstClassName(settings.firstClassName);
        }
        if (settings.lastClassName) {
            listTemplate.setLastClassName(settings.lastClassName);
        }
        if (settings.singleClassName) {
            listTemplate.setSingleClassName(settings.singleClassName);
        }

        if (settings.arrayController) {
            listTemplate.bindTo(settings.arrayController);
        }

        return listTemplate;
    };

    ListTemplate.extend(AbstractTemplate);

    return ListTemplate;
})();
