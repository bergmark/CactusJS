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

A template is a collection of HTMLElements that is bound to an object
implementing KeyValueCoding so that any changes in the object is
reflected in the DOM. A template has a reference to a root node and
realizes the bindings to the KVC object by transforming class names of
HTMLElements into keyPaths. For example, when the class name "a_b"
occurs in the html it will check if the key path "a.b" exists on the
object, if it does the value will be fetched and inserted
appropriately (depending on what kind of element and value type we are
working with.) A listener is added to the root object, and every time
it changes, the view (template) will be notified and will try to update
itself.

Templates can be constructed in three different ways,
by:
* Cloning an existing template (Prototype pattern)
* Getting an existing DOM structure, which is then directly used to display
  data. Clone it using cloneNode(true) if you want a new structure to operate
  on.
* Getting a string of HTML, which is then converted to DOM nodes

Implementation notes:
Template restricts the type of bound objects to KeyValueCoding.

Here's an example:

We want to print some text for each article written by our users, the
information we need to display is
* The title of the article
* The name of the author

We create a template from a string of HTML (note that create should be
used over the regular constructor):

var template = Template.create('<div><h1 class="title"></h1><p>Hello\
there, <span class="user_name"></span></p></div>');

A few things are important here:
* A root element has to exist, here the div acts as one

* We have marked the elements we want to give dynamic values with
  class names

* We could assign class names only for css styling. As long as they
  don't match key paths on our KVC object, they won't interfere with
  our KVO (Key Value Observing).

* Several class names may be assigned to an element, but if several
  key paths are assigned, the behavior is undefined. That said, if
  there are several class names but only one matches a key path, it
  will work as expected.

Now the variable `template` holds a reference to our template, but
since we might want to use it again in other places we will consider
it to be our prototypical instance, and we clone it if we wan't to use
it to display data.

Let's consider the KVC-object, we have articles and authors. We could
consider both articles and authors to be immutable value objects for
this simple example. So the relation could be a one-way aggregation
where an Article has an Author. Code:

function Author (name) {
  this.name = name;
} Author.prototype = {

};
KVC.implement(Author);

function Article (title, author) {
  this.title = title;
  this.author = author;
} Article.prototype = {

};
KVC.implement(Article);

Let's create an article now:

var article = new Article ("The Title", new Author ("Adam"));


now we have a template along with a data structure to display, let's
append the template's DOM structure to our document and bind the
article to it:

template.bindTo (article);
document.body.appendChild (template.getRootElement());

if we extract the html from the template we will ge the following:
template.getRootElement().innerHTML
=> "<div><h1 class="title">The Title</h1><p>Hello\
there, <span class="user_name">Adam</span></p></div>"

Only  this  functionality  would  surely  be easy  to  implement  from
scratch, but what happens when we change the article object?

article.setValue ("author.name", "Burt");
template.getRootElement().innerHTML
=> "<div><h1 class="title">The Title</h1><p>Hello
there, <span class="user_name">Burt</span></p></div>"


= Event Bindings =

Event bindings is an easy way to bind events to your template.

Some of them are added implicitly, if your KVC object has a method name `foo`
and you give a button class="foo" its onclick will be bound to the foo method.

Bindings are also added for form elements. For instance, onchange handlers are
added to input text fields and when triggered the corresponding KVC value is
updated as well.

If you want to add an event that isn't added implicitly you can do so by using
the createEventBindings method:

template.createEventBindings ([{
    selector : ".x",
    event : "click",
    callback : function () {
        alert (".x was clicked");
    }
},{
    selector : ".y",
    event : "mouseover",
    method : "doSomething"
}]);

This will set the onclick of .x to the specified function and the mouseover of
.y will trigger the doSomething method on the bound KVC object.


Common for all event bindings is that they are cloned when templates are created
out of a prototype and that they are updated (if appropriate) when the bound KVC
object is exchanged.

