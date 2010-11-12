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
 * Provides helpers for working with objects as hashes.
 */

/**
 * Checks if an object has no properties of its own
 *
 * @param Object o
 * @return boolean
 */
Object.isEmpty = function (o) {
    if (!o || !(o instanceof Object)) {
        return false;
    }
    for (var p in o) if (o.hasOwnProperty(p)) {
        return false;
    }
    return true;
}
/**
 * Copies all the properties of an object to another object
 * no deep copy is made. If copy isn't specified then a new
 * shallow copied object is created.
 *
 * @param Object o
 * @param optional Object copy
 * @return Object
 *   The copy
 */
Object.copy = function (o, copy) {
    copy = copy || {};
    for (var p in o) if (o.hasOwnProperty(p)) {
        copy[p] = o[p];
    }

    return copy;
};

/**
 * Executes a function on each property/value pair in an object
 * and returns an array of the results.
 *
 * @param Object object
 * @param Function func
 *          @param string property
 *          @param mixed value
 *          @return mixed
 */
Object.map = function (object, func) {
    var a = [];
    for (var p in object) if (object.hasOwnProperty(p)) {
        a.push(func(p, object[p]));
    }
    return a;
};
/**
 * @param Object object
 * @param String methodName
 * @param mixed *arg1
 * @return Function
 *   The function found under object[methodName] bound (using Function:bind) to
 *   object, currying with arg1 and later arguments.
 */
Object.bound = function (object, methodName, arg1) {
    var args = Array.prototype.slice.call(arguments, 2);
    return Function.prototype.bind.apply(object[methodName], [object].concat(args));
};
