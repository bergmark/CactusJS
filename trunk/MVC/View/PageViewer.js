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
 * Provides a list of pages for a PaginationDecorator and lets the user toggle
 * between them using links with onclicks. The specified HTML List will be owned
 * by the Page Viewer.
 *
 * An "active" class name is set on the currently active page.
 */
Cactus.MVC.View.PageViewer = (function () {
    var log = Cactus.Dev.log;
    var tag = Cactus.DOM.tag;
    var Events = Cactus.DOM.Events;
    var ClassNames = Cactus.DOM.ClassNames;

    function PageViewer (paginator, htmlList) {
        this.paginator = paginator;
        this.htmlList = htmlList;
        this.paginator.subscribe("PageChanged", this);
        this.paginator.subscribe("PageCountUpdated", this);
        this._refresh();
    } PageViewer.prototype = {
        /**
         * @type ArrayControllerDecorator
         *   Can either by a Paginator or an ArrayControllerDecorator
         *   with a Paginator component (this works because of the Chain of
         *   responsibility implementation).
         */
        paginator : null,
        /**
         * @type HTMLListElement htmlList
         */
        htmlList : null,
        /**
         * Empties the HTML list and creates new contents.
         */
        _refresh : function () {
            this.htmlList.innerHTML = "";
            var activePage = this.paginator.getPage();
            for (var i = 0; i < this.paginator.getPageCount(); i++) {
                this._addListElement (i);
            }
        },
        /**
         * Adds a list element with a link to toggle to the given page.
         * The link's text will be the page+1, meaning page numbering starts
         * from 1. The onclick of a link inside the LI is set.
         *
         * @param natural page
         *   The page the list element should be associated with.
         */
        _addListElement: function (page) {
            var li = tag ("li", null, tag ("a", {
                href : "#"
            }, page + 1));

            if (page === this.paginator.getPage()) {
                ClassNames.add (li, "active");
            }

            Events.add (li, "click", this.paginator.setPage.bind (this.paginator, page));

            this.htmlList.appendChild (li);
        },
        /**
         * Updates the list to display the correct active page.
         *
         * @param PaginationDecorator paginator
         * @param natural page
         * @param natural oldPage
         */
        onPageChangedTriggered : function (paginator, page, oldPage) {
            ClassNames.del (this.htmlList.childNodes [oldPage], "active");
            ClassNames.add (this.htmlList.childNodes [page], "active");
        },
        /**
         * Updates the list to display the correct number of pages.
         *
         * @param PaginationDecorator paginator
         * @param natural pageCount
         * @param natural oldPageCount
         */
        onPageCountUpdatedTriggered : function (paginator, pageCount, oldPageCount) {
            if (pageCount < oldPageCount) {
                this.htmlList.removeChild (this.htmlList.lastChild);
            } else {
                this._addListElement (pageCount - 1);
            }
        }
    };

    return PageViewer;
})();
