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

Cactus.UnitTest.Util.Set = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Set = Cactus.Util.Set;

    var tc = new TestCase ("Util.Set");

    tc.addTest (function () {
        var set = new Set();
        this.assertInstance (Set, set);

        set.add ("a");
        this.assertEqual (1, set.size());

        set.add ("b");
        this.assertEqual (2, set.size());

        // Add an element already in the set, the length should not change.
        set.add ("b");
        this.assertEqual (2, set.size());

        this.assertEqual ("a", set.get (0));
        this.assertEqual ("b", set.get (1));

        this.assert (set.has ("a"));
        this.assert (set.has ("b"));
        this.assertFalse (set.has ("c"));

        set.remove ("a");
        this.assertEqual (1, set.size());
        this.assertEqual ("b", set.get (0));
    });

    // Pass the "value" argument to compare all objects by value instead of
    // identity.
    tc.addTest (function () {
        var set = new Set ("shallow");
        set.add ({ a : 1 });
        set.add ({ a : 2 });
        this.assertEqual (2, set.size());
        set.add ({ a : 1 });
        this.assertEqual (2, set.size());
    });

    // Getting an element by a non existant index should throw an error.
    tc.addTest (function () {
        var set = new Set ();

        this.assertException (Error, function () {
            set.get ("foo");
        });

        this.assertException (Error, function () {
            set.get (0);
        });

        set.add ("a");

        this.assertException (Error, function () {
            set.get (2);
        });
    });

    return [tc];
};
