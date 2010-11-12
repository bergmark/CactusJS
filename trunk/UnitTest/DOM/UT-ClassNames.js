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

Cactus.UnitTest.DOM.ClassNames = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var CN = Cactus.DOM.ClassNames;
    var log = Cactus.Dev.log;

    var tc = new UT.TestCase ("DOM.ClassNames");
    // Initial.
    tc.addTest (function () {
        var o = {};
        this.assertFalse (CN.has(o, "foo"));
        CN.del (o, "foo");
    });
    tc.addTest (function () {
        // First CN.
        var o = {};
        CN.add (o, "foo");
        this.assertEqual ("foo", o.className);
        this.assert(CN.has (o, "foo"), "o doesn't have .foo");
        this.assertFalse (CN.has (o, "bar"));

        // Add a second and third CN.
        CN.add (o, "bar");
        this.assert (CN.has (o, "foo"), 1);
        this.assert (CN.has (o, "bar"), 2);
        this.assertFalse (CN.has (o, "baz"));

        CN.add (o, "baz");
        this.assert (CN.has (o, "foo"), 3);
        this.assert (CN.has (o, "bar"), 4);
        this.assert (CN.has (o, "baz"), 5);

    });
    // Test remove.
    tc.addTest (function () {
        var o = {};
        CN.add (o, "foo");
        CN.add (o, "bar");
        CN.add (o, "baz");
        CN.add (o, "bax");

        // Remove middle CN.
        CN.del(o, "baz");
        this.assert (CN.has (o, "foo"), 6);
        this.assert (CN.has (o, "bar"), 7);
        this.assertFalse (CN.has (o, "baz"), 8);
        this.assert (CN.has (o, "bax"), 9);

        // Remove first CN.
        CN.del (o, "foo");
        this.assertFalse (CN.has (o, "foo"), 10);
        this.assert (CN.has (o, "bar"), 11);
        this.assert (CN.has (o, "bax"), 12);

        // Remove last CN.
        CN.del (o, "bax");
        this.assert (CN.has (o, "bar"));
        this.assertFalse (CN.has (o, "bax"));
    });
    // Test unusual characters.
    tc.addTest (function () {
        var o = {};
        CN.add (o, "a-b");
        CN.add (o, "c");

        this.assert (CN.has (o, "a-b"));
        this.assert (CN.has (o, "c"));
        this.assertFalse (CN.has (o, "a"));
        this.assertFalse (CN.has (o, "b"));

        CN.del (o, "a");
        this.assert (CN.has (o, "a-b"));
        this.assert (CN.has (o, "c"));
        this.assertFalse (CN.has (o, "a"));
        this.assertFalse (CN.has (o, "b"));
        this.assertFalse (CN.has (o, "-b"));

    });
    // Test get.
    tc.addTest (function () {
        var o = { className : "a b c" };
        var p = { className : "" };
        var q = { className : "a" };

        this.assertEqual ("a,b,c", CN.get (o).join (","));
        this.assertEqual ("", CN.get (p).join (","));
        this.assertEqual ("a", CN.get (q).join (","));
    });
    return tc;
};
