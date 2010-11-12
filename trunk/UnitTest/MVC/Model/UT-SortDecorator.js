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

Cactus.UnitTest.MVC.Model.SortDecorator = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var AC = Cactus.MVC.Model.ArrayController;
    var Sorter = Cactus.MVC.Model.SortDecorator;
    var ACD = Cactus.MVC.Model.ArrayControllerDecorator;

    var tc = new TestCase("MVC.Model.SortDecorator");

    function objects(ac) {
        return ac.getRange().join("");
    }

    function compareNumbers(a, b) {
        return a < b ? -1 : (a > b ? 1 : 0);
    }
    function compareNumbersReverse(a, b) {
        return compareNumbers(a, b) * -1;
    }

    tc.setup = function () {
        this.ac = new AC([2, 1, 3]);
        this.s = new Sorter(this.ac, compareNumbers);
        this.acd = new ACD(this.s);
    };

    // Instantiate.
    tc.addTest(function () {
        var ac = this.ac;
        var s = this.s;

        this.assertInstance(ACD, s);

        // Elements should be sorted in s.
        this.assertEqual("123", objects(s));
    });

    // count.
    tc.addTest(function () {
        this.assertEqual(3, this.s.count());
    });

    // get.
    tc.addTest(function () {
        this.assertEqual(1, this.s.get(0));
        this.assertEqual(3, this.s.get(2));
    });

    // add.
    tc.addTest(function () {
        var ac = new AC([1,3]);
        var s = new Sorter(ac, compareNumbers);
        var acd = new ACD(s);
        this.assertEqual("13", objects(s));
        this.assertEqual("13", objects(acd));

        // Add as last element.
        s.add(4);
        this.assertEqual("134", objects(s));
        this.assertEqual("134", objects(acd));

        // Add as first element.
        s.add(0);
        this.assertEqual("0134", objects(s));
        this.assertEqual("0134", objects(acd));

        // Add in the middle.
        s.add(2);
        this.assertEqual("01234", objects(s));
        this.assertEqual("01234", objects(acd));
    });

    // remove.
    tc.addTest(function () {
        this.s.remove(2);
        this.assertEqual("13", objects(this.ac));
        this.assertEqual("13", objects(this.s));
        this.assertEqual("13", objects(this.acd));

        this.s.remove(3);
        this.assertEqual("1", objects(this.ac));
        this.assertEqual("1", objects(this.s));
        this.assertEqual("1", objects(this.acd));

        this.s.remove(1);
        this.assertEqual("", objects(this.ac));
        this.assertEqual("", objects(this.s));
        this.assertEqual("", objects(this.acd));
    });

    // Swap.
    tc.addTest(function () {
        // Makes no sense to swap a sorted list.
        this.assertException(/Cannot swap/,
                             this.s.swap.bind(this.s, 0, 1));

        // Swapping on the AC should not change anything on the sorter.
        this.assertEqual("213", objects(this.ac));
        this.assertEqual("123", objects(this.s));
        this.assertEqual("123", objects(this.acd));
        this.ac.swap(0, 2);
        this.assertEqual("312", objects(this.ac));
        this.assertEqual("123", objects(this.s));
        this.assertEqual("123", objects(this.acd));
    });

    // Replace.
    tc.addTest(function () {
        this.s.replace(2,4);

        this.assertEqual("413", objects(this.ac));
        this.assertEqual("134", objects(this.s));
        this.assertEqual("134", objects(this.acd));

        this.s.replace(1, 0);
        this.assertEqual("403", objects(this.ac));
        this.assertEqual("034", objects(this.s));
        this.assertEqual("034", objects(this.acd));

        this.s.replace(3, -3);
        this.assertEqual("40-3", objects(this.ac));
        this.assertEqual("-304", objects(this.s));
        this.assertEqual("-304", objects(this.acd));
    });

    // Allow changing the comparator.
    tc.addTest(function () {
        this.s.setComparator(compareNumbersReverse);

        this.assertEqual("321", objects(this.s));
        this.assertEqual("321", objects(this.acd));
    });

    return [tc];
};
