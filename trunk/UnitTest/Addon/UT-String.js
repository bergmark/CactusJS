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

Cactus.UnitTest.Addon.String = function () {
    var UT = Cactus.Dev.UnitTest;
    var TestCase = UT.TestCase;
    var Test = UT.Test;

    var tc = new TestCase ("Addon.String");

    // capitalize.
    tc.addTest (function () {
        this.assertEqual ("Foo", "Foo".capitalize());
        this.assertEqual ("Foo", "foo".capitalize());
        this.assertEqual ("FOO", "fOO".capitalize());
    });

    // camelCase.
    tc.addTest (function () {
        this.assertEqual ("abCdEf", "ab_cd_ef".camelCase());
        this.assertEqual ("abcdef", "abcdef".camelCase());
    });

    // underscore.
    tc.addTest (function () {
        this.assertEqual ("ab_cd_ef", "abCdEf".underscore());
        this.assertEqual ("abcdef", "abcdef".underscore());
    });

    // format.
    tc.addTest (function () {
        this.assertEqual ("foo", "%s".format("foo"));
        this.assertEqual ("foo bar", "%s %s".format("foo", "bar"));
    });

    // hasPrefix.
    tc.addTest (function () {
        this.assert ("foo".hasPrefix (""));
        this.assert ("".hasPrefix (""));

        this.assert ("foo".hasPrefix ("foo"));
        this.assert ("foo".hasPrefix ("f"));

        this.assertFalse ("foo".hasPrefix ("x"));
        this.assertFalse ("foo".hasPrefix ("fou"));
    });

    // hasSuffix.
    tc.addTest (function () {
        this.assert ("foo".hasSuffix (""));
        this.assert ("".hasSuffix (""));

        this.assert ("foo".hasSuffix ("foo"));
        this.assert ("foo".hasSuffix ("o"));

        this.assertFalse ("foo".hasSuffix ("x"));
        this.assertFalse ("foo".hasSuffix ("fou"));
    });

    // hasSubstring.
    tc.addTest (function () {
        this.assert("".hasSubstring(""), 1);
        this.assert("abc".hasSubstring(""), 2);
        this.assert("abc".hasSubstring("ab"), 3);
        this.assert("abc".hasSubstring("bc"), 4);
        this.assertFalse("abc".hasSubstring("x"), 5);
        this.assertFalse("abc".hasSubstring("cd"), 6);
        this.assertFalse("abc".hasSubstring("za"), 7);
    });

    // trim.
    tc.addTest(function () {
        this.assertEqual("", "".trim());
        this.assertEqual("", " ".trim());
        this.assertEqual("", "  ".trim());
        this.assertEqual("a", " a".trim());
        this.assertEqual("b", "b ".trim());
        this.assertEqual("c", " c ".trim());
        this.assertEqual("d", " d ".trim());
        this.assertEqual("e", "  e  ".trim());
        this.assertEqual("a b c", " a b c ".trim());
    });

    // reverse.
    tc.addTest(function () {
        this.assertEqual("", "".reverse());
        this.assertEqual("abc", "abc".reverse().reverse());
        this.assertEqual("abc", "cba".reverse());
    });

    return [tc];
};
