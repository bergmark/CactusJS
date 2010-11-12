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

Cactus.UnitTest.Remote.PersistanceManager = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var ActiveRecord = Cactus.MVC.Model.ActiveRecord;
    var PersistanceManager = Cactus.Remote.PersistanceManager;
    var tc = new TestCase("Remote.PersistanceManager");

    function Author(name) {
        this.name = name;
        ActiveRecord.call(this);
    }
    Author.extend(ActiveRecord);
    ActiveRecord.addStaticMethods(Author);

    function Book(author, title) {
        this.author = author;
        this.title = title;
        ActiveRecord.call(this);
    }
    Book.extend(ActiveRecord);
    ActiveRecord.addStaticMethods(Book);

    tc.setup = function () {
        // Hack to clear the identity maps.
        Author.prototype.__getIdentityMap().objects = {};
        Book.prototype.__getIdentityMap().objects = {};

        this.manager
            = new PersistanceManager("testfiles/PersistanceManager.php", {
                create : "update"
            });
    };

    // Create requests where the negative ID on the AR object should be
    // replaced by a positive one.
    tc.addTest(new Test(function () {
        var manager = this.manager;

        this.author = new Author("Martin Fowler");
        this.book1 = new Book(this.author, "Refactoring");
        this.book2 = new Book(this.author, "Analysis Patterns");

        manager.addAction("create", this.author);
        manager.addAction("create", this.book1);
        manager.addAction("create", this.book2);
        manager.commit({
            success : this.processResults.bind(this, "success"),
            failure : this.processResults.bind(this, "failure")
        });
    }, function (msg) {
        this.assertEqual("success", msg);
        this.assert(this.author.getId() > 0);
        this.assert(this.book1.getId() > 0);
        this.assert(this.book2.getId() > 0);
    }));

    // Throw error if action type is undefined.
    tc.addTest(function () {
        this.assertException(/undefined action type/i,
                             Object.bound(this.manager, "addAction", "undefinedaction", this.author));
    });

    // A find request should instantiate a new object.
    tc.addTest(new Test(function () {
        var test = this;
        var process = this.processResults.bind(this);

        var pm = new PersistanceManager("testfiles/PersistanceManager.php", {
            find : "find"
        });
        pm.addAction("find", { id : 123, Constructor : Author });
        pm.commit({
            success : process.curry("success"),
            failure : process.curry("failure")
        });
    }, function (msg) {
        this.assertEqual("success", msg);
        var author = Author.get(123);
        this.assertEqual("Benjamin Pierce", author.getValue("name"));
    }));

    // Should be able to define whether the action takes an id as argument,
    // the entire serialized object, or if a new object should be instantiated.
    tc.addTest(new Test(function () {
        var pm = new PersistanceManager("testfiles/PersistanceManager.php", {
            find1 : "find",
            update1 : "update",
            perform1 : "perform"
        });

        pm.addAction("find1", { id : 5, Constructor : Author });
        Author.load([{ id : 6 }, { id : 7 }]);
        pm.addAction("update1", Author.get(6));
        pm.addAction("perform1", Author.get(7));
        var test = this;
        var process = this.processResults.bind(this);
        pm.commit({
            success : process.curry("success"),
            failure : process.curry("failure")
        });
    }, function (msg) {
        this.assertEqual("success", msg);

        var a5 = Author.get(5);
        this.assertEqual(5, a5.getId());
        this.assertEqual("Benjamin Pierce", a5.getValue("name"));

        var a6 = Author.get(6);
        this.assertEqual(6, a6.getId());
        this.assertEqual("Benjamin Pierce", a6.getValue("name"));

        var a7 = Author.get(7);
        this.assertEqual(7, a7.getId());
        this.assertEqual("Benjamin Pierce", a7.getValue("name"));

    }));

    // Should not try to operate on requests with wasSuccessful === false.
    tc.addTest(new Test(function () {
        var process = this.processResults.bind(this);
        var pm = new PersistanceManager("testfiles/PersistanceManager.php", {
            fail : "update"
        });

        pm.addAction("fail", new Author());
        pm.commit({
            success : process.curry("success"),
            failure : process.curry("failure")
        });
    }, function (msg) {
        this.assertEqual("failure", msg);
    }));

    // Don't send an empty request, immediately call success.
    var to;
    tc.addTest(new Test(function () {
        var process = this.processResults.bind(this);
        var pm = new PersistanceManager("shouldnotbesent");
        pm.commit({ success : process.curry("success") });
        to = setTimeout(process.curry("timeout"), 100);
    }, function (msg) {
        clearTimeout(to);
        this.assertEqual("success", msg);
    }));

    // Fail if at least one of the responses isn't successful, process the rest.
    tc.addTest(new Test(function () {
        var process = this.processResults.bind(this);
        var pm = new PersistanceManager("testfiles/PersistanceManager.php", {
            fail : "update",
            create : "update"
        });
        var authors = {
            a : new Author(),
            b : new Author()
        }
        pm.addAction("fail", authors.a);
        pm.addAction("create", authors.b);
        pm.commit({
            success : process.curry("success"),
            failure : process.curry("failure", authors)
        });

    }, function (message, authors) {
        this.assertEqual("failure", message);
        this.assert(authors.a.getId() < 0);
        this.assert(authors.b.getId() > 0);
    }));

    return [tc];
};