An error will be thrown if you create an event binding with a selector that does
not exist below the root element. This error will however not be thrown until a
KVC is bound to the template.

= Widgets =

A widget is assigned a key path and takes up the first DOM node
matching the key path's class name. It takes ownership of the node and
any changed key values are forwarded to it. This allows widgets to
provide a richer view of properties. As an example, you may implement a Slider
Widget that let's the user drag a bar to select enumerated values. Any change
in the KVC will be displayed in the widget, and vice versa. But note that
Widgets updating the KVC object hasn't been implemented yet.

Note: To create a Widget, start by subclassing MVC.View.Widget.
Further documentation is available in its source file.

= Modes =

A mode restricts how HTML elements associated with keypaths behave,
there are three different modes (all expressed from the point of view
of the view):

* "read":
    The field is read-only and changes to the model propagates to the
    element, but not vice versa.
* "write":
    The field is writable, changes in the view will propagate to the
    model, but not vice versa.
* "both":
    Model can write to view, and view can write to model.

If no mode is specified, "both" is used.

If you want no communication between model and view, don't specify a
mode, but add the keypath to skipKeyPaths (or change the class name of
the HTML element).

= Handling null values =

It's usually a bad idea to be able to set a value to null, this can
break keypath traversal among other things. For convenience, null
values are printed to the UI as "".  If you wish to change this
behavior, add a value transformer (transformers will be called with
the null value, before the transformation has taken place.)

