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

Cactus.UnitTest.MVC.Model.IdentityMap = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var IdentityMap = Cactus.MVC.Model.IdentityMap;

    var tc = new TestCase("MVC.Model.IdentityMap");

    tc.addTest(function () {
        var map = new IdentityMap();

        // Add.
        map.add(1, "a");
        this.assertEqual("a", map.get(1));
        this.assertException(/another object/i, map.add.bind(map, 1, "c"));
        this.assertException(/is already stored/i, map.add.bind(map, 1, "a"));

        this.assertException(/non-existant ID/i, map.get.bind(map, 2));

        // Has.
        this.assert(map.has(1));
        this.assertFalse(map.has(2));

        // Remove.
        map.remove("a");
        this.assertException(/non-existant ID/i, map.get.bind(map, "a"));
        this.assertException(/not in map/i, map.remove.bind(map, "a"));
    });

    // OnAdd when an abject is added to the ID map.
    tc.addTest(function () {
        var test = this;

        var triggered = false;
        var map = new IdentityMap();
        map.add(1, "a");
        map.subscribe("Added", function (_map, key, object) {
            test.assertEqual("2", key);
            test.assertEqual("b", map.get(key));
            test.assertEqual("b", object);
            triggered = true;
        });

        map.add(2, "b");
        this.assert(triggered, "onAdded did not trigger.");
    });

    // OnRemove when an object is removed from the ID map.
    tc.addTest(function () {
        var test = this;

        var triggered = false;
        var map = new IdentityMap();
        map.add(1, "a");
        map.subscribe("Removed", function (_map, key, object) {
            test.assertEqual("1", key);
            test.assertEqual("a", object);
            triggered = true;
        });
        map.remove("a");
        this.assert(triggered, "onRemoved did not trigger.");
    });

    // Should be able to fetch all objects.
    tc.addTest(function () {
        var map = new IdentityMap();
        map.add(1, "a");
        map.add(2, "b");
        var objects = map.getAll();
        this.assertInstance(Array, objects);
        this.assert(objects[0] === "a" || objects[1] === "a");
        this.assert(objects[0] === "b" || objects[1] === "b");
    });

    return [tc];
};
