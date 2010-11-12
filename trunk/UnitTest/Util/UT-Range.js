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

Cactus.UnitTest.Util.Range = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var Range = Cactus.Util.Range;

    var rangeTC = new TestCase ("Util.Range");
    rangeTC.addTest (function () {
        var start = 3;
        var end   = 8;
        var r = new Range (3, 8);

        this.assertEqual ("3..8", r.toString());
        this.assertEqual (3, r.getStart());
        this.assertEqual (8, r.getEnd());

        this.assert (r.includes (3));
        this.assert (r.includes (8));
        this.assert (r.includes (5));
        this.assertFalse (r.includes (2));
        this.assertFalse (r.includes (9));

        r = new Range (-5, 3);
        this.assertEqual ("-5..3", r.toString());
        this.assert (r.includes (-5));
        this.assert (r.includes (0));
        this.assert (r.includes (3));
        this.assertFalse (r.includes (5));
    });

    return rangeTC;
};
