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

Cactus.UnitTest.MVC.View.Wizard = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Wizard = Cactus.MVC.View.Wizard;
    var tag = Cactus.DOM.tag;
    var ClassNames = Cactus.DOM.ClassNames;
    var Collection = Cactus.Util.Collection;

    var has = ClassNames.has;

    var tc = new TestCase("MVC.View.Wizard");

    tc.setup = function () {
        this.menus = [
            tag("div", { id : "menu0" }),
            tag("div", { id : "menu1" }),
            tag("div", { id : "menu2" })
        ];
        this.items = [
            tag("div", { id : "item0" }),
            tag("div", { id : "item1" }),
            tag("div", { id : "item2" })
        ];

        this.w = new Wizard(this.menus, this.items);

        /**
         * Makes sure the menu+item has the active class name.
         *
         * @param natural i
         */
        this.assertActive = function (i) {
            var menu = this.menus[i];
            var item = this.items[i];
            this.assert(has(menu, "active"),
                        "%s is not active.".format(menu.id));
            this.assert(has(item, "active"),
                        "%s is not active.".format(item.id));
        };
        /**
         * Makes sure the menu+item does not have active class name.
         *
         * @param natural i
         */
        this.assertInactive = function (i) {
            var menu = this.menus[i];
            var item = this.items[i];
            this.assertFalse(has(menu, "active"),
                             "%s is active.".format(menu.id));
            this.assertFalse(has(item, "active"),
                             "%s is active.".format(item.id));
        };
    };

    // Initial class names.
    tc.addTest(function () {
        var w = this.w;
        var menus = this.menus;
        var items = this.items;

        this.assertActive(0);
        this.assertInactive(1);
        this.assertInactive(2);
    });

    // Switching the active item should keep the class names consistent.
    tc.addTest(function () {
        var w = this.w;
        var menus = this.menus;
        var items = this.items;

        w.setActive(1);
        this.assertInactive(0);
        this.assertActive(1);
        this.assertInactive(2);
    });

    // Throw error if menu elements and elements differ in amount.
    tc.addTest(function () {
        this.assertException(/should have the same length/, function () {
            new Wizard([{
                id : "a"
            }], []);
        });
    });

    // Switching to the next tab.
    tc.addTest(function () {
        var w = this.w;

        w.setActive(1);
        w.showNext();

        this.assertActive(2);

        // Go around to the first element.
        w.showNext();
        this.assertActive(0);
    });

    // Attach click events on the menu items to toggle active item.
    tc.addTest(function () {
        var w = this.w;
        var menus = this.menus;
        var items = this.items;

        menus[2].onclick();

        this.assertActive(2);

        // The onclicks should return false.
        this.assertEqual(false, menus[1].onclick());
        this.assertActive(1);
    });

    // Throw an error if the number of elements is 0.
    tc.addTest(function () {
        this.assertException(/No elements/, function () {
            new Wizard([], []);
        });
    });

    // Throw an error if an invalid index is passed to setActive.
    tc.addTest(function () {
        var w = this.w;
        this.assertException(/Invalid index/, function () {
            w.setActive(3);
        });
        this.assertException(/Invalid index/, function () {
            w.setActive(-1);
        });
    });

    // Send out Activated any time a page is activated.
    tc.addTest(function () {
        var menus = [tag("div"), tag("div"), tag("div")];
        var elements = [tag("div"), tag("div"), tag("div")];
        var wizard = new Wizard(menus, elements);

        var activatedIndex = null;

        wizard.subscribe("Activated", function (wizard, index) {
            activatedIndex = index;
        });

        wizard.setActive(1);
        this.assertEqual(1, activatedIndex);
        wizard.setActive(2);
        this.assertEqual(2, activatedIndex);
        wizard.setActive(1);
        this.assertEqual(1, activatedIndex);
        activatedIndex = null;
        wizard.setActive(1);
        this.assertEqual(null, activatedIndex);
    });

    // Send out Deactivated any time a page is deactivated.
    tc.addTest(function () {
        var menus = [tag("div"), tag("div"), tag("div")];
        var elements = [tag("div"), tag("div"), tag("div")];
        var wizard = new Wizard(menus, elements, 0);

        var deactivatedIndex = null;
        wizard.subscribe("Deactivated", function (wizard, index) {
            deactivatedIndex = index;
        });

        wizard.setActive(1);
        this.assertEqual(0, deactivatedIndex);
        wizard.setActive(2);
        this.assertEqual(1, deactivatedIndex);
    });

    // Send out events the first time an element becomes active.
    tc.addTest(function () {
        var menus = [tag("div"), tag("div"), tag("div")];
        var elements = [tag("div"), tag("div"), tag("div")];
        var wizard = new Wizard(menus, elements);

        var activatedIndex = null;

        wizard.subscribe("FirstActivated", function (wizard, index) {
            activatedIndex = index;
        });

        this.assertEqual(0, activatedIndex);

        wizard.setActive(2);
        this.assertEqual(2, activatedIndex);

        var activations = [];
        wizard.subscribe("FirstActivated", function (wizard, index) {
            activations.push(index);
        });
        this.assertEqual("0,2", activations.sort().join(","));

        // Don't send out several onFirstActivation events for the same page to
        // the same subscriber.
        wizard.subscribe("FirstActivated", Function.empty);
        this.assertEqual("0,2", activations.sort().join(","));
    });

    // The third constructor argument should decide which element is activated
    // first.
    tc.addTest(function () {
        var wizard = new Wizard(this.menus, this.items, 2);
        var activations = [];
        wizard.subscribe("FirstActivated", function (_, index) {
            activations.push(index);
        });
        this.assertEqual("2", activations.join(","));
    });

    // The wizard should be able to have several sets of pages, where each set
    // has one active item.
    tc.addTest(function () {
        var div = tag.curry("div");
        function isActive(element) {
            return ClassNames.has(element, "active");
        }

        var menu = [div(), div(), div()];
        var setA = [div(), div(), div()];
        var setB = [div(), div(), div()];

        var wizard = new Wizard(menu, [setA, setB]);

        this.assert(isActive(menu[0]));
        this.assert(isActive(setA[0]));
        this.assert(isActive(setB[0]));

        wizard.showNext();
        this.assert(isActive(menu[1]));
        this.assert(isActive(setA[1]));
        this.assert(isActive(setB[1]));
    });

    // getElement & getMenuElement.
    tc.addTest(function () {
        function div(id) {
            return tag("div", {
                id : id
            });
        }

        var menu = [div(1), div(2), div(3)];
        var setA = [div(4), div(5), div(6)];
        var setB = [div(7), div(8), div(9)];

        var w = new Wizard(menu, [setA, setB]);

        this.assertEqual(menu[0], w.getMenuElement(0));
        this.assertEqual(menu[2], w.getMenuElement(2));
        this.assertEqual(setA[0], w.getElements(0)[0]);
        this.assertEqual(setA[2], w.getElements(2)[0]);
        this.assertEqual(setB[0], w.getElements(0)[1]);
        this.assertEqual(setB[2], w.getElements(2)[1]);
    });

    return [tc];
};
