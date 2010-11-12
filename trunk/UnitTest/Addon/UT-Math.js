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

Cactus.UnitTest.Addon.Math = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Math = Cactus.Addon.Math;

    var tc = new TestCase("Addon.Math");

    tc.addTest(function () {
        var a = [0, 0, 0, 0, 0];
        for (var i = 0; i < 5000; i++) {
            a[Math.rand(0, 4)]++;
        }
        this.assertFalse("-1" in a, "lower boundary breached");
        this.assertFalse("5" in a, "upper boundary breached");
        for (var i = 0; i < 5; i++) {
            this.assert(a[i] > 900, "%s occured %s times".format(i, a[i]));
        }
    });

    tc.addTest(function () {
        var a = [1, 2, 3];
        var middle = Math.middle.apply.bind(Math.middle).bind(null, null);

        var eq = this.assertEqual.bind(this);
        function eq2() {
            var m = middle(a);
            eq(2, m, "middle(%s)=%s".format(a.join(","), m));
        }

        eq2();
        a = [1, 3, 2];
        eq2();
        a = [2, 1, 3];
        eq2();
        a = [2, 3, 1];
        eq2();
        a = [3, 1, 2];
        eq2();
        a = [3, 2, 1];
        eq2();

        a = [1, 2, 2];
        eq2();
        a = [2, 1, 2];
        eq2();
        a = [2, 2, 1];
        eq2();

    });

    return [tc];
};