*/
Cactus.MVC.View.Template = (function () {
    var $ = Cactus.DOM.select;
    var $f = Cactus.DOM.selectFirst;
    var Element = Cactus.DOM.Element;
    var log = Cactus.Dev.log;
    var ClassNames = Cactus.DOM.ClassNames;
    var tag = Cactus.DOM.tag;
    var KVC = Cactus.Util.KeyValueCoding;
    var Events = Cactus.DOM.Events;
    var Collection = Cactus.Util.Collection;
    var AbstractTemplate = Cactus.MVC.View.AbstractTemplate;
    var EventManager = Cactus.DOM.EventManager;
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var ListTemplate = null; // Circular dependency, set later.
    var ValueTransformers = Cactus.MVC.View.TemplateHelpers.ValueTransformers;
    var Options = Cactus.Util.Options;
    var Widget = Cactus.MVC.View.Widget;

    /**
     * @param HTMLElement rootElement
     *   The DOM structure to display data in.
     */
    function Template(rootElement) {
        // Solve the circular dependency.
        var C = Cactus;
        ListTemplate = C.MVC.View.ListTemplate;

        if (!rootElement) {
            throw new Error("rootElement was: %s".format(rootElement));
        }

        this.rootElement = rootElement;
        this.valueTransformers = new ValueTransformers(rootElement);
        this.elements = {};
        this.eventBindings = [];
        this.bindingEventManager = new EventManager();
        this.writeEventManager = new EventManager();
        this.widgets = [];
        this.keyPaths = [];
        this.classNameConditions = {};
        this.skipKeyPaths = [];
        this.modes = {};
    } Template.prototype = {
        /**
         * @type Hash<KeyPath,Array<HTMLElement>>
         *   Stores references between keypaths and their respective elements.
         *   Acts as a dictionary, since a key path may have several matching
         *   elements.
         */
        elements : null,
        /**
         * @type Array<KeyPath>
         *   All keypaths found in the template that existed in the data source.
         */
        keyPaths : null,
        /**
         * @type string
         *  This prefix is expected on all class names.
         */
        classNamePrefix : "",
        /**
         * @type EventManager
         *   Keeps track of events bound as Event Bindings.
         */
        bindingEventManager : null,
        /**
         * @type EventManager
         *   Keeps track of events bound as Write Events.
         */
        writeEventManager : null,
        /**
         * Turns a class name into its corresponding key path.
         *
         * @param string className
         * @return string
         */
        _classNameToKeyPath : function (className) {
            className = className.replace(this.classNamePrefix, "");
            return className.replace(/_/g, ".");
        },
        /**
         * Turns a key path into its corresponding CSS class name.
         *
         * @param string keyPath
         * @return string
         */
        _keyPathToClassName : function (keyPath) {
            return this.classNamePrefix + keyPath.replace(/\./g, "_");
        },
        /**
         * Checks whether a keypath shares a path from the root with a prefix.
         * In this implementation hasPrefix(v, v) => false for all v.
         *
         * @param string keyPath
         * @param string prefix
         * @return boolean
         */
        _keyPathHasPrefixExclusive : function (keyPath, prefix) {
            if (keyPath === prefix) {
                return false;
            }
            keyPath = keyPath.split(".");
            prefix = prefix.split(".");
            if (prefix.length > keyPath.length) {
                return false;
            }
            for (var i = 0; i < prefix.length; i++) {
                if (keyPath[i] !== prefix[i]) {
                    return false;
                }
            }
            return true;
        },
        /*
         * @param string className
         */
        _classNameIsPossibleKeyPath : function (className) {
            if (!this.classNamePrefix) {
                return true;
            }
            // Assumption: prefix has no characters regex considers special.
            return new RegExp("^" + this.classNamePrefix).test(className);
        },
        /**
         * Clears elements and keyPaths and iterates through all elements under
         * the root and sets any values that can be found by getting key paths
         * from the class names of the nodes.
         */
        refresh : function () {
            this._detachWriteEvents();

            this.elements = {};
            var elements = Collection.coerce(
                $("*", this.rootElement)).concat(this.rootElement);
            var keyPath;
            var keyPaths;

            // Loop through all elements.
            for (var element, i = 0; element = elements[i]; i++) {
                // Fetch all possible key paths, key paths not having the
                // specified class name prefix are excluded.

                var classNames = Collection.select(
                    ClassNames.get(element),
                    this._classNameIsPossibleKeyPath.bind(this));
                var keyPaths = Collection.map(
                    classNames,
                    this._classNameToKeyPath.bind(this));

                // Loop through all key paths for the current element.
                for (var j = 0; j < keyPaths.length; j++) {
                    keyPath = keyPaths [j];

                    if (this.__shouldSkipKeyPath(keyPath)) {
                        continue;
                    }

                    // If the KVC object has a KP that matches the one
                    // found in the template, the HTML element is
                    // given the value of that key path.
                    if (keyPath && this._getDataSource().hasKeyPath(keyPath)) {

                        // Store the key path along with the HTML element.
                        this._addBindingData(keyPath, element);

                        this._addWriteEvent(element, keyPath);

                        // Set the value.
                        this._setValue(
                            keyPath,
                            this._getDataSource().getValue (keyPath));
                    }

                }
            }

            this._attachEventBindings();
            this._attachClassNameConditions();
        },
        /**
         * Adds information that signifies which elements listen to which
         * key paths. The method may be called several times for the same
         * key path.
         *
         * @param string keyPath
         * @param HTMLElement element
         */
        _addBindingData : function (keyPath, element) {
            if (!this.elements[keyPath]) {
                this.elements[keyPath] = [];
            }
            this.elements[keyPath].push(element);
        },
        /**
         * Adds event bindings for form elements so changes in them are
         * propagated to the KVC object and then back to the for element.
         *
         * @param HTMLElement element
         *   The form element to add the binding to.
         * @param string keyPath
         *   The keyPath to bind changes to.
         */
        _addWriteEvent : function (element, keyPath) {
            var that = this;

            var addEvent = this.writeEventManager.add.bind(
                this.writeEventManager);

            function addButtonEvent () {
                addEvent(element,
                         "click",
                         dataSource.getValue(keyPath)
                                   .bind(dataSource)
                                   .returning(false));
            }

            var setValue = function (value) {
                if (!this.mayWriteToModel(keyPath)) {
                    return;
                }
                if (value === undefined) {
                    value = Element.getValue(element);
                }
                value = this.valueTransformers.reverseTransform(keyPath, element, value);
                template._getDataSource().setValue(keyPath, value);
            }.bind(this);
            var setValueNone = setValue.none();

            var template = this;
            var dataSource = template._getDataSource();

            switch (element.tagName.toLowerCase()) {
            case "input":
                switch (element.type) {
                case "checkbox":

                    // If the key value is a bool the checkbox should
                    // present that bool, instead of expecting an
                    // array of values.
                    if (typeof template._getDataSource().getValue(keyPath) === "boolean") {
                        addEvent(element, "click", function () {
                            setValue(this.checked);
                        });
                    } else {
                        addEvent(element, "click", setValueNone);
                    }
                    break;
                case "radio":
                    var elements = [element];
                    if (element.form) {
                        elements = element.form[element.name];
                    }
                    function f() {
                        setValue(Element.getValue(this));
                    }
                    for (var i = 0; i < elements.length; i++) {
                        addEvent(elements[i], "click", f);
                    }
                case "text":
                case "password":
                    var f = element.onchange;
                    addEvent(element, "change", setValueNone);
                    break;
                case "button":
                case "submit":
                    addButtonEvent();
                    break;
                }
                break;
            case "select":
                addEvent(element, "change", setValueNone);
                break;
            case "button":
                addButtonEvent();
                break;
            case "textarea":
                addEvent(element, "change", setValueNone);
                break;
            }
        },
        /**
         * Adds a value transformer or replaces an existing one.
         */
        setValueTransformer : function (option) {
            this.valueTransformers.add(option);

            // If a value transformer is added/modified when a data source
            // binding exists the value is updated immediately.
            if (!this.hasDataSource()) {
                return;
            }
            if (option.selector) {
                this._updateElements($(option.selector, this.getRootElement()));
            } else if (option.keyPath) {
                this.update(option.keyPath);
            }
        },
        /**
         * Sets up a listener for the given data source and updates the DOM with
         * the new data. If a data source already exists, the attached listeners
         * are removed before the new ones are attached.
         *
         * @param KeyValueCoding dataSource
         */
        bindTo : function (dataSource) {
            if (this.hasDataSource()) {
                this._getDataSource().removeSubscriber (this, "ValueChanged");
            }

            if (!KVC.implementsInterface(dataSource)) {
                throw new Error("Supplied data source is not KVC compliant.");
            }

            this._setDataSource(dataSource);
            this.valueTransformers.bindTo(dataSource);
            this._getDataSource().subscribe("ValueChanged", this);
            this.refresh();
            this._triggerOnBound();
        },
        /**
         * Updates the DOM for a specific key path.
         *
         * @param string keyPath
         */
        update : function (keyPath) {
            this._setValue(keyPath, this._getDataSource().getValue(keyPath));
        },
        /**
         * Sets the given value to the given key path in the DOM. Uses
         * DOM.Element to support different kinds of elements.
         * If the template does not have the given key path, no action is taken.
         * Does not set the value if the key path contains a function.
         *
         * @param string keyPath
         * @param mixed value
         */
        _setValue : function (keyPath, value) {
            this._setClassNameCondition(keyPath);

            if (!(keyPath in this.elements)) {
                return;
            }

            if (value instanceof Function) {
                return;
            }

            if (!this.mayWriteToView(keyPath)) {
                return;
            }

            var transformedValue =
                this.valueTransformers.transformForKeyPath(keyPath,
                                                           value);

            for (var i = 0; i < this.elements[keyPath].length; i++) {
                var element = this.elements[keyPath][i];
                var selectorTransformedValue =
                    this.valueTransformers.transformForElement(
                        element,
                        transformedValue);

                // null will be printed as the empty string, to make the behavior
                // consistent between browsers (IE prints as "null", others print as "").
                if (selectorTransformedValue === null) {
                    selectorTransformedValue = "";
                }
                if (this._elementHasWidget(element)) {
                    this._getWidgetByElement(element).setValue(
                        selectorTransformedValue);
                } else {
                    Element.setValue(element,
                                     selectorTransformedValue);
                }
            }
        },
        /**
         * The template must be bound to a data source for this method to work.
         *
         * @param HTMLElement element
         *   An element in the template that has a matching key path.
         * @return string
         *   The matching key path.
         */
        _findKeyPathForElement : function (element) {
            if (!this.hasDataSource()) {
                throw new Error("Template:_findKeyPathForElement: "
                                + "Template not bound to a data source.");
            }
            // Look up the value in the dictionary.
            for (var keyPath in this.elements) {
                for (var i = 0; i < this.elements[keyPath].length; i++) {
                    if (this.elements[keyPath][i] === element) {
                        return keyPath;
                    }
                }
            }
            throw new Error("Template:_findKeyPathForElement: "
                            + "Could not find key path for element "
                            + "&lt;%s class=\"%s\"&gt;".format(element.tagName,
                                                         element.className));
        },
        /**
         * @param Array[HTMLElement] elements
         *   Elements in the table to update values for, using both key path
         *   transformers and selector transformers.
         */
        _updateElements : function (elements) {
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                var vt = this.valueTransformers;

                var keyPath = this._findKeyPathForElement(element);
                var value = this._getDataSource().getValue(keyPath);
                value = vt.transformForKeyPath(keyPath, value);
                value = vt.transformForElement(element, value);
                Element.setValue(element, value);
            }
        },
        /**
         * Updates the html element correspending to
         * an updated value in the KVC structure.
         *
         * @param KeyValueCoding object
         *   The updated object.
         * @param string keyPath
         *   The path to the value that changed
         */
        onValueChangedTriggered : function (object, keyPath) {
            this._setValue(keyPath, object.getValue(keyPath));

            // Find all keypaths that have keyPath as their prefix and update
            // them as well.
            for (var kP in this.elements) {
                // If kP is a prefix of keyPath it needs to be updated.
                if (keyPath === kP.substring(0, keyPath.length)) {
                    this.update(kP);
                }
            }
        },
        /**
         * Copies the template and returns the new instance.
         * The new instance will not be bound to any data object.
         *
         * @return Template
         */
        _clone : function () {
            var newTemplate
                = new Template(this.getRootElement().cloneNode(true));

            // Class name prefix.
            newTemplate.setClassNamePrefix(this.classNamePrefix);

            // Value transformers.
            newTemplate.valueTransformers =
                this.valueTransformers.clone(newTemplate.getRootElement());

            // Skip key paths.
            newTemplate.__setSkipKeyPaths(Array.clone(this.skipKeyPaths));

            // Modes.
            for (var p in this.modes) {
                newTemplate.setMode(p, this.modes[p]);
            }

            // Widgets.
            for (var i = 0; i < this.widgets.length; i++) {
                var settings = this.widgets[i];
                newTemplate.addWidget(settings.selector,
                                      settings.widget.clone());
            }

            // Class name conditions.
            for (var keyPath in this.classNameConditions) {
                var conditions = this.classNameConditions[keyPath];
                for (var i = 0; i < conditions.length; i++) {
                    var v = conditions[i];
                    newTemplate.addClassNameCondition(keyPath,
                                                      v.className,
                                                      v.negate);

                }
            }

            // Event bindings.
            newTemplate.createEventBindings(this.eventBindings);

            newTemplate.setOnBound(this.onBound);

            return newTemplate;
        },
        /**
         * @type Array
         */
        eventBindings : null,
        /**
         * Stores settings for binding events.
         *
         * Note: The event bindings are not attached until the template is bound
         * to a KVC object.
         *
         * @param Array[Hash] bindings
         *   See documentation for AbstractTemplate:createEventBindings.
         */
        createEventBindings : function (bindings) {
            if (!(bindings instanceof Array)) {
                throw new Error("MVC.View.Template:createEventBindings:" +
                    "Argument to createEventBindings is not an array.");
            }

            this.eventBindings = bindings;
            if (this.hasDataSource()) {
                this._attachEventBindings();
            }
        },
        /**
         * Attaches the events to the current data source.
         */
        _attachEventBindings : function () {
            this._detachEventBindings();
            for (var i = 0; i < this.eventBindings.length; i++) {
                var binding = this.eventBindings [i];

                if (!binding.callback && !binding.method) {
                    throw new Error("callback or method has to be specified");
                }

                // The element to add the event to.
                //
                // Special case, if "root" is the selector the root element of
                // the template is the chosen element.
                var element;
                if (binding.selector === "root") {
                    element = this.getRootElement();
                } else {
                    element = $f(binding.selector, this.getRootElement());
                }

                if (element === null) {
                    throw new Error("MVC.View.Template:_attachEventBindings: There is no element with " +
                                    "the selector " + binding.selector);
                }

                // The type of event.
                if (!binding.event) {
                    binding.event = "click";
                }
                var callback;
                if (binding.callback) {
                    // Use a function as callback.
                    callback = binding.callback;
                } else if (binding.method) {
                    // Use a method on the dataSource as callback.
                    var dataSource = this._getDataSource();
                    var func = dataSource.getValue (binding.method);
                    if (!(func instanceof Function)) {
                        throw new Error(
                            "The dataSource has no method by the name "
                                + binding.method);
                    }

                    callback = func.bind (dataSource);
                } else {
                    throw new Error ("Unreachable code");
                }

                this.bindingEventManager.add(element, binding.event, callback);
            }
        },
        /**
         * Removes all events added by _attachEventBindings.
         */
        _detachEventBindings : function () {
            this.bindingEventManager.detach();
        },
        /**
         * Removes all attached write events.
         */
        _detachWriteEvents : function () {
            this.writeEventManager.detach();
        },
        /**
         * @param string prefix
         */
        setClassNamePrefix : function (prefix) {
            this.classNamePrefix = prefix;
        },

        // Widgets.
        /**
         * @type Array
         *   Stores the associations between selectors and widgets.
         */
        widgets : null,
        /**
         * Adds a widget to the template. It will take control over the
         * specified key path (or selector and the associated DOM node.
         *
         * Cloning the template will clone the widgets as well.
         *
         * @param string selector
         * @param Widget widget
         */
        addWidget : function (selector, widget) {
            var widgetRoot = $f(selector, this.getRootElement());

            if (!widgetRoot) {
                throw new Error("Template:addWidget: Need a selector %s."
                                .format(selector));
            }

            widget.bindTo(widgetRoot);
            this.widgets.push({
                selector : selector,
                widget : widget,
                element : widgetRoot
            });

            if (this.hasDataSource()) {
                var keyPath = this._findKeyPathForElement(widgetRoot);
                widget.setValue(
                    this._getDataSource().getValue(keyPath));
            }
        },
        /**
         * @param HTMLElement element
         * @return boolean
         *   Whether an element is owned by a widget.
         */
        _elementHasWidget : function (element) {
            for (var i = 0; i < this.widgets.length; i++) {
                var widgetElement = this.widgets[i].element;
                if (element === widgetElement) {
                    return true;
                }
            }
        },
        /**
         * Finds the widget that owns the specified element, throws an error
         * if the element isn't found, you can check if it exists by using
         * _elementHasWidget.
         *
         * @param HTMLElement element
         * @return Widget
         */
        _getWidgetByElement : function (element) {
            for (var i = 0; i < this.widgets.length; i++) {
                var widgetElement = this.widgets[i].element;
                var widget = this.widgets[i].widget;
                if (element === widgetElement) {
                    return widget;
                }
            }
            throw new Error("Template:_getWidgetByElement: The specified " +
                            "element has no widget associated with it.");
        },

        // Class name conditions.
        /**
         * @type Hash<string keyPath, string className>
         */
        classNameConditions : null,
        /**
         * Adds a rule saying that the given class name should be present on
         * the template's root whenever the value of the keyPath is also true.
         * To show the class name only when the value is false, the negate
         * argument can be set to true.
         *
         * @param string keyPath
         *   Where to look for the boolean.
         * @param string className
         *   The class name to add and remove, depending on the key path value.
         * @param optional boolean negate = false
         *   Whether the value of the key path should be negated.
         */
        addClassNameCondition : function (keyPath, className, negate) {
            negate = !!negate;

            if (!(keyPath in this.classNameConditions)) {
                this.classNameConditions[keyPath] = [];
            }

            this.classNameConditions[keyPath].push({
                className : className,
                negate : negate
            });

            if (this.hasDataSource()) {
                this._setClassNameCondition(keyPath);
            }
        },
        /**
         * Checks all added conditions and adds the appropriate class names.
         */
        _attachClassNameConditions : function () {
            for (var keyPath in this.classNameConditions) {
                if (this.classNameConditions.hasOwnProperty(keyPath)) {
                    this._setClassNameCondition(keyPath);
                }
            }
        },
        /**
         * Given a key path, checks whether the key path is a part of a
         * classNameCondition, and if so sets or removes the class name
         * depending on the key path's value and the negate flag.
         *
         * @param string keyPath
         */
        _setClassNameCondition : function (keyPath) {
            for (var p in this.classNameConditions) {
                if (this._keyPathHasPrefixExclusive(p, keyPath)) {
                    this._setClassNameCondition(p);
                }
            }
            if (!(keyPath in this.classNameConditions)) {
                return;
            }

            var conditions = this.classNameConditions[keyPath];

            var root = this.getRootElement();
            for (var i = 0; i < conditions.length; i++) {
                var condition = conditions[i];

                var className = condition.className;
                var negate = condition.negate;
                // Negates the result if negation was specified.
                if (this._getDataSource().getValue(keyPath) !== negate) {
                    ClassNames.add(root, className);
                } else {
                    ClassNames.del(root, className);
                }
            }
        },
        skipKeyPaths : null,
        __setSkipKeyPaths : function (skipKeyPaths) {
            this.skipKeyPaths = skipKeyPaths;
        },
        __shouldSkipKeyPath : function (keyPath) {
            return Collection.hasValue(this.skipKeyPaths, keyPath);
        },
        onBound : Function.empty,
        _triggerOnBound : function () {
            this.onBound(this, this._getDataSource());
        },
        /**
         * Sets a function that triggers any time the template is bound to a
         * KVC data source.
         *
         * @param Function func
         *          @param Template template
         *          @param KVC dataSource
         */
        setOnBound : function (func) {
            this.onBound = func;
        },
        /**
         * @type Map<string keyPath, enum{"both","read","write"}>
         */
        modes : null,
        /**
         * @param string keyPath
         * @param enum{"both","read","write"} mode
         */
        setMode : function (keyPath, mode) {
            this.modes[keyPath] = mode || "both";
        },
        /**
         * @return enum{"both","read","write"}
         */
        getMode : function (keyPath) {
            return this.modes[keyPath] || "both";
        },
        /**
         * @param string keyPath
         * @return boolean
         */
        mayWriteToModel : function (keyPath) {
            var mode = this.getMode(keyPath);
            return mode === "write" || mode === "both";
        },
        /**
         * @param string keyPath
         * @return boolean
         */
        mayWriteToView : function (keyPath) {
            var mode = this.getMode(keyPath);
            return mode === "read" || mode === "both";
        }
    };

    Template.extend(AbstractTemplate);

    /**
     * A cleaner way of setting up templates.
     *
     * @param HTMLElement/string/Template
     * @param optional Hash settings = {}
     *   See Options defintion below.
     * @return Template
     */
    Template.create = function (source, settings) {
        if (!source) {
            throw new Error("Template source is null or undefined");
        }

        var options = new Options({
            type : {
                eventBindings : { defaultValue : [], type : [{
                    event : { defaultValue : "click", type : "string" },
                    selector : { type : "string" },
                    method : { required : false, type : "string" },
                    callback : { required : false, type : Function }
                }]},
                classNameConditions : {
                    required : false,
                    defaultValue : [],
                    type : [{
                        keyPath : { type : "string" },
                        className : { type : "string" },
                        negate : { type : "boolean", required : false, defaultValue : false }
                    }]
                },
                classNamePrefix : { defaultValue : "", type : "string" },
                modes : { required : false, defaultValue : [], type : [{
                    keyPath : { type : "string" },
                    mode : { type : "string" }
                }]},
                valueTransformers : {
                    defaultValue : [],
                    type : [{
                        // Must specify keyPath xor selector.
                        keyPath : { required : false, type : "string" },
                        selector : { required : false, type : "string" },
                        transform : { required : false, type : Function },
                        reverse : { required : false, type : Function }
                    }]
                },
                onBound : { type : Function, required : false },
                skipKeyPaths : { type : ["string"], required : false },
                kvcBinding : { type : Object, required : false },
                widgets : { defaultValue : [], type : [{
                    selector : { type : "string" },
                    widget : { type : Widget }
                }]}
            }
        });
        settings = options.parse(settings);

        var template;
        if (source instanceof Template) {
            template = source._clone();
        } else if (typeof source === "string") {
            var el = tag("div");
            var selector;
            if (/^<tr/.test(source)) {
                el.innerHTML = "<table><tbody>%s</tbody></table>"
                               .format(source);
                selector = "tr";
            } else if (/^<option/.test(source)) {
                el.innerHTML = "<select>%s</select>".format(source);
                selector = "option";
            } else {
                el.innerHTML = source;
                selector = "*"
            }
            template = new Template($f(selector, el));
        } else if ("tagName" in source) {
            template = new Template(source);
        }

        if (!template) {
            throw new Error("Invalid template source specified");
        }

        if (settings.classNamePrefix) {
            template.setClassNamePrefix(settings.classNamePrefix);
        }
        var v = settings.valueTransformers;
        for (var i = 0; i < v.length; i++) {
            if ("keyPath" in v[i]) {
                template.setValueTransformer({
                    keyPath : v[i].keyPath,
                    transform : v[i].transform,
                    reverse : v[i].reverse
                });
            } else if ("selector" in v[i]) {
                template.setValueTransformer({
                    selector : v[i].selector,
                    transform : v[i].transform,
                    reverse : v[i].reverse
                });
            } else {
                throw new Error("Value transformers must have a key path or selector.");
            }
        }
        var v = settings.classNameConditions;
        for (var i = 0; i < v.length; i++) {
            template.addClassNameCondition(v[i].keyPath, v[i].className, v[i].negate);
        }
        var v = settings.widgets;
        for (var i = 0; i < v.length; i++) {
            template.addWidget(v[i].selector, v[i].widget);
        }
        if (settings.eventBindings.length > 0) {
            template.createEventBindings(settings.eventBindings);
        }
        if (settings.skipKeyPaths) {
            template.__setSkipKeyPaths(settings.skipKeyPaths);
        }
        if (settings.onBound) {
            template.setOnBound(settings.onBound);
        }
        for (var i = 0; i < settings.modes.length; i++) {
            template.setMode(settings.modes[i].keyPath, settings.modes[i].mode);
        }
        // Note: Binding has to occur last if all options should
        // be immediately taken into account.
        if (settings.kvcBinding) {
            var v = settings.kvcBinding;
            template.bindTo(v);
        }

        return template;
    };

    return Template;
})();
