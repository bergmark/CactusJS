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

Cactus.UnitTest.Util.Money = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Money = Cactus.Util.Money;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;

    var tc = new TestCase("Util.Money");

    tc.addTest(function () {

        var m = new Money(12, 34);
        this.assertEqual(12, m.getDollars());
        this.assertEqual(34, m.getCents());
        var m = new Money(-12, 34);
        this.assertEqual(-12, m.getDollars());
        this.assertEqual(34, m.getCents());
        var m = new Money(0, -10);
        this.assertEqual(0, m.getDollars());
        this.assertEqual(-10, m.getCents());

        var m = Money._fromAmount(1234);
        this.assertEqual(12, m.getDollars());
        this.assertEqual(34, m.getCents());
        var m = Money._fromAmount(-1234);
        this.assertEqual(-12, m.getDollars());
        this.assertEqual(34, m.getCents());
        var m = Money._fromAmount(-10);
        this.assertEqual(0, m.getDollars());
        this.assertEqual(-10, m.getCents());

        this.assertEqual("12.34", new Money(12, 34).toString());
        this.assertEqual("-12.34", new Money(-12, 34).toString());
        this.assertEqual("-0.85", new Money(0, -85).toString());
        this.assertEqual("-0.02", new Money(0, -2).toString());

        this.assertEqual("5.00", new Money(2, 30).add(new Money(2, 70)).toString());
        this.assertEqual("2.13", new Money(4, 00).sub(new Money(1, 87)).toString());
        this.assertEqual("-0.85", new Money(10, 00).sub(new Money(10, 85)).toString());
        this.assertEqual("-12.85", new Money(20, 00).sub(new Money(32, 85)).toString());
        this.assertEqual("10.24", new Money(5, 12).mult(2).toString());

        this.assertException(/dollars is NaN/, function () { new Money(NaN, 13) });
        this.assertException(/cents is NaN/, function () { new Money(13, NaN) });
        this.assertException(/cents < 0/, function () { new Money(1, -1) });
        this.assertException(/cents < 0/, function () { new Money(-1, -1) });

        this.assertEqual(stringify({ dollars : 1, cents : 2 }),
                         stringify(new Money(1, 2).serialize()));

        new Money(-1, 0);
        this.assert(new Money(0, 1).isPositive());
        this.assertFalse(new Money(0, -1).isPositive());
        this.assertFalse(new Money(-1, 0).isPositive());
        this.assert(new Money(1, 0).isPositive());
        this.assertFalse(new Money(0, 0).isPositive());
        this.assert(new Money(-1, 0).isNegative());
        this.assertFalse(new Money(0, 0).isNegative());
        this.assertFalse(new Money(1, 0).isNegative());
        this.assert(new Money(0, -1).isNegative());
        this.assert(new Money(0, 0).isZero());
        this.assertFalse(new Money(1, 0).isZero());
        this.assertFalse(new Money(-1, 0).isZero());

        var m = Money.fromString("12.34");
        this.assertEqual(12, m.getDollars());
        this.assertEqual(34, m.getCents());

        var m = Money.fromString("12");
        this.assertEqual(12, m.getDollars());
        this.assertEqual(0, m.getCents());

        var m = Money.fromString("-12");
        this.assertEqual(-12, m.getDollars());
        this.assertEqual(0, m.getCents());

        this.assertException(/invalid format/i, Money.fromString.curry("1.5"));
        this.assertException(/invalid format/i, Money.fromString.curry("1.123"));

        // Invalid arguments.
        this.assertException(/string was empty/i, Money.fromString.curry(""));
        this.assertException(/string was null/i, Money.fromString.curry(null));
        this.assertException(/invalid format/i, Money.fromString.curry("12."));


        this.assert(new Money(12, 34).equals(new Money(12, 34)));
        this.assertFalse(new Money(12, 34).equals(new Money(12, 35)));

        var m12 = new Money(1, 2);
        var m13 = new Money(1, 3);
        var m21 = new Money(2, 1);

        this.assert(m12.lt(m13));
        this.assert(m13.gt(m12));
        this.assert(m12.lt(m21));
        this.assert(m21.gt(m12));

        this.assert(m12.negate().negate().equals(m12));
        this.assert(m12.equals(new Money(-1, 2).negate()));
        this.assert(new Money(-1, 2).equals(new Money(1, 2).negate()));
        this.assert(new Money(0, -1).equals(new Money(0, 1).negate()));
        this.assert(new Money(0, 1).equals(new Money(0, -1).negate()));

        this.assert(new Money(1, 2).equals(new Money(-1, 2).negate()));

    });

    return [tc];
};
