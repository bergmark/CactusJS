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

Cactus.UnitTest.MVC.Model.ActiveRecord = function () {
    var log = Cactus.Dev.log;
    var Collection = Cactus.Util.Collection;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var ActiveRecord = Cactus.MVC.Model.ActiveRecord;
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;
    var KVC = Cactus.Util.KeyValueCoding;
    var ArrayController = Cactus.MVC.Model.ArrayController;
    var ValueObject = Cactus.MVC.Model.ValueObject;

    var tc = new TestCase("MVC.Model.ActiveRecord");

    function Book(author, title) {
        this.author = author;
        // Alternatively use several authors, this does of course not make sense
        // in a model, but it's useful while testing.
        this.authors = new ArrayController();
        this.title = title;
        ActiveRecord.call(this);
    } Book.prototype = {
        saveURL : "testfiles/save-id-3.php",
        updateURL : "testfiles/bookdata.txt",

        author : "",
        authors : null,
        authorAggregate : null,
        title : "",
        setTitle : function (title) {
            this.title = title;
        },

        inject : function (hash) {
            this._injectAggregate(hash, "authorAggregate", Author);
            this._injectAC(hash, "authors", Author);
            ActiveRecord.prototype.inject.call(this, hash);
        }
    };
    Book.extend(ActiveRecord);

    // Create an aggregate for Book.
    function Author(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
        ActiveRecord.call(this);
    }
    Author.extend(ActiveRecord);



    tc.setup = function () {
        // Hack to clear the identity map.
        Book.prototype.__getIdentityMap().objects = {};
    };

    tc.addTest (function () {

        // Create a new empty object.
        var book = new Book();

        // Populate.
        book.author = "Kent Beck";
        book.title = "Extreme Programming Explained";

        // Serialize.
        var hash = book.serialize();
        this.assertEqual("Kent Beck", hash.author);
        this.assertEqual("Extreme Programming Explained", hash.title);
        this.assertFalse("setTitle" in hash);
        // Should not include properties prefixed with underscores.
        //this.assertFalse("_save" in hash);

        // Insert data from JSON.
        book.inject({
            author : "Martin Fowler",
            title : "Analysis Patterns"
        });
        this.assertEqual("Martin Fowler", book.author);
        this.assertEqual("Analysis Patterns", book.title);

        // Use KVC if available.
        book.setAuthor = function (author) {
            this.author = author.split("").reverse().join("");
        };
        book.inject({
            author : "Martin Fowler",
            title : "Analysis Patterns"
        });
        this.assertEqual("relwoF nitraM", book.getValue("author"));
        this.assertEqual("Analysis Patterns", book.getValue("title"));

        // Save flag.
        this.assertFalse(book.saved());
    });

    // Serialize with an inner value object.
    tc.addTest(function () {
        var book = new Book();
        function Author(name) {
            this.name = name;
        } Author.extend(ValueObject);
        book.author = new Author("Martin Fowler");

        var json = book.serialize(true);
        this.assertEqual("Martin Fowler", json.author.name);
        json = book.serialize();
        this.assertEqual("Martin Fowler", json.author.name);
    });

    // Serialize inherited properties.
    tc.addTest(function () {
        function A() {
            this.b = 22;
            ActiveRecord.call(this);
        } A.prototype = {
            a : 1, // This property will never be overriden.
            b : 2, // Will be overriden in A's constructor.
            c : 3 // Will be overriden in B's constructor.
        };
        A.extend(ActiveRecord);

        function B() {
            this.c = 33;
            A.call(this);
        } B.prototype = {
            d : 4 // Never overriden.
        };
        B.extend(A);

        var hash = (new B()).serialize();
        this.assertEqual(33, hash.c);
        this.assertEqual(22, hash.b);
        this.assertEqual(4, hash.d);
        this.assertEqual(1, hash.a);
    });

    // Don't serialize errors property.
    tc.addTest(function() {
        this.assertFalse("errors" in (new Book().serialize()),
                        "`errors` property was serialized.");
    });

    // Inject should be able to receive a hash.
    tc.addTest(function () {
        var book = new Book();
        book.inject({
            author : "Martin Fowler",
            title : "Refactoring"
        });
        this.assertEqual("Martin Fowler", book.getValue("author"));
        this.assertEqual("Refactoring", book.getValue("title"));
    });

    // Serializing should not include properties with underscores.
    tc.addTest(function () {
        var book = new Book("Abelson, Sussman", "SICP");
        var hash = book.serialize(true);
        this.assertFalse("_saved" in hash);
    });


    // id cannot be changed after it's set.
    tc.addTest(function () {
        var book = new Book("Abelson, Sussman", "SICP");
        book.setId(40);
        this.assertException(/already set/i,
                             book.setId.bind(book, 41));
    });

    // Throw error if setId(id) doesn't have a unique ID.
    tc.addTest(function () {
        var book1 = new Book("Abelson, Sussman", "SICP");
        book1.setId(50);
        var book2 = new Book("Eric Evans", "Domain-Driven Design");
        this.assertException(/already exists/i,
                             book2.setId.bind(book2, 50));
    });

    // Should serialize aggregate ActiveRecord objects.
    tc.addTest(function () {
        var book = new Book(new Author("Martin", "Fowler"), "Refactoring");

        var hash = book.serialize(true);
        this.assertEqual("Refactoring", hash.title);
        this.assert(hash.author instanceof Object, "Author is not a hash.");
        this.assertEqual("Martin", hash.author.firstName);
        this.assertEqual("Fowler", hash.author.lastName);
    });

    // Should be able to do a shallow serialization where aggregate AR's are
    // not serialized with the data field.
    tc.addTest(function () {
        var author = new Author();
        author.inject({
            id : 3,
            firstName : "Martin",
            lastName : "Fowler"
        });
        var book = new Book();
        book.inject({
            id : 4
        });

        book.setValue("author", author);

        this.assertEqual("Martin", book.getValue("author.firstName"));

        // Deep serialization on AR aggregate.
        var serialized = book.serialize(true);
        this.assertEqual("Martin", serialized.author.firstName);

        // Shallow serialization on AR aggregate.
        serialized = book.serialize();
        this.assertEqual(3, serialized.author);

        // If the aggregate is an array controller, an array of ID's should be
        // returned when shallow serialization is requested.
        book.setValue("author", new ArrayController([author]));
        var shallow = book.serialize();
        this.assertInstance(Array, shallow.author);
        this.assertEqual(1, shallow.author.length);
        this.assertEqual(3, shallow.author[0]);
    });

    // Should serialize aggregate ArrayControllers.
    tc.addTest(function () {
        // Use several authors.
        var ac = new ArrayController([
            new Author("Harold", "Abelson"),
            new Author("Gerald", "Sussman")
        ]);
        var book = new Book(ac, "SICP");

        var hash = book.serialize(true);
        this.assertEqual("SICP", hash.title);
        this.assert("author" in hash, "author not in hash.");
        this.assertEqual("Harold", hash.author[0].firstName);
        this.assertEqual("Abelson", hash.author[0].lastName);
        this.assertEqual("Gerald", hash.author[1].firstName);
        this.assertEqual("Sussman", hash.author[1].lastName);

        ac.get(0).setId(123);
        ac.get(1).setId(124);

        // Do a shallow serialization.
        hash = book.serialize();
        this.assertInstance("number", hash.author[0]);
        this.assertEqual('123,124', hash.author.join(","));
    });

    // If the id is injected, the objects should be added to the ID map.
    tc.addTest(function () {
        var book = new Book();
        book.inject({
            author : "Richard P. Gabriel",
            title : "Patterns of Software",
            id : 37
        });
        var book = Book.get(37);

        this.assertEqual("Richard P. Gabriel", book.getValue("author"));
    });

    // Do not serialize aggregates twice.
    tc.addTest(function () {
        var book = new Book();
        book.setId(78);
        var author = new Author();
        author.inject({
            firstName : "Richard",
            lastName : "Gabriel",
            id : 37
        });
        book.author = author;
        var serialized = JSON.stringify(book.serialize());
        this.assert(serialized.indexOf("\\") === -1,
                   "There are escaped characters in the serialized string.");
    });

    // Should not throw an error if trying to serialize with unsaved aggregates.
    tc.addTest(function () {
        var book = new Book();
        book.setId(78);
        book.setSaved(true);
        var author = new Author();
        author.inject({
            firstName : "Richard",
            lastName : "Gabriel"
        });
        book.author = author;
        this.assert(book.saved(), "Not saved.");
        this.assertFalse(author.saved(), "Saved.");

        book.serialize();
    });

    // Until an object receives an ID from inject or a save request it should
    // be marked as new.
    tc.addTest(function () {
        var book = new Book();
        this.assert(book.isNew());
        book.inject({
            id : 1234
        });
        this.assertFalse(book.isNew(),
                         "`book` should not be marked as new.");
    });

    // getAll should return all loaded objects.
    tc.addTest(function () {
        var book1 = new Book();
        var book2 = new Book();

        var books = Book.getLoaded();
        this.assertEqual(2, books.length);
        this.assert(Collection.hasValue(books, book1));
        this.assert(Collection.hasValue(books, book2));

        // Don't return the same object more than once.

        book1.setId(1);
        books = Book.getLoaded();
        this.assertEqual(2, books.length);
        this.assertEqual(2, Array.unique(books).length);
    });

    // Objects can be fetched directly if the client knows they are already
    // loaded into memory.
    tc.addTest(function () {
        var book = new Book();
        book.inject({
            id : 3,
            author : "Martin Fowler",
            title : "Refactoring"
        });
        this.assertEqual(book, Book.get(3));
        this.assertException(/No object with id=4 found in memory/i,
                             Book.get.bind(Book, 4));
    });

    // When an object is created it should be assigned a negative ID.
    tc.addTest(function () {
        var a = new Book();
        var b = new Book();
        this.assert(a.getId() < 0,
                    "id was: %s".format(stringify(a.getId())));
        this.assert(b.getId() < 0,
                    "id was: %s".format(stringify(b.getId())));
        this.assert(a.getId() !== b.getId());
    });

    // When giving a new object a positive id, the negative id should still
    // remain in the id map.
    tc.addTest(function () {
        var book = new Book();
        var id = book.getId();
        book.inject({
            id : 2
        });
        this.assertEqual(book, Book.get(id));
        this.assertEqual(book, Book.get(2));

        // Throw an error if the ID is set again.
        this.assertException(/id is already set/i,
                             book.inject.bind(book, {
                                 id : 3
                             }));
    });

    // OnValueChanged should trigger when the ID changes.
    tc.addTest(function () {
        var book = new Book();
        var triggered = false;
        book.subscribe("ValueChanged", function () {
            triggered = true;
        });
        book.inject({
            id : 1
        });
        this.assert(triggered);
    });

    // addStaticMethods should add a load method that takes an array of
    // serialized objects and unserializes them.
    tc.addTest(function () {
        Book.load([{
            id : 1,
            title : "SICP"
        }, {
            id : 2,
            title : "TaPL"
        }]);

        this.assertEqual("SICP", Book.get(1).getValue("title"));
        this.assertEqual("TaPL", Book.get(2).getValue("title"));
    });

    // _injectAC.
    tc.addTest(function () {
        var book = new Book();
        book.inject({
            authors : [{
                lastName : "Abelson"
            }, {
                lastName : "Sussman"
            }]
        });

        this.assertInstance(Author, book.authors.get(0));
        this.assertEqual("Abelson",
                         book.authors.get(0).getValue("lastName"));
        this.assertEqual("Sussman",
                         book.authors.get(1).getValue("lastName"));
    });

    // _injectAggregate.
    tc.addTest(function () {
        var book = new Book();
        book.inject({
            authorAggregate : {
                lastName : "Sussman"
            }
        });

        this.assertInstance(Author, book.authorAggregate);
        this.assertEqual("Sussman", book.authorAggregate.lastName);
    });

    // Inject through helpers with aggregates being id's in the hash.
    tc.addTest(function () {
        Author.load([{
            id : 1,
            lastName : "Sussman"
        }, {
            id : 2,
            lastName : "Abelson"
        }])
        var book = new Book();
        book.inject({
            authorAggregate : 1,
            authors : [1, 2]
        });

        this.assertInstance(Author, book.authorAggregate);
        this.assertEqual("Sussman", book.authorAggregate.lastName);
        this.assertInstance(Author, book.authors.get(0));
        this.assertEqual("Sussman", book.authors.get(0).lastName);

        // Injecting AC values again should clear the AC.
        book.inject({
            authors : []
        });
        this.assertEqual(0, book.authors.count());
    });

    // Should not be able to call setId with a negative int.
    tc.addTest(function () {
        var book = new Book();
        var id = book.getId();
        this.assert(id < 0);
        this.assertException(/id is not positive/i,
                             book.setId.bind(book, id - 1));
    });


    // Define aggregate types for inject using a shorthand.
    (function () {
        function Author() {

        } Author.prototype = {
            name : ""
        };
        Author.extend(ActiveRecord);
        function Publisher() {

        } Publisher.prototype = {
            name : ""
        };
        Publisher.extend(ActiveRecord);
        function Book() {

        } Book.prototype = {
            title : "",
            _aggregates : {
                publisher : { constructor : Publisher }
            }
        };
        Book.extend(ActiveRecord);


        tc.addTest(function () {
            Publisher.load([{
                id : 1,
                name : "Addison-Wesley"
            }]);
            Book.load([{
                id : 2,
                publisher : 1,
                title : "Gang of Four"
            }]);

            var gof = Book.get(2);
            this.assertEqual("Gang of Four", gof.title);
            this.assert("publisher" in gof);
            this.assertEqual("Addison-Wesley", gof.publisher.name);

            this.assertException(/property not correctly set: publisher/i,
                                 Book.load.bind(Book, [{ id : 3, title : "x" }]));

            function Book2() {
            } Book2.prototype = {
                _aggregates : {
                    publisher : { constructor : Publisher, allowNull : false }
                }
            };
            Book2.extend(ActiveRecord);
            this.assertException(/property not correctly set: publisher/i,
                                 Book2.load.bind(Book, [{ id : 4 }]));

            function Book3() {
            } Book3.prototype = {
                _aggregates : {
                    publisher : { constructor : Publisher, allowNull : true }
                }
            };
            Book3.extend(ActiveRecord);
            Book3.load([{ id : 5 }]);

            function Book4() {
            } Book4.prototype = {
                _aggregates : {
                    authors : { constructor : Author, oneToMany : true }
                }
            };
            Book4.extend(ActiveRecord);

            Book4.load([{ id : 6 }]);

            this.assertInstance(ArrayController, Book4.get(6).getValue("authors"));

            Author.load([
                { id : 8, name : "Erich Gamma" },
                { id : 9, name : "Richard Helm" },
                { id : 10, name : "Ralph Johnson" },
                { id : 11, name : "John Vlissides" }
            ]);
            Book4.load([{ id : 7, authors : [8, 9] }]);

            var book7 = Book4.get(7);
            this.assertEqual(2, book7.getValue("authors").count());
            this.assertEqual(8, book7.getValue("authors").get(0).getValue("id"));
            this.assertEqual(9, book7.getValue("authors").get(1).getValue("id"));

            // Injecting new objects to the AC should remove previous ones.
            book7.inject({ authors : [10, 11] });
            this.assertEqual(2, book7.getValue("authors").count());

            // Should support ValueObject aggregates
            function AuthorVO() {

            } AuthorVO.prototype = {
                name : ""
            };
            AuthorVO.extend(ValueObject);
            function Book5() {
            } Book5.prototype = {
                _aggregates : {
                    author : { constructor : AuthorVO },
                    authors : { constructor : AuthorVO, oneToMany : true }
                }
            };
            Book5.extend(ActiveRecord);

            Book5.load([{
                id : 8,
                authors : [{ name : "a" }, { name : "b" }],
                author : { name : "c" }
            }]);

            var book8 = Book5.get(8);

            this.assertEqual("c", book8.getValue("author.name"));
            this.assertEqual(2, book8.getValue("authors").count());
        });
    })();

    // Should have an errors property storing errors.
    tc.addTest(function () {
        function A() {
            ActiveRecord.call(this);
        } A.prototype = {

        };
        A.extend(ActiveRecord);

        this.assert("errors" in A.prototype);
        var a = new A();
        this.assertInstance(ArrayController, a.getErrors());
        this.assertFalse(a.hasErrors());
        a._addError("foo");
        this.assert(a.hasErrors());
        this.assertEqual("foo", a.getErrors().get(0));

        A.load([{ id : 3, errors : ["error message"] }]);
        this.assertEqual("error message", A.get(3).getErrors().get(0));
    });

    // Static delete method.
    tc.addTest(function () {
        var a = new Book("a");
        a.setId(3);
        Book.remove(a);
        var b = new Book("b");
        b.setId(3);
        this.assertEqual(b, Book.get(3));
    });

    // Throw descriptive error if aggregate object is not initialized properly.
    tc.addTest(function () {
        function A() {
            // Left out ActiveRecord.call(this);
        }
        A.extend(ActiveRecord);
        function B() {
            ActiveRecord.call(this);
        }
        B.extend(ActiveRecord);

        var b = new B();
        b.a = new A();
        this.assertException(/uninitialized aggregate/, b.serialize.bind(b));
    });

    // Send out onValueChanged for the id field.
    tc.addTest(function () {
        function A() {
            ActiveRecord.call(this);
        }
        A.extend(ActiveRecord);
        var a = new A();
        var triggered = false;
        a.subscribe("ValueChanged", function () {
            triggered = true;
        }.filter(undefined, "id"));
        a.inject({
            id : 10083
        });
        this.assertEqual(10083, a.getId());
        this.assert(triggered);
    });

    // Aggregates AR instances should be able to be generated dynamically.
    tc.addTest(function () {
        var ns = {};

        ActiveRecord.create({
            className : "Author",
            atomic : ["name"]
        }, ns);
        var Author = ns.Author;

        var fowler = new Author();
        fowler.inject({ name : "Martin Fowler" });
        this.assertEqual("Martin Fowler", fowler.getValue("name"));

        // Create accessors.
        fowler.setName("Kent Beck");
        this.assertEqual("Kent Beck", fowler.getName());
        // Trigger onValueChanged.
        var triggered = false;
        var test = this;
        fowler.subscribe("ValueChanged", function (o, kp) {
            test.assertEqual(fowler, o);
            test.assertEqual("name", kp);
            triggered = true;
        });
        fowler.setName("Martin Fowler");
        this.assert(triggered,
                    "ValueChanged did not trigger when using dynamically generated setter.");

        ActiveRecord.create({
            className : "Book",
            atomic : ["title"],
            aggregates : {
                author : { className : "Author" }
            }
        }, ns);
        var Book = ns.Book;
        var refactoring = new Book();
        refactoring.inject({
            title : "Refactoring",
            authorId : fowler.getId()
        });
        this.jsoneq({ id : refactoring.getId(), title : "Refactoring", authorId : fowler.getId() },
                    refactoring.serialize());

        this.assertEqual(fowler.getId(), refactoring.getAuthorId());
        var beck = new Author();
        beck.inject({ name : "Kent Beck" });
        refactoring.setAuthorId(beck.getId());
        this.assertEqual(beck, refactoring.getAuthor());
        this.assertEqual(beck.getId(), refactoring.getAuthorId());

        // Don't break if empty hash/array is passed to create.
        ActiveRecord.create({className : "X", aggregates:{},atomic:[]}, ns);
    });

    // The order of class generation should not matter.
    tc.addTest(function () {
        var ns = {};
        ActiveRecord.create({
            className : "Book",
            aggregates : {
                author : { className : "Author" }
            }
        }, ns);
        ActiveRecord.create({
            className : "Author"
        }, ns);
        var b = new ns.Book();
        var a = new ns.Author();
        b.setAuthorId(a.getId());
        this.assertEqual(a, b.getAuthor());

        var ns = {};
        ActiveRecord.create({
            className : "Author",
            aggregates : {
                book : { className : "Book", allowNull : true }
            }
        }, ns);
        ActiveRecord.create({
            className : "Book"
        }, ns);
        var author = new ns.Author();
        var book = new ns.Book();
        author.inject({
            bookId : book.getId()
        });
    });

    // Create with has many.
    tc.addTest(function () {
        var ns = {};
        ActiveRecord.create({
            className : "Book"
        }, ns);
        ActiveRecord.create({
            className : "Author",
            aggregates : { books : { className : "Book", oneToMany : true } }
        }, ns);
        var a = new ns.Author();
        var b = new ns.Book();
        a.addBook(b);
        this.assertEqual(b, a.getBook(0));
        this.assertEqual(1, a.bookCount());
        this.assert(a.hasBook(b));
        a.removeBook(b);
        a.addBook(b);
        this.assertEqual(0, a.indexOfBook(b));
        this.assert(a.booksHasIndex(0));
        a.removeBookAtIndex(b);
        var b2 = new ns.Book();
        a.addBook(b2);
        a.swapBooks(0, 1);
        a.removeBook(b2);
        a.clearBooks();
        a.addBook(b);
        a.replaceBook(b, b2);
        a.addBookAtIndex(0, b);
    });

    return [tc];
};
