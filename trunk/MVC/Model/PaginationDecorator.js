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
 * PaginationDecorator (or paginator) decorates an ArrayController by dividing
 * its contents into different pages. The obvious usage for a paginator is to
 * enable the presentation lots of data, a little bit at a time.
 *
 * Assume we have an ArrayController containing 50 items. We can create a
 * paginator with new PaginatonDecorator (component, 10); in order to create
 * 5 pages, each containing 10 items. We can then change pages by calling
 * setPage (n) where n is 0..4. In this case the paginator sends out an
 * onObjectRearrange event since only new objects will be shown. The paginator
 * allows a client programmer to not worry about which page is active and he can
 * choose to display only the data currently "in" the paginator.
 *
 * A different graphical component may be used to control the changing between
 * pages.
 *
 * It's also possible to use a paginator to only show one object at a time, just
 * set objectsPerPage to 1. This could be useful for a master/detail interface.
 */
Cactus.MVC.Model.PaginationDecorator = (function () {
    var ArrayControllerDecorator = Cactus.MVC.Model.ArrayControllerDecorator;
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var Range = Cactus.Util.Range;
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;
    /**
     * @param ArrayController component
     * @param positive objectsPerPage = 10
     *   The amount of objects to make available at a time.
     * @param natural page = 0
     *   The page to show when the object initializes.
     */
    function PaginationDecorator (component, objectsPerPage, page) {
        ArrayControllerDecorator.call(this, component);
        this.setObjectsPerPage (objectsPerPage || this.objectsPerPage);
        this.setPage (page || this.page);
        this._setObjects();
    } PaginationDecorator.prototype = {
        // Events.
        /**
         * Passed out when one or more pages are added or removed.
         *
         * @param natural pageCount
         *   The new pageCount.
         * @param natural oldPageCount
         *   The previous pageCount.
         */
        onPageCountUpdated : Function.empty,
        /**
         * Triggered when the page is changed,
         * page will never be equal to oldPage.
         *
         * @param natural page
         *   The current page.
         * @param natural oldPage
         *   The previous page.
         */
        onPageChanged : Function.empty,

        /**
         * @type positive
         */
        objectsPerPage : 10,
        /**
         * @type natural
         */
        page : 0,
        /**
         * @type natural
         */
        pageCount : 0,
        /**
         * The indices on the component that are in the
         * pagination decorators collection.
         *
         * @type Util.Range
         */
        parentIndexRange : null,
        /**
         * Setter for objectsPerPage. It changes objects if necessary.
         *
         * @param positive amount
         *   The amount of objects to fit inside a page.
         */
        setObjectsPerPage : function (amount) {
            if (amount !== this.getObjectsPerPage()) {
                this.objectsPerPage = amount;
                this._setObjects();
                this.onObjectRearrange();
            }
        },
        /**
         * @return positive
         */
        getObjectsPerPage : function () {
            return this.objectsPerPage;
        },
        /**
         * Changes the active page. Sends out onPageChanged and
         * onObjectRearrange if necessary.
         *
         * @param natural page
         *   The number of the page to show.
         * @throws Error
         *   If the specified page is out of bounds.
         */
        setPage : function (page) {
            // the page can always be zero since zero is used if the list is
            // empty.
            if (page !== 0 && (page < 0 || page >= this.getPageCount())) {
                throw new Error ("Specified page (" + page + ") is out of bounds");
            }
            // No need to change the page if the the new page matches the active
            // one.
            if (page === this.getPage()) {
                return;
            }

            var oldPage = this.getPage();
            this.page = page;
            this._setObjects();
            this.onPageChanged (this.getPage(), oldPage);
            this.onObjectRearrange();
        },
        /**
         * Getter for page
         *
         * @return natural
         */
        getPage : function () {
            return this.page;
        },
        /**
         * Calculates the amount of available pages based on the amount of
         * objects the component contains.
         *
         * @return boolean
         *   Whether the page count changed.
         */
        _setPageCount : function () {
            var oldPageCount = this.pageCount;
            this.pageCount = Math.ceil (this.component.count() /
                                        this.getObjectsPerPage());
            // There has to be at least one page.
            this.pageCount = Math.max (1, this.pageCount);

            // If the page  count has changed we have  to pass out the
            // event, and change  the page if the current  page is out
            // of bounds.
            if (oldPageCount === this.pageCount) {
                return false;
            }

            // If there are no pages with objects, we show page 0,
            // and it'll be empty.
            if (this.getPageCount() === 0) {
                this.setPage(0);
            } else if (this.getPage() >= this.getPageCount()) {
                // Current page out of bounds, so it's changed to the
                // previous one.
                this.setPage(this.pageCount - 1);
            }
            this.onPageCountUpdated (this.pageCount, oldPageCount);
            return true;
        },
        /**
         * Gets the amount of available pages.
         *
         * @return natural
         */
        getPageCount : function () {
            return this.pageCount;
        },
        /**
         * Sets the correct range for componentIndexRange, the range contains
         * all indices on the component whose objects are on the current page.
         */
        _setComponentIndexRange : function () {
            var start = this.getPage() * this.getObjectsPerPage();
            var end   = start + this.getObjectsPerPage() - 1;
            this.componentIndexRange = new Range (start, end);
        },
        /**
         * Sets the pageCount and the componentIndexRange and finally retrieves
         * all objects for the actual page from the component. This method does
         * not trigger any events, so methods using this method must decide if
         * this is necessary.
         */
        _setObjects : function () {
            this._setPageCount();
            this._setComponentIndexRange();
            this.objects = this.component.getRange(this.componentIndexRange);
        },
        /**
         * Checks if a given index on the component is inside the current page.
         *
         * @param natural componentIndex
         * @return boolean
         */
        _indexIsInsidePage : function (componentIndex) {
            return this.componentIndexRange.includes (componentIndex);
        },
        /**
         * Checks if the current page is full, which it always will be unless
         * the last page is the active one, and it isn't full of course.
         *
         * @return boolean
         *   Whether the page is full.
         */
        _pageIsFull : function () {
            return this.objects.length === this.getObjectsPerPage();
        },
        /**
         * Converts a component index to the index in the paginator's
         * collection.
         *
         * @param natural componentIndex
         * @return natural
         */
        _convertIndex : function (componentIndex) {
            return componentIndex - this.componentIndexRange.getStart();
        },
        /**
         * Converts an index on the paginator into the corresponding index on
         * the component.
         *
         * @param natural index
         * @return natural
         */
        _convertIndexToComponent : function (index) {
            return index + this.componentIndexRange.getStart();
        },
        /**
         * Whether an index on the component is inside the current page.
         *
         * @param natural componentIndex
         * @return boolean
         */
        _isComponentIndexInPage : function (componentIndex) {
            var index = this._convertIndex (componentIndex);
            return index >= 0 && index < this.getObjectsPerPage();
        },
        /**
         * Swaps two elements, they must both be inside the current page.
         *
         * @param natural indexA
         * @param natural indexB
         */
        swap : function (indexA, indexB) {
            // Fetch the indexes on the component and swap them.
            this.getComponent().swap (this._convertIndexToComponent (indexA), this._convertIndexToComponent (indexB));
        },
        /**
         * Adds an object to a specific index inside the page, elements to the
         * right will be shifted.
         *
         * @param natural index
         * @param mixed object
         */
        addAtIndex : function (index, object) {
            if (!this.hasIndex (index)) {
                throw new Error ("Invalid index supplied");
            }

            this.getComponent().addAtIndex (this._convertIndex (index), object);
        },
        /**
         * Triggered when an object is added on the component. The method makes
         * sure that objects added to the page make the active items shift to
         * the right, and a new object on the active page is inserted.
         * Nothing has to happen if the object is on page later than the active
         * one.
         *
         * @param ArrayController component
         * @param natural index
         */
        onObjectAddedTriggered : function (component, index) {

            this._setPageCount();

            if (index > this.componentIndexRange.getEnd()) {
                return;
            }

            var pageFullBeforeAdd = this._pageIsFull();

            // The object is added to the current page or preceeding
            // pages, so we need to add it to the correct position and
            // shift the succeeding elements one step to the right.
            var lastObject = this.objects.length === 0 ? null : Collection.last (this.objects);
            this._setObjects();
            // If the last object was shifted out of the page we need
            // to send an onRemove event.
            if (pageFullBeforeAdd &&
                lastObject !== this.objects[this.getObjectsPerPage() - 1]) {

                this.onObjectRemoved (lastObject, this.objects.length - 1);
            }
            this.onObjectAdded (this._convertIndex (index));
        },
        /**
         * Triggered when an object is removed from the component.
         *
         * @param ArrayController component
         * @param mixed object
         *   The object removed from the component.
         * @param natural componentIndex
         *   The index the object was removed from on the component.
         */
        onObjectRemovedTriggered : function (component, object, componentIndex) {
            var that = this;
            /*
             * When an object is removed there are three cases for the
             * removed object:
             * 1. It was located past the end of page, in which case we do
             *    nothing.
             * 2. It was located before the start of the page, in which
             *    case we shift all elements to the left, removing the
             *    first one, and adding a new last element, if one is
             *    available.
             * 3. The only element on the current page was removed, so we change
             *    the current page to the previous one.
             * 4. It was located inside the page in which case we remove it,
             *    shifting the elements after it to the left, and then we add
             *    a new element to the end of the collection (the first one of
             *    the next page, if you will).
             */
            var previousPage = this.getPage();
            var pageCountChanged = this._setPageCount();
            var pageChanged = previousPage !== this.getPage();
            var isLastPage = this.getPage() === this.getPageCount() - 1;

            // 1.
            if (componentIndex > this.componentIndexRange.getEnd()) {
                return;
            }

            function canAddObjectToEnd () {
                // Since the component has removed the object already, the last
                // element of componentIndexRange on the component will be an
                // element not on the current page, so here we check that such
                // an element exists (it won't if the current page is the last
                // one.)
                return component.hasIndex (that.componentIndexRange.getEnd());
            }
            function addToEnd () {
                that.objects.push (component.get (that.componentIndexRange.getEnd()));
                that.onObjectAdded (that.objects.length - 1);
            }

            // 2.
            if (componentIndex < this.componentIndexRange.getStart()) {
                var removedObject = this.objects.shift();
                this.onObjectRemoved (removedObject, 0);
                if (canAddObjectToEnd()) {
                    addToEnd();
                }

                return;
            }

            // 3.
            if (pageCountChanged && isLastPage & pageChanged) {
                this.onObjectRemoved (object, index);
                return;
            }

            // 4.
            var index = Array.remove (this.objects, object);
            this.onObjectRemoved (object, index);
            if (canAddObjectToEnd()) {
                addToEnd();
            }
            return;
        },
        /**
         * Triggered when two objects swap places on the component.
         *
         * @param ArrayController component
         * @param natural indexA
         * @param natural indexB
         */
        onObjectSwapTriggered : function (component, indexA, indexB) {
            /*
             * Three cases:
             * 1. None of the indices are inside the current page, in this case
             *    nothing needs to be done.
             * 2. Both objects are in the array, swap them.
             * 3. Only one object is inside the array, replace that one with
             *    the other one.
             */

            var indexAInPage = this._isComponentIndexInPage (indexA);
            var indexBInPage = this._isComponentIndexInPage (indexB);
            var indexAOnDecorator = this._convertIndex (indexA);
            var indexBOnDecorator = this._convertIndex (indexB);
            // Indexes are shifted here because the component has already
            // swapped the elements.
            var objectA = this.getComponent().get (indexB);
            var objectB = this.getComponent().get (indexA);

            // 1.
            if (!indexAInPage && !indexBInPage) {
                return;
            }

            // 2.
            if (indexAInPage && indexBInPage) {
                var tmp = this.get (indexAOnDecorator);
                this.objects [indexAOnDecorator] = this.get (indexBOnDecorator);
                this.objects [indexBOnDecorator] = tmp;
                this.onObjectSwap (Math.min (indexAOnDecorator, indexBOnDecorator), Math.max (indexAOnDecorator, indexBOnDecorator));
                return;
            }

            // 3.
            if (indexAInPage) {
                ArrayController.prototype.replace.call (this, objectA, objectB);
            } else {
                ArrayController.prototype.replace.call (this, objectB, objectA);
            }
        },
        /**
         *
         *
         * @param ArrayController component
         * @param natural index
         * @param mixed oldObject
         * @param mixed newObject
         */
        onObjectReplacedTriggered : function (component, index, oldObject, newObject) {
            if (!this._indexIsInsidePage (index)) {
                return;
            }

            ArrayController.prototype.replace.call (this, oldObject, newObject);
        }
    };

    PaginationDecorator.extend (ArrayControllerDecorator);

    // add CoR methods to ACD.
    ArrayControllerDecorator.createChainOfResponsibilityMethods (
        "setObjectsPerPage",
        "getObjectsPerPage",
        "setPage",
        "getPage",
        "getPageCount"
    );

    return PaginationDecorator;
})();
