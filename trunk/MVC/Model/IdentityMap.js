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

/**
 * @file
 * Keeps track of objects using a custom id that
 * the client specifies.
 *
 * It's simple to use, add objects with add(id, obj), check if an object is
 * added with has(id) and get an object with get(id). Remove with rem(id).
 */
Cactus.MVC.Model.IdentityMap = (function () {
    var log = Cactus.Dev.log;
    var EventSubscription = Cactus.Util.EventSubscription;

    function IdentityMap() {
        this.objects = {};
    } IdentityMap.prototype = {
        // Events.
        /**
         * Sent when a new object is added to the id map.
         *
         * @param string key
         *   The key the new object was added under.
         * @param mixed object
         *   The added object.
         */
        onAdded : Function.empty,
        /**
         * @param string key
         *   The key that was removed.
         * @param mixed object
         *   The removed object.
         */
        onRemoved : Function.empty,

        /**
         * @param Hash<string, mixed>
         *   Stored objects.
         */
        objects : {},
        /**
         * Adds an object to the id map.
         *
         * @param string id
         *   The unique id to store the object under.
         * @param mixed obj
         *   The object to store.
         */
        add : function (id, obj) {
            id = String(id);
            if (id in this.objects) {
                if (obj == this.get(id)) {
                    throw new Error(
                        "The object is already stored under the id=" + id);
                } else {
                    throw new Error(
                        "Another object is already stored under id=" + id);
                }
            }
            this.objects[id] = obj;
            this.onAdded(id, obj);
        },
        /**
         * Checks whether an object is stored under the id.
         *
         * @param string id
         * @return bool
         */
        has : function (id) {
            return id in this.objects;
        },
        /**
         * Checks whether the id map has an object under a specified id and
         * throws an error if not. Use this only when it would be a client
         * error to not make sure the id exists.
         *
         * @param string id
         */
        _hasStrict : function (id) {
            if (!this.has(id)) {
                throw new Error("IdentityMap:_hasStrict: Non-existant id=%s specified.".format(id));
            }
        },
        /**
         * Fetches the object stored under the specified id. Make sure the
         * id exists before calling.
         *
         * @param string id
         * @return mixed
         */
        get : function (id) {
            this._hasStrict(id);
            return this.objects[id];
        },
        /**
         * @return Array<string id, mixed object>
         *   A hash of all objects stored in the id map, with their keys
         *   as keys of the Hash.
         */
        getAll : function () {
            var objects = [];
            for (var p in this.objects) {
                objects.push(this.objects[p]);
            }
            return objects;
        },
        /**
         * Removes an object from the map. If the object is stored under several
         * keys, all of the keys are removed.
         *
         * @param mixed object
         */
        remove : function (object) {
            var removed = false;
            for (var p in this.objects) {
                if (this.objects[p] === object) {
                    delete this.objects[p];
                    this.onRemoved(p, object);
                    removed = true;
                }
            }
            if (!removed) {
                throw new Error("IdentityMap:remove: Object  %s not in map."
                                .format(object));
            }
        }
    };
    EventSubscription.implement(IdentityMap);

    return IdentityMap;
})();
