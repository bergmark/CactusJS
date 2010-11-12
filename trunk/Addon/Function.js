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

/**
 * @file
 * Provides helpers for Function.
 *
 * While it is true that ECMAScript doesn't have classes,
 * we refer to the Constructor+Prototype combo as a class
 * for simplicity's sake.
 */

/**
 * Makes the specified class a subclass of SuperClass.
 * Properties are inherited and not re-defined.
 * Take care not to inherit mutable compound objects.
 * If the superclass implements the __onExtend method, it will be called with
 * the subclass after the subclassing has occured.
 *
 * @param Constructor SuperClass
 *   The class to subclass.
 * @return Constructor
 *   The subclass.
 */
Function.prototype.extend = function (SuperClass) {
    if (!SuperClass) {
        throw new Error("No superclass specified.");
    }
    var SubClass = this;
    function F () { }
    F.prototype = SuperClass.prototype;
    var prototype = SubClass.prototype;
    SubClass.prototype = new F();
    SubClass.prototype.constructor = SubClass;
    SubClass.prototype.SuperClass = SuperClass;
    SubClass.SuperClass = SuperClass;

    for (var p in prototype) {
        SubClass.prototype [p] = prototype [p];
    }

    var superClasses = [];
    var v = SubClass;
    while (v.SuperClass) {
        v = v.SuperClass;
        superClasses.push(v);
    }
    for (var i = superClasses.length - 1; i >= 0; i--) {
        if (superClasses[i].__onExtend) {
            superClasses[i].__onExtend(SubClass);
        }
    }

    return SubClass;
};
/**
 * Called on a function A, bind returns a function B which executes A in the
 * scope of the first argument given to bind, passing the rest of bind's
 * arguments concatenated with the arguments to B as arguments to A.
 *
 * This needs to be explained further. Take this example:
 * `var f = bar.foo.bind(bar, "a", "b"); f("x", "y");`
 * Here we have an instance method on `bar` named `foo`, but if we simply store
 * it in f with `var f = bar.foo`, f won't execute in the scope of `bar`.
 * Therefore we bind foo to bar so that when f executes, `this` in the call will
 * point to bar. Additionally we curry the first two arguments of foo, so that
 * any time we execute f the first and second arguments will be "a" and "b". In
 * the call to f above, the 3rd and 4th arguments will be "x" and "y".
 *
 * @param Object scope
 *   The scope to call the function in.
 *   If null, the scope will be set to the same as B's (the function bind
 *   returns).
 * @param mixed *args
 *   Arguments to pass to the function bind is called on.
 * @return Function(mixed *args)
 *         @param mixed *args
 *           Additional arguments to concatenate to the outer
 *           args before calling the function.
 */
Function.prototype.bind = function (scope, arg1) {
    var args = Array.prototype.slice.call (arguments, 1);
    var func = this;
    return function () {
        // Retrieve apply from Function.prototype since for instance
        // setTimeout doesn't have properties in Safari 2.
        return Function.prototype.apply.call(
            func,
            scope === null ? this : scope,
            args.concat(Array.prototype.slice.call(arguments)));
    };
};
/**
 * Called on a function A, curry returns a function B which executes A in the
 * scope of B's scope in the current call, passing the rest of curry's arguments
 * concatenated with the arguments to B as arguments to A.
 *
 * This is essentially bind, but without the first scope argument.
 *
 * @param mixed *args
 *  Arguments to pass to the function curry is called on.
 * @return Function
 *         @param mixed *args
 *           Additional arguments to concatenate to the outer
 *           args before calling the function.
 */
Function.prototype.curry = Function.prototype.bind.bind(null, null);
/**
 * Executes a function and returns the specified value afterwards. This is
 * useful when a function does not normally return a value. Example of usage
 * would be if you bind a function to a DOM event but want the event to return
 * false afterwards in order to halt the event. This would be writtes like this:
 * foo.bar.bind(foo).returning(false);
 *
 * Any arguments passed to the function returned will be relayed to the inner
 * function.
 *
 * Concise explanation:
 * Applied to a function A and given an argument V, returning returns a function
 * B that executes A in the global scope applying arguments sent to B to A,
 * followed by B returning V.
 *
 * @param mixed value
 *   The value to return after executing the function
 * @return Function(mixed *args)
 *   A function that executes the function and then returns the value specified.
 *      *args  Arguments that are passed through to the inner function.
 */
