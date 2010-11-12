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

Cactus.UnitTest.DOM.formToHash = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var formToHash = Cactus.DOM.formToHash;
    var tag = Cactus.DOM.tag;

    var tc = new TestCase("DOM.formToHash");

    tc.addTest(function () {
        var form = tag("form");
        var hash;

        // Form without elements should return no data.
        this.assert(Object.isEmpty(formToHash(form)));

        // Create a property for input texts.
        form = tag("form", null, [
            tag("input", {
                type : "text",
                name : "foo",
                value : "bar"
            })
        ]);
        hash = formToHash(form);
        this.assert("foo" in hash, "foo is not in hash.");
        this.assertEqual("bar", hash.foo);

        form = tag("form", null, [
            tag("select", {
                name : "x"
            }, [
                tag("option", {
                    value : "foo",
                    selected : true
                }, "a"),
                tag("option", {
                    value : "bar"
                }, "b")
            ])
        ]);

        hash = formToHash(form);
        this.assert("x" in hash, "x not in hash.");
        this.assertEqual("foo", hash.x);

        // Bracket syntax.
        form = tag("form", null, [
            tag("input", {
                type : "text",
                name : "foo[]",
                value : "bar"
            }),
            tag("input", {
                type : "text",
                name : "foo[]",
                value : "baz"
            })
        ]);
        hash = formToHash(form);
        this.assert("foo[]" in hash);
        this.assertInstance(Array, hash["foo[]"]);
        this.assertEqual("bar baz", hash["foo[]"].sort().join(" "));
    });

    return [tc];
};
