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

Cactus.UnitTest.Util.generateComparator = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var generateComparator = Cactus.Util.generateComparator;
    var gen = generateComparator;
    var KVC = Cactus.Util.KeyValueCoding;

    function Book(author, title) {
        this.author = author;
        this.title = title;
    } Book.prototype = {
        author : "",
        title : ""
    };
    KVC.implement(Book);


    var tc = new TestCase("Util.generateComparator");

    // Generate a comparator for a single key path.
    tc.addTest(function () {
        var beck = new Book("Beck");
        var fowler = new Book("Fowler");

        var authorComp = gen("author");

        this.assertEqual(0, authorComp(fowler, fowler));
        this.assertEqual(1, authorComp(fowler, beck));
        this.assertEqual(-1, authorComp(beck,  fowler));
    });

    // Generate for multiple key paths.
    tc.addTest(function () {
        var beckTDD = new Book("Beck", "TDD by Example");
        var beckXP = new Book("Beck", "XP explained");
        var fowlerPoEAA = new Book("Fowler", "PoEAA");
        var fowlerAnalysis = new Book("Fowler", "Analysis Patterns");

        var comp = gen("author", "title");
        this.assertEqual(0, comp(beckTDD, beckTDD));
        this.assertEqual(-1, comp(beckTDD, beckXP));
        this.assertEqual(1, comp(beckXP, beckTDD));

        this.assertEqual(1, comp(fowlerPoEAA, beckXP));
    });

    return [tc];
};
