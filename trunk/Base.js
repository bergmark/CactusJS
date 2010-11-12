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
 *
 * Defines namespaces for all packages. Additional external namespaces
 * may be added to this object or to a completely different one.
 */
window.Cactus = {
    Local : {},
    /**
     * Addition to built-in types, such as Array, String and Function.
     * These packages should not have any dependencies on other packages,
     * not even other Addons.
     */
    Addon : {},
    /**
     * General purpose classes that can be used by any other package,
     * They may not have any dependencies outside of the package,
     * except to Addon.
     */
    Util : {},
    /**
     * Development tools.
     */
    Dev : {
        /**
         * Event based unit testing library.
         */
        UnitTest : {}
    },
    /**
     * Temporary package for modules whose location hasn't been decided.
     */
    Uncategorized : {},
    /**
     * Contains modules for working with the browser DOM.
     */
    DOM : {
        Animation : {}
    },
    /**
     * Larger components used to build applications.
     */
    MVC : {
        Model : {},
        View : {
            TemplateHelpers : {}
        },
        Controller : {}
    },
    /**
     * Controls communication with the server side.
     */
    Remote : {},
    /**
     * Actual unit tests used by the Dev.EventUnitTest
     * package to perform tests.
     */
    UnitTest : {
        Addon : {},
        Dev : {
            UnitTest : {}
        },
        DOM : {
            Animation : {}
        },
        MVC : {
            Model : {},
            View : {
                TemplateHelpers : {}
            },
            Controller : {}
        },
        Remote : {},
        Util : {}
    }
};
