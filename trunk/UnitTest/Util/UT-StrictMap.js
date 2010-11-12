/*
 * Copyright (c) 2007-2009, Adam Bergmark
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

Cactus.UnitTest.Util.StrictMap = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var StrictMap = Cactus.Util.StrictMap;

    var tc = new TestCase("Util.StrictMap");

    tc.addTest(function () {
        var sh = new StrictMap();

        var regs = {
            getX : /get.+undefined key x/i,
            getY : /get.+undefined key y/i,
            setX : /set.+undefined key x/i,
            setY : /set.+undefined key y/i,
            define : /define.+x is already defined/i,
            badMap : /expected map argument/i
        };

        this.assertException(regs.getX, sh.get.bind(sh, "x"));
        this.assertException(regs.setX, sh.set.bind(sh, "x", 1));
        sh.define("x", 2);
        this.assertException(regs.define, sh.define.bind(sh, "x", 3));
        this.assertEqual(2, sh.get("x"));
        sh.set("x", 4);
        this.assertEqual(4, sh.get("x"));

        this.assertException(regs.badMap, function () { new StrictMap(null); });
        this.assertException(regs.badMap, function () { new StrictMap(1); });

        var sh = new StrictMap({ x : 1 });
        this.assertException(regs.getY, sh.get.bind(sh, "y"));
        this.assertException(regs.setY, sh.set.bind(sh, "y", 2));
        this.assertException(regs.define, sh.define.bind(sh, "x", 2));
        this.assertEqual(1, sh.get("x"));
        sh.set("x", 2);
        sh.define("y",3);
        this.assertEqual(2, sh.get("x"));
        this.assertEqual(3, sh.get("y"));
    });

    return [tc];
};

