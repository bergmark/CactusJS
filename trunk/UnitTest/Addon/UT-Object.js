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

Cactus.UnitTest.Addon.Object = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var Collection = Cactus.Util.Collection;

    var tc = new TestCase("Addon.Object");
    tc.addTest(new Test(function () {
        this.processResults();
    }, function () {
        this.assert(Object.isEmpty({}));
        this.assertFalse(Object.isEmpty({ a : undefined }));
        this.assertFalse(Object.isEmpty({ a : null }));
        this.assertFalse(Object.isEmpty({ a : 0 }));
        this.assert(Object.isEmpty([]));
        this.assertFalse(Object.isEmpty(undefined));
        this.assertFalse(Object.isEmpty(true));
    }));

    tc.addTest(new Test(function () {
        this.processResults();
    }, function () {
        var o = {};
        this.assert(o !== Object.copy(o));
        o.a = 2;
        this.assertEqual(2, Object.copy(o).a);
        var p = { a : 3, b : 4 };
        Object.copy(o, p);
        this.assertEqual(2, p.a);
        this.assertEqual(4, p.b);
    }));

    tc.addTest(new Test(function () {
        this.processResults();
    }, function () {
        var o = {
            a : 1,
            b : 2,
            c : 3
        };
        var a = Object.map(o, function (p, v) {
            return p + v;
        });

        this.assertEqual(3, a.length);
        this.assert(Collection.hasValue(a, "a1"));
        this.assert(Collection.hasValue(a, "b2"));
        this.assert(Collection.hasValue(a, "c3"));
    }));

    // bound.
    tc.addTest(function () {
        var o = {
            x : function () {
                return this;
            }
        };

        this.assertEqual(o, Object.bound(o, "x")());

        var p = {
            y : function (a, b) {
                return a + b;
            }
        };
        this.assertEqual(3, Object.bound(p, "y", 1, 2)());
    });

    return tc;
};
