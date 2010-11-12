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

Cactus.UnitTest.Util.Collection = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var EventIterator = Cactus.Util.EventIterator;
    var EventSubscription = Cactus.Util.EventSubscription;
    var log = Cactus.Dev.log;
    var Coll = Cactus.Util.Collection;
    var TestCase = UT.TestCase;
    var Range = Cactus.Util.Range;

    var tc = new TestCase("Util.Collection");

    tc.addTest (function () {
        var a = [1,2,3];
        var b = Coll.coerce (a);

        this.assertInstance (Array, b);
        this.assertEqual ("1,2,3", b.join (","));
    });

    tc.addTest (function () {
        var a = [1, 2, 3];
        var b = [3, 4, 5];
        var c = [6, 5, 4];

        var i = Coll.intersects;

        this.assert (i (a, b));
        this.assertFalse (i (a, c));
        this.assert (i (b, a));
        this.assert (i (b, c));
        this.assertFalse (i (c, a));
        this.assert (i (c, b));
    });

    tc.addTest (function () {
        var a = [1, 2, 3];

        var hv = Coll.hasValue;

        this.assert (hv (a, 1));
        this.assert (hv (a, 2));
        this.assert (hv (a, 3));
        this.assertFalse (hv (a, 0));
        this.assertFalse (hv (a, 4));

        a.push ([1]);
        // ID is compared, not value.
        this.assertFalse (hv (a, [1]));
    });

    tc.addTest (new Test (function () {
        this.processResults();
    }, function () {
        var a = [1, 2, 3];
        var b = [3, 4, 5];
        var c = [6, 5, 4];

        var i = Coll.intersection;

        this.assertEqual ("3", i (a, b).join (","));
        this.assertEqual ("", i (a, c).join (","));
        this.assertEqual ("3", i (b, a).join (","));
        this.assertEqual ("4,5", i (b, c).sort().join (","));
        this.assertEqual ("", i (c, a).join (","));
        this.assertEqual ("4,5", i (c, b).sort().join (","));
    }));

    tc.addTest (new Test (null, function () {
        this.assertEquals (3, Coll.last ([1,2,3]));
        this.assertEquals (1, Coll.last ([1]));
        this.assertException (Error, function () { Coll.last ([]); });
    }));

    tc.addTest (function () {
        var ial = Coll.isCollection;
        this.assert (ial ([]));
        this.assert (ial ([1, 2, 3]));
        this.assert (ial ({ 0 : "a", length : 1 }));
        this.assertFalse (ial (window));
        this.assertFalse (ial ({}));
        this.assertFalse (ial (0));
        this.assertFalse (ial (null));
        this.assertFalse (ial (undefined));
        this.assertFalse (ial (document.createElement ("select")),
                          "select should not be a collection");
        this.assertFalse (ial (document.createElement ("form")),
                          "form should not be a collection");
    });


    tc.addTest (function () {
        var a = [1, 2, 3, 4, 5, 6];
        function isEven (n) {
            return !(n % 2);
        }
        var b = Coll.select (a, isEven);
        this.assertEqual (3, b.length);
        this.assertEqual (2, b [0]);
        this.assertEqual (4, b [1]);
        this.assertEqual (6, b [2]);

        // Select no elements.
        this.assertEqual (0, Coll.select (a, function () {
            return false;
        }).length);
        // Select all elements.
        this.assertEqual (6, Coll.select (a, function () {
            return true;
        }).length);
    });
    // Test the index argument.
    tc.addTest (function () {
        var a = [1, 2, 3, 4, 5, 6];
        function isEven (_, n) {
            return !(n % 2);
        }
        // Select all elements with an even index.
        var b = Coll.select (a, isEven);
        this.assertEqual (3, b.length);
        this.assertEqual (1, b [0]);
        this.assertEqual (3, b [1]);
        this.assertEqual (5, b [2]);
    });

    tc.addTest (function () {
        var a = [1, 2, 3, 4, 5, 6];
        function isEven (n) {
            return (n % 2) === 0;
        }
        var b = Coll.reject (a, isEven); // remove all even numbers
        this.assertEqual ("1,3,5", b.join (","));

        // Remove all objects.
        this.assertEqual (0, Coll.reject (a, function () {
            return true;
        }).length);
        // Remove no objects.
        this.assertEqual (6, Coll.reject (a, function () {
            return false;
        }).length);
    });
    // Test the index argument.
    tc.addTest (function () {
        var a = [1, 2, 3, 4, 5, 6];
        function isEven (_, n) {
            return !(n % 2);
        }
        // reject all elements with an even index
        var b = Coll.reject (a, isEven);
        this.assertEqual (3, b.length);
        this.assertEqual (2, b [0]);
        this.assertEqual (4, b [1]);
        this.assertEqual (6, b [2]);
    });

    tc.addTest (function () {
        var a = [1, 2, 3];
        var b = [];

        Coll.each (a, function (v) {
            b.push (v);
        });

        this.assertEqual ("123", b.join (""));
    });

    tc.addTest (function () {
        var a = [0,1,2,3,4,5];
        this.assertEqual ("0,1,2,3,4,5", Coll.slice (a, 0, 6).join (","));
        this.assertEqual ("1,2,3,4", Coll.slice (a, 1, 5).join (","));
    });

    tc.addTest (function () {
        var a = [0,1,2,3,4,5];
        var r = new Range (0,5);
        this.assertEqual ("0,1,2,3,4,5", Coll.sliceWithRange (a, r).join (","));
        r = new Range (1, 4);
        this.assertEqual ("1,2,3,4", Coll.sliceWithRange (a, r).join (","));
    });

    tc.addTest (function () {
        this.assert (Coll.some ([1, 5, 3, 6], function (el) {
            return el > 3;
        }));
        this.assertFalse (Coll.some ([1, 5, 3, 6], function (el) {
            return el > 13;
        }));
    });

    tc.addTest (function () {
        this.assert (Coll.every ([1, 5, 3, 6], function (el) {
            return el > 0;
        }));
        this.assertFalse (Coll.every ([1, 5, 3, 6], function (el) {
            return el < 6;
        }));
    });

    tc.addTest (function () {
        this.assert (Coll.notAny ([1, 2, 3, 0], function (el) {
            return el > 3;
        }));
        this.assertFalse (Coll.notAny ([1, 2, 3, 0], function (el) {
            return el >= 3;
        }));
    });

    tc.addTest (function () {
        this.assert (Coll.notEvery ([1, 5, 3, 6], function (el) {
            return el < 6;
        }));
        this.assertFalse (Coll.notEvery ([1, 5, 3, 6], function (el) {
            return el <= 6;
        }));
    });

    tc.addTest (function () {
        this.assertEqual (1, Coll.findFirst ([1, 2, 3], function (v) {
            return v === 1;
        }));
        this.assertEqual (3, Coll.findFirst ([1, 2, 3], function (v) {
            return v === 3;
        }));
        this.assertEqual (null, Coll.findFirst ([1, 2, 3], function (v) {
            return v === 4;
        }));
    });

    // Two collections are equal if their contents are identical.
    tc.addTest(function () {
        this.assert(Coll.equal([1, 2], [1, 2]));
        this.assertFalse(Coll.equal([1, 2], [1, 2, 3]));
        this.assertFalse(Coll.equal([1, 2, 3], [1, 2]));
        this.assert(Coll.equal([1, 2], { 0 : 1, 1 : 2, length : 2 }));
    });

    return [tc];
};