Function.prototype.returning = function (value) {
    var func = this;
    return function () {
        func.apply(this, arguments);
        return value;
    };
};
/**
 * An empty function, use this every time a placeholder for a function is needed
 * and the placeholder needs to be executable.
 *
 * @type Function
 */
Function.empty = function () {};
/**
 * Applied to a function F with the argument list A, filter returns a function G
 * that when executed calls F iff the contents of A are equivalent to the
 * contents of the argument list passed to G.
 *
 * Arguments to filter can be omitted by either not sending them, or by sending
 * undefined instead. An omitted argument means that it won't matter which value
 * is passed to G at that position. This enables one to filter a function call
 * on just a few of the arguments.
 *
 * @param mixed *args
 *   The arguments to filter on to decide if the inner function should be called
 * @return Function(mixed *args)
 */
Function.prototype.filter = function () {
    var args = arguments;
    var f = this;
    return function () {
        for (var i = 0; i < args.length; i++) {
            if (!(i in arguments)) {
                return;
            }
            if (args[i] !== undefined && args [i] !== arguments [i]) {
                return;
            }
        }
        f.apply (null, arguments);
    };
};
/**
 * Given a function G and a filter F, filterWithFunction returns a function H
 * that executes F with the arguments to H and then executes G with the same
 * arguments iff. H returns true. If H returns false, defaultValue is returned.
 *
 * @param Function filter
 *   The function to filter the calls to G with.
 * @param optional mixed defaultValue = undefined
 *   A default value to return if the filtered function does not execute.
 */
Function.prototype.filterWithFunction = function (filter, defaultValue) {
    var func = this;
    return function () {
        if (filter.apply(null, arguments)) {
            return func.apply(null, arguments);
        } else {
            return defaultValue;
        }
    };
};
/**
 * Applied to a function F, wait returns a function G that sets a timeout that
 * executes F after the specified delay. Any additional arguments passed to G
 * are forwarded to F. F is called in the same scope as G.
 *
 * @param natural delay
 *   The delay in milli seconds before calling the function F.
 * @return Function
 *   The new function, that when executed sets a timeout to call F.
 */
Function.prototype.wait = function (delay) {
    var f = this;
    return function () {
        var args = [this].concat(Array.prototype.slice.call(arguments));
        setTimeout(f.bind.apply(f, args), delay);
    };
};
/**
 * Takes a function F and creates a new function G that only executes F the
 * first time it's called.
 *
 * @return Function
 *         @param mixed *args
 *            Any arguments that should be passed on to F.
 *         @return mixed
 *            The return value of F on the first execution, otherwise null.
 */
Function.prototype.once = function () {
    var f = this;
    var ran = false;
    return function () {
        if (ran) {
            return null;
        }
        ran = true;
        return f.apply(null, arguments);
    }
};
/**
 * Takes a function f and a number n and returns a function g
 * that calls f without the first n arguments. If g has more than n arguments,
 * argument n+1 is passed as the first argument to f, and so on.
 * f is called in the scope of g.
 *
 * @param natural skips
 *   The number of arguments to skip
 * @return Function
 *           mixed *args
 */
Function.prototype.skip = function (skips) {
    var f = this;
    return function () {
        var args = Array.prototype.slice.call(arguments, skips);
        f.apply(this, args);
    };
};
/**
 * Takes a function f and returns a function g that calls f without any
 * arguments. The scope of f is the same as the scope of g.
 *
 * @return Function
 *           mixed *args
 */
Function.prototype.none = function () {
    var f = this;
    return function () {
        f.call(this);
    };
};
/**
 * Executes the given function and then returns it again.
 *
 * @return Function
 *           mixed *args
 */
Function.prototype.exec = function () {
    this();
    return this;
};
