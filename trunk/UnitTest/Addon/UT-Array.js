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

Cactus.UnitTest.Addon.Array = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var log = Cactus.Dev.log;
    var Range = Cactus.Util.Range;
    var Collection = Cactus.Util.Collection;

    var tc = new TestCase("Addon.Array");
    tc.addTest (function () {
        var a = [1,2,3];
        Array.empty (a);
        this.assertEquals (0, a.length);
        Array.empty (a);
        this.assertEquals (0, a.length);
    });

    tc.addTest (function () {
        var a = [1,2,3];
        this.assertEqual (0, Array.remove (a, 1));
        this.assertEquals (2, a.length);
        this.assertEquals ("2,3", a.join (","));
        this.assertEqual (-1, Array.remove(a, 1));
        this.assertEquals (2, a.length);
        var b = [1, 1, 2, 1, 1, 3, 1, 1];
        this.assertFalse (Array.remove (b, 1, true) === -1);
        this.assertEquals (2, b.length);
        this.assertEquals ("2,3", b.join (","));
    });

    // The arrays should be different objects but contain the same elements.
    tc.addTest (function () {
        var a = ["a", "b", "c"];
        this.assertEqual (3, a.length);
        var b = Array.clone (a);
        this.assertEqual (3, a.length);
        this.assertEqual (a.length, b.length);
        for (var i = 0; i < a.length; i++) {
            this.assertEqual (a[i], b[i]);
        }
        this.assertFalse (a === b);
    });

    // No deep cloning.
    tc.addTest (function () {
        var a = [{}, {}, {}];
        this.assertEqual (3, a.length);
        var b = Array.clone (a);
        this.assertEqual (3, a.length);
        this.assertEqual (a.length, b.length);
        for (var i = 0; i < a.length; i++) {
            this.assertEqual (a[i], b[i]);
        }
        this.assertFalse (a === b);
    });

    // unique.
    tc.addTest(function () {
        var a = [1, 2, 3, 1, 2];
        var o = {};
        var b = [o, {}, o];

        this.assertEqual(3, Array.unique(a).length);
        this.assertEqual(2, Array.unique(b).length);
    });

    return tc;

};
