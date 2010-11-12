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

Cactus.UnitTest.MVC.View.CompositeValidation = function () {
    var log = Cactus.Dev.log;
    var TestCase = Cactus.Dev.UnitTest.TestCase;
    var Test = Cactus.Dev.UnitTest.Test;
    var Validation = Cactus.MVC.View.Validation;
    var CompositeValidation = Cactus.MVC.View.CompositeValidation;
    var Template = Cactus.MVC.View.Template;
    var $f = Cactus.DOM.selectFirst;
    var $ = Cactus.DOM.select;
    var Element = Cactus.DOM.Element;
    var setValue = Element.setValue.bind(Element);
    var getValue = Element.getValue.bind(Element);
    var JSON = Cactus.Util.JSON;
    var stringify = JSON.stringify;

    var tc = new TestCase("MVC.View.CompositeValidation");

    function makeValidation(formName, elementName, validationConstraints) {
        validationConstraints = validationConstraints
            || [{ mandatory : true, violationMsg : "Mandatory." }]

        var validationData = {};
        validationData["%s_%s".format(formName, elementName)] =
            validationConstraints;
        var template = Template.create('\
          <form id="%s" action="/">\
            <input type="text" id="%s_%s" value="">\
            <div id="%s_%s_error"></div>\
          </form>\
        '.format(formName,
                 formName, elementName,
                 formName, elementName));
        var form = template.getRootElement();
        var element = form.elements["%s_%s".format(formName, elementName)];
        var error = $f("#%s_%s_error".format(formName, elementName), form);
        var validation = new Validation(validationData, form);

        return {
            validation : validation,
            form : form,
            element : element,
            error : error
        };
    }

    function makeComposite() {
        var v1 = makeValidation("foo", "bar");
        var v2 = makeValidation("baz", "bax");
        var composite = new CompositeValidation([v1.validation, v2.validation]);
        return {
            v1 : v1,
            v2 : v2,
            composite : composite
        };
    }

    function getUIErrors(v) {
        if (!v.error.firstChild) {
            return "";
        }
        var lis = $("li", v.error);
        var errors = [];
        for (var i = 0; i < lis.length; i++) {
            errors.push(getValue(lis[i]));
        }
        return errors.join(",");
    }

    // allValid.
    tc.addTest(function () {
        var o = makeComposite();
        this.assertFalse(o.composite.allValid());
        setValue(o.v1.element, "x");
        setValue(o.v2.element, "x");
        this.assert(o.composite.allValid());
    });
    // validateHidden.
    tc.addTest(function () {
        var o = makeComposite();
        this.assertFalse(o.composite.validateHidden("foo_bar"));
        setValue(o.v1.element, "x");
        this.assert(o.composite.validateHidden("foo_bar"));

        this.assertFalse(o.composite.validateHidden("baz_bax"));

        this.assertException(/Could not find/i,
                             o.composite.validateHidden.bind(
                                 o.composite, "qux_qax"));
    });
    // validateVisible.
    tc.addTest(function () {
        var o = makeComposite();

        this.assertFalse(o.composite.validateVisible("foo_bar"));
        this.assertEqual("Mandatory.", getUIErrors(o.v1));

        setValue(o.v1.element, "x");
        this.assert(o.composite.validateVisible("foo_bar"));
        this.assertEqual("", getUIErrors(o.v1));
    });
    // isValid.
    tc.addTest(function () {
        var o = makeComposite();
        this.assertFalse(o.composite.isValid("foo_bar"));
        setValue(o.v1.element, "y");
        this.assert(o.composite.isValid("foo_bar"));
    });
    // allValidated.
    tc.addTest(function () {
        var o = makeComposite();
        this.assertFalse(o.composite.allValidated());
        o.v1.validation.validateHidden("foo_bar");
        this.assertFalse(o.composite.allValidated());
        o.v2.validation.validateHidden("baz_bax");
        this.assert(o.composite.allValidated());
    });
    // validateAll.
    tc.addTest(function () {
        var o = makeComposite();
        o.composite.validateAll();
        this.assert(o.composite.allValidated());
    });
    // getViolationMessages.
    tc.addTest(function () {
        var o = makeComposite();
        o.composite.validateAll();
        var messages = o.composite.getViolationMessages();
        this.assert(!(messages instanceof Array));
        var messageCount = 0;
        for (var p in messages) {
            messageCount++;
            this.assertInstance(Array, messages[p]);
        }
        this.assertEqual(2, messageCount);
    });
    // getViolationMessagesFor.
    tc.addTest(function () {
        var o = makeComposite();
        this.assertEqual(0,
                         o.composite.getViolationMessagesFor("foo_bar").length);
        o.composite.validateHidden("foo_bar");
        this.assertEqual(1,
                         o.composite.getViolationMessagesFor("foo_bar").length);
    });
    // Custom validations.
    tc.addTest(function () {
        var valid = true;
        var v = makeValidation("foo", "bar",
            [{custom:true, func : function () { return valid; }}]);

        var cv = new CompositeValidation([
            v.validation
        ]);
        cv.validateHidden("foo_bar");
    });

    tc.addTest(function () {
        var valid = true;
        var o = makeComposite();

        o.composite.failHidden("foo_bar", "hidden");
        o.composite.failVisible("foo_bar", "visible");
        this.assertEqual(stringify(["hidden", "visible"]),
                         stringify(getValue($f("ul", o.v1.error))));
    });

    // _getElement.
    tc.addTest(function () {
        var o = makeComposite();
        setValue(o.composite._getElement("foo_bar"), "x");
        this.assertEqual("x", getValue(o.composite._getElement("foo_bar")));
    });

    // getElementValue.
    tc.addTest(function () {
        var o = makeComposite();
        setValue(o.composite._getElement("foo_bar"), "x");
        this.assertEqual("x", o.composite.getElementValue("foo_bar"));
    });

    return [tc];
};

