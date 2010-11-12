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

Cactus.UnitTest.MVC.Model.ValueObject = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var ValueObject = Cactus.MVC.Model.ValueObject;
    var KVC = Cactus.Util.KeyValueCoding;
    var AC = Cactus.MVC.Model.ArrayController;
    var AR = Cactus.MVC.Model.ActiveRecord;
    var JSON = Cactus.Util.JSON;

    var tc = new TestCase("MVC.Model.ValueObject");

    function V() {

    } V.extend(ValueObject);
    function Entity() {

    } Entity.extend(AR);

    tc.setup = function () {
        this.v = new V();
    };

    // Should be KVC compliant.
    tc.addTest(function () {
        var v = new V();
        this.assertInstance(ValueObject, v);
        this.assert(KVC.implementsInterface(v), "Does not implement KVC.");
    });

    // Should always serialize into a hash of all its data.
    tc.addTest(function () {
        var v = new V();
        v.foo = 1,
        v.bar = new AC(["a", 3]);

        var serialized = v.serialize(true);
        this.assertEqual(1, serialized.foo);
        this.assertEqual("a", serialized.bar[0]);

    });
    // When containing AR aggregates it should be able to do
    // a shallow serialization.
    tc.addTest(function () {
        function A() {
        } A.prototype = {
            x : 0
        };
        A.extend(AR);
        AR.addStaticMethods(A);

        var a = new A();
        a.inject({
            id : 2,
            x : 3
        });
        var v = new V();
        v.a = a;

        var serialized = v.serialize(true);
        this.assertEqual(3, serialized.a.x);
        serialized = v.serialize();
        this.assertEqual(2, serialized.a);
    });

    // Should have an inject method to set its data.
    tc.addTest(function () {
        var v = new V();
        v.a = null;
        v.b = null;
        v.inject(JSON.stringify({
            a : 3,
            b : "c"
        }));
        this.assertEqual(3, v.a);
        this.assertEqual("c", v.b);

        // Should be able to pass a hash as the argument as well.
        v.inject({
            a : 4,
            b : "d"
        });
        this.assertEqual(4, v.a);
        this.assertEqual("d", v.b);

    });

    return [tc];
};
