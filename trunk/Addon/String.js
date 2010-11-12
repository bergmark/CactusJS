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
 * Forces the first character of a string to uppercase.
 *
 * @return string
 *   The capitalized string.
 */
String.prototype.capitalize = function () {
    return this.charAt (0).toUpperCase() + this.slice (1);
};
/**
 * Removes all underscores and turns the succeeding character into uppercase.
 *
 * @return string
 *   The camel cased string.
 */
String.prototype.camelCase = function () {
    return this.replace (/_(.)/g, function (str, character) {
        return character.toUpperCase();
    });
};
/**
 * Turns camelcasing into underscores, that is, abCdEf turns into ab_cd_ef.
 *
 * @return string
 *   The underscored string
 */
String.prototype.underscore = function () {
    return this.replace (/[A-Z]/g, function (match) {
        return "_" + match.toLowerCase();
    });
};
/**
 * Formats a string in a printf like manner. Insert %s where you want to insert
 * a substring and pass the arguments in the same order as the %s's occur.
 *
 * @param mixed *args
 *   Arguments to replace the %s's with.
 */
String.prototype.format = function () {
    var s = this;
    for (var i = 0; i < arguments.length; i++) {
        s = s.replace ("%s", arguments [i]);
    }
    return s;
};
/**
 * Checks whether a string has the given prefix.
 * The empty string is a prefix of every string.
 *
 * @param string prefix
 * @return boolean
 */
String.prototype.hasPrefix = function (prefix) {
    return this.substring(0, prefix.length) === prefix;
};
/**
 * Checks whether a string has the given suffix.
 * The empty string is a suffix of every string.
 *
 * @param string suffix
 * @return boolean
 */
String.prototype.hasSuffix = function (suffix) {
    return this.substring(this.length - suffix.length) === suffix;
};
/**
 * Checks whether a string contains the given substring.
 * The empty string is a substring of every string.
 *
 * @param string substring
 * @return boolean
 */
String.prototype.hasSubstring = function (substring) {
    return this.indexOf(substring) !== -1;
};
/**
 * Removes prefixing and trailing whitespace from a string.
 *
 * @return string
 */
String.prototype.trim = function () {
    return this.replace(/^\s+/, "").replace(/\s+$/, "");
};
/**
 * Reverses a string.
 *
 * @return string
 */
String.prototype.reverse = function () {
    return this.split("").reverse().join("");
};
