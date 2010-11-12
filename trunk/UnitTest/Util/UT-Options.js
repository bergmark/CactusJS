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

Cactus.UnitTest.Util.Options = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Options = Cactus.Util.Options;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;

    var tc = new TestCase("Util.Options");

    // Shorthand for creating an option.
    var cOptions = function (h) {
        return function () {
            return new Options(h);
        };
    };

    tc.addTest(function () {
        var o;
        var r;

        this.assertException(/did not specify type/i, cOptions(undefined));
        this.assertException(/did not specify type/i, cOptions({}));

        // Test default settings for Options itself.
        var o = new Options({ type : { a : {} } });
        this.assert(o.definition.type.a.required);
        this.assertFalse(o.definition.type.a.coerce);
        this.assertEqual("mixed", o.definition.type.a.type);

        o = new Options({ type : { a : { type : "boolean" } } });
        this.assert(o.parse({ a : true }).a);
        this.assertFalse(o.parse({ a : false }).a);
        this.assertException(/Missing required property/i, o.parse.bind(o, {}));
        this.assertException(/Expected/i, o.parse.bind(o, { a : 1 }));
        // Allow any type if type is omitted.
        this.assert(new Options({ type : { a : {} } }).parse({ a : true }).a);


        // Coerces the a property into a boolean.
        o = new Options({ type : { a : { type : "boolean", coerce : true }}});
        // Cannot coerce if no type is specified.
        this.assertException(/Cannot coerce/i, function () {
            new Options({ type : { a : { coerce : true }}});
        });
        // Cannot coerce if type is mixed.
        this.assertException(/Cannot coerce/i, function () {
            new Options({ type : { a : { coerce : true, type : "mixed" }}});
        });

        this.assert(o.parse({ a : true }).a);
        this.assert(o.parse({ a : 1 }).a);
        this.assertFalse(o.parse({ a : null }).a);
        // a is required, even though it coerces its values.
        this.assertException(/Missing required property/i, o.parse.bind(o, {}));

        // instanceof type checks.
        function A() {}
        function B() {}
        B.extend(A);
        var a = new A();
        var b = new B();
        o = new Options({ type : { a : { type : A }}});
        this.assertEqual(a, o.parse({ a : a }).a);
        this.assertEqual(b, o.parse({ a : b }).a);

        // Invalid constraint type.
        this.assertException(/"a".+Invalid type constraint for/i, function () {
            new Options({ type : { a : null } });
        });
        // Unknown type.
        this.assertException(/"a".+Invalid type/i, function () {
            new Options({ type : { a : { type : "x" } } });
        });
        // Nested types.
        var o = new Options({
            type : { a : { type : { b : { type : "boolean" } } } }
        });
        this.assertEqual(stringify({ a : { b : true } }),
                         stringify(o.parse({ a : { b : true } })));
        // Throw nested option errors while outer option is created.
        this.assertException(/"a.b".+Invalid type.+null/i,
                             cOptions({ type : { a : { type : { b : { type : null } } } } }));
        // Second argument to constructor should prevent errors from being thrown.
        var o = new Options({ type : { a : { type : "x" } } }, false);
        this.assert(o.hasErrors(), "Has no errors.");
        this.assertEqual(1, o.getErrors().length);
        this.assert(/"a".+Invalid type/.test(o.getErrorMessages()[0]), "Did not match");
        // Parse to show as many errors as possible, do not halt after the
        // first error.
        this.assertException(/"a".+Invalid type[\s\S]+"b".+Invalid type/i,
                             cOptions({ type : { a : null, b : null } }));
        this.assertException(/"a.b".+Invalid type[\s\S]+"c".+Invalid type/i,
                             cOptions({ type : { a : { type : { b : { type : null } } },
                                                 c : null } }));
        // If an error occurs in a nested property on the initial pass,
        // the complete path should be in the error message.
        this.assertException(/"a.b".+invalid type/i,
                             cOptions({ type : { a : { type : { b : { type : null }}}}}));
        // Parsing should use ErrorMessage to show all errors.
        var o = new Options({ type : { a : { type : "boolean" }, b : { type : "boolean" }}});
        this.assertException(/"a".+expected type boolean[\s\S]+"b".+missing required property/i,
                             o.parse.bind(o, { a : 1 }));
        // Sub errors.
        var o = new Options({ type : { a : { type : { b : { type : "boolean" } } }, c : { type : "boolean" }}});
        this.assertException(/"a.b".+expected type boolean[\s\S]+"c".+expected type boolean/i,
                             o.parse.bind(o, { a : { b : 1 }, c : 2 }));

        // Parsing for arrays.
        var o = new Options({ type : { a : { type : ["boolean"] } }});
        o.parse({ a : [true, false] });
        o.parse({ a : [] });
        this.assertException(/"a".+expected type \["boolean"\] but got type \["number"\]/i,
                             o.parse.bind(o, { a : [1] }));
        this.assertException(/"a".+expected type \["boolean"\] but got type boolean/i,
                             o.parse.bind(o, { a : true }));
        this.assertException(/"a".+expected type \["boolean"\] but got type \["mixed"\]/i,
                             o.parse.bind(o, { a : [true, 1] }));

        // Don't fail on optional keys.
        var options = new Options({
            type : {
                classNameConditions : {
                    required : false,
                    type : [{
                        keyPath : { type : "string" },
                        className : { type : "string" }
                    }]
                }
            }
        });
        var res = options.parse(undefined);
        this.assertEqual(stringify({}), stringify(res));
        // Provide default values.
        var options = new Options({
            type : { a : {
                required : false,
                type : ["boolean"],
                defaultValue : []
            }}
        });
        this.assertEqual(stringify({ a : [] }), stringify(options.parse(undefined)));
        // defaultValue should imply required : false.
        var options = new Options({
            type : {
                a : {
                    defaultValue : [],
                    type : ["boolean"]
                }
            }
        });
        this.assertEqual(stringify({ a : [] }), stringify(options.parse(undefined)));

        // Throw error if unspecified field is passed.
        var options = new Options({ type : { x : { type : "mixed" }}});
        this.assertException(/"a".+lacks def[\s\S]+"b".+lacks def/i,
                             options.parse.bind(options, { a : true, b : true }));
        // Nested compound option definitions in Arrays.
        var options = new Options({
            type : {
                x : {
                    required : false,
                    type : [{
                        y : { type : "boolean" }
                    }]
                }
            }
        });
        options.parse({
            x : [{
                y : true
            }]
        });
        var options = new Options({
            type : {
                x : {
                    required : false,
                    defaultValue : [],
                    type : [{
                        y : { type : "boolean" }
                    }]
                }
            }
        });
        this.assertEqual(stringify({ x : [] }), stringify(options.parse({})));

        // Add string type.
        var o = new Options({ type : { x : { type : "string", coerce : true }}})
        o.parse({ x : "x" });
        // Coercion for strings.
        this.assertEqual("1", o.parse({ x : 1 }).x);

        // Add number type.
        var o = new Options({ type : { x : { type : "number", coerce : true }}})
        o.parse({ x : 1 });
        // Coercion for numbers.
        this.assertEqual(1, o.parse({ x : "1"}).x);
        // Always use base 10.
        this.assertEqual(10, o.parse({ x : "010"}).x);

        // Invalid type signature, should be { type : ["boolean"] }.
        this.assertException(/"x.type".+expected Hash/, cOptions({
            type : {
                x : {
                    type : [{
                        type : "boolean"
                    }]
                }
            }
        }));

    });
    // A map type.
    tc.addTest(function () {
        // Map of hashes.
        var o = new Options({
            map : true,
            type : {
                b : { type : "number" },
                c : { type : "boolean" }
            }
        });
        res = o.parse({
            x : { b : 1, c : true },
            y : { b : 2, c : false }
        });
        this.jsoneq({
            x : { b : 1, c : true },
            y : { b : 2, c : false }
        }, res);

        // Pass invalid args as map value.
        this.assertException(/"x".+expected an object/i, o.parse.bind(o, { x : 3 }));

        // Pass non-map as arg.
        this.assertException(/not an object/i, o.parse.bind(o, 3));
    });
    return [tc];
};

