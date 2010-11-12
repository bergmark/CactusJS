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

Cactus.UnitTest.MVC.Model.ArrayController = function () {
    var UT = Cactus.Dev.UnitTest;
    var Test = UT.Test;
    var TestCase = UT.TestCase;
    var AC = Cactus.MVC.Model.ArrayController;
    var log = Cactus.Dev.log;
    var ValueObject = Cactus.MVC.Model.ValueObject;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;

    var tc = new TestCase("MVC.Model.ArrayController");

    // Instantiate with an empty array.
    tc.addTest (function () {
        var a = new AC([]);
        this.assertEqual("", a.getRange().join(","));
    });

    tc.addTest (function () {
        var test = this;
        var a = [1, 2, 3];
        var ac = new AC (a);
        this.assertEqual (3, ac.count());
        this.assertEqual ("1,2,3", ac.getRange().join (","));
        // Make sure a shallow copy of the array controllers array is returned.
        this.assertFalse (a === ac.getRange());

        ac.add (4);
        this.assertEqual (4, ac.count());
        this.assertEqual ("1,2,3,4", ac.getRange().join (","));

        var addedTriggered = false;
        function added (controller, index) {
            addedTriggered = true;
            test.assertEqual (ac, controller);
            test.assertEqual (4, index);
            test.assertEqual (5, controller.get (4));
        }

        ac.subscribe("ObjectAdded", added);
        ac.add (5);
        this.assert (addedTriggered, "added was not triggered");
    });

    tc.addTest (function () {
        var test = this;
        var ac = new AC ([1, 2, 3]);

        ac.remove (2);
        this.assertEqual ("1,3", ac.getRange().join (","));

        var removedTriggered = false;
        function removed (controller, object, index) {
            removedTriggered = true;
            test.assertEqual (ac, controller);
            test.assertEqual (3, object);
            test.assertEqual (1, index);
        }
        ac.subscribe("ObjectRemoved", removed);
        ac.remove (3);
        this.assert (removedTriggered, "removed was not triggered");
        this.assertEqual ("1", ac.getRange().join (","));
    });

    // Swap.
    tc.addTest (function () {
        var test = this;
        var ac = new AC ([1, 2, 3]);

        ac.swap (0, 2);
        this.assertEqual ("321", ac.getRange().join (""));

        ac.swap (0, 1);
        this.assertEqual ("231", ac.getRange().join (""));

        var swapTriggered = false;
        function onSwap (ac, indexA, indexB) {
            swapTriggered = true;
            test.assert (indexA < indexB, "indexA >= indexB");
        }

        ac.subscribe("ObjectSwap", onSwap);
        ac.swap (2, 1);
        this.assert (swapTriggered);
    });

    // addAtIndex.
    tc.addTest (function () {
        var ac = new AC ([1, 2, 3]);

        // Add as the first element.
        ac.addAtIndex (0, "x");
        this.assertEqual ("x123", ac.getRange().join (""));

        // Add as the last element.
        ac.addAtIndex (ac.count(), "y");
        this.assertEqual ("x123y", ac.getRange().join (""));
        this.assertEqual (5, ac.count());

        // Add as the last element's position.
        ac.addAtIndex (4, "z");
        this.assertEqual ("x123zy", ac.getRange().join (""));

        // Add in the middle.
        ac.addAtIndex (3, "q");
        this.assertEqual ("x12q3zy", ac.getRange().join (""));
    });

    // replace.
    tc.addTest (function () {
        var test = this;
        var ac = new AC ([1, 2, 3]);

        // Middle of collection.
        ac.replace (2, 4);
        this.assertEqual ("143", ac.getRange().join (""));
        // First element.
        ac.replace (1, 5);
        this.assertEqual ("543", ac.getRange().join (""));
        // Last element.
        ac.replace (3, 6);
        this.assertEqual ("546", ac.getRange().join (""));

        // Throw error if object already in collection.
        this.assertException (Error, function () {
            ac.replace (5, 4);
        });

        // Should send out onObjectReplaced.
        var triggered = false;
        ac.subscribe("ObjectReplaced",
                     function (controller, index, oldObject, newObject) {
            triggered = true;
            test.assertEqual (ac, controller);
            test.assertEqual (0, index);
            test.assertEqual (5, oldObject);
            test.assertEqual (7, newObject);
        });

        ac.replace (5, 7);
        this.assertEqual ("746", ac.getRange().join (""));
        this.assert (triggered, "ObjectReplaced did not trigger");
    });

    // Should be serializable into an array.
    tc.addTest(function () {
        var ac = new AC(["a", "b", "c"]);
        var array = ac.serialize(true);
        this.assertInstance(Array, array);
        this.assertEqual("a", array[0]);
        this.assertEqual(3, array.length);

        this.assertEqual('["a","b","c"]', stringify(ac.serialize()));

        // Objects implementing serialization should be serialized using their
        // own method.
        var o = {};
        o.serialize = function () {
            return "foo";
        };
        var ac = new AC([o]);
        this.assertEqual('["foo"]', stringify(ac.serialize()));
    });

    function VO(x) {
        this.x = x;
    } VO.extend(ValueObject);

    // Should be able to serialize ValueObjects.
    tc.addTest(function () {
        var ac = new AC([
            new VO(1)
        ]);
        var serialized = stringify(ac.serialize());
        this.assertEqual('[{"x":1}]', serialized);

        serialized = stringify(ac.serialize());
        this.assertEqual('[{"x":1}]', serialized);
    });

    // Should turn its primitive values into the corresponding JSON types.
    tc.addTest(function () {
        var ac = new AC([
            new VO("1")
        ]);
        var serialized = stringify(ac.serialize());
        this.assertEqual('[{"x":"1"}]', serialized);
    });

    // clear should remove all objects from the ac.
    tc.addTest(function () {
        var ac = new AC([1,2,3]);
        ac.clear();
        this.assertEqual(0, ac.count());
        ac.clear();
        this.assertEqual(0, ac.count());
    });

    return tc;
};
