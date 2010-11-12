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
 * Generates a "comparator function" for a sequence of KeyValueCoding key paths.
 * A comparator function takes two KVC objects as arguments and compares them,
 * returning -1, 0, or 1 depending on the result. This is the same format that
 * Array:sort expects.
 *
 * The obvious usages that come to mind are to sort arrays, and for use with
 * the SortDecorator.
 *
 * Example usage:
 * function Book(author, title) {
 *     this.author = author;
 *     this.title = title;
 * }
 * KVC.implement(Book);
 * var array = [
 *     new Book("Martin Fowler", "Refactoring"),
 *     new Book("Martin Fowler", "Analysis Patterns"),
 *     new Book("Kent Beck", "XP Explained")
 * ];
 * var comparator = generateComparator("author", "title");
 * array.sort(comparator);
 * a; // => [
 *     Book... "Analysis Patterns",
 *     Book... "Refactoring",
 *     Book... "XP Explained"
 * ];
 */
Cactus.Util.generateComparator = (function () {
    var log = Cactus.Dev.log;

    /**
     * @param primitive a
     * @param primitive b
     * @return integer in {-1, 0, 1}
     */
    function cmp(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }

    /**
     * @param string *keyPaths
     *   The key paths to sort after. The sorting is performed on the key paths
     *   from left to right, meaning the leftmost one will be the main criteria
     *   and latter ones will only be compared if the previous ones are equal.
     *   Note: The comparison is only defined for key paths containing primitive
     *   values.
     * @return Function
     *         @param KeyValueCoding a
     *         @param KeyValueCoding b
     *         @return integer in {-1,0,1}
     */
    function generateComparator(keyPath) {
        var args = arguments;
        return function (a, b) {
            var result;
            for (var i = 0; i < args.length; i++) {
                result = cmp(a.getValue(args[i]),
                             b.getValue(args[i]));
                if (result !== 0) {
                    return result;
                }
            }
            return result;
        };
    }

    return generateComparator;
})();
