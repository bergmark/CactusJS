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
 * Provides simple CSS selector functionality. The selector works similarily to
 * other js libraries implementations. Selectors are often named $, and by
 * convention this is also the case when using DOM.select.
 *
 * Usage:
 * The selector is always a string, depending on the prefix
 * character, different behavior occurs:
 * # - gets an element with the id specified
 * . - gets all elements with the class name (uses DOM.ClassNames)
 * none - treats the substring as a tag name.
 *
 * You can chain selectors like in css, for instance "#foo div .bar" first gets
 * the element with id "foo", then all children of foo that are divs, and
 * finally all children of the divs that have "bar" as their class name.
 * The .bar elements are then returned.
 *
 * Note: A list is always returned, even if an element is fetched by ID.
 * Also see selectFirst.
 *
 * If the Sizzle library is included (either directly or through jQuery),
 * select will use it instead. Client code inside the framewrok may not make any
 * assumptions regarding the selector interface that aren't explicitly
 * documented here.
 */
Cactus.DOM.select = (function () {
    var ClassNames = Cactus.DOM.ClassNames;
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;

    // Use Sizzle or jQuery if available.
    if ("Sizzle" in window) {
        return Sizzle;
    }
    if ("jQuery" in window) {
        return jQuery;
    }

    /**
     * @param string selector
     * @param optional HTMLElement/Array<HTMLElement> parent = document.body
     * @return Array
     */
    function select (selector, parent) {
        parent = parent || document.documentElement;
        var elements = [];
        var parents;
        if (Collection.isCollection (parent)) {
            parents = Collection.coerce (parent);
        } else {
            parents = [parent];
        }
        var selectors = selector.split(" ");
        selector = selectors.shift();

        var prefix = selector.charAt (0);
        var text   = selector.substr (1);
        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];
            switch (prefix) {
            // Fetch by ID.
            case "#":
                if (parent === document
                    || parent === document.documentElement) {
                    var element = document.getElementById(text);
                    if (element) {
                        elements = [element];
                    } else {
                        elements = [];
                    }
                } else {
                    var all = parent.getElementsByTagName ("*");
                    for (var j = 0; j < all.length; j++) {
                        if (all[j].id === text) {
                            elements.push(all[j]);
                        }
                    }
                }
                break;
            // Fetch by class name.
            case ".":
                var all = parent.getElementsByTagName("*");
                for (var j = 0; j < all.length; j++) {
                    if (ClassNames.has(all[j], text)) {
                        elements.push(all[j]);
                    }
                }
                break;
            // Fetch by tag name.
            default:
                var coll = parent.getElementsByTagName(selector);
                elements = elements.concat(Collection.coerce(coll, true));
                break;
            }
        }

        if (!selectors.length) {
            return elements;
        }

        return select (selectors.join(" "), elements);
    }

    return select;
})();
