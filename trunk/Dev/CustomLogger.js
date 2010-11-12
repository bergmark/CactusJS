/*
 * Copyright (c) 2007-2009, Adam Bergmark
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
 */
Cactus.Dev.CustomLogger = (function () {
    var tag;
    var $f;
    var EventManager;
    var Event;
    var C = Cactus;

    function CustomLogger() {
        // Avoid explicit references to these modules, so they can make use of
        // the logger.
        tag = C.DOM.tag;
        $f = C.DOM.selectFirst;
        EventManager = C.DOM.EventManager;
        Event = C.DOM.Event;

        this.logMessages = tag("ul", {
            className : "log_messages",
            style : {
                borderTop : "1px solid white",
                padding : "12px"
            }
        });
        this.logContainer = tag("ul", {
            className : "log_container",
            style : {
                width : "80%",
                height : "30%",
                left : "10%",
                top : "10%",
                backgroundColor : "#000",
                position : "absolute",
                opacity : 50,
                color : "white",
                fontFamily : "monaco, monospace",
                overflow : "auto"
            }
        }, [
            tag("div", {
                className : "buttons",
                style : {
                    padding : "5px"
                }
            }, [
                tag("input", { type : "button", className : "log_clear", value : "clear" }),
                tag("input", { type : "button", className : "log_move", value : "move" }),
                tag("label", { style : { paddingLeft : "10px" } }, "W"),
                tag("input", { type : "text", className : "log_width", size : 4 }),
                tag("label", { style : { paddingLeft : "10px" } }, "H"),
                tag("input", { type : "text", className : "log_height", size : 4 })
            ]),
            this.logMessages
        ]);
        this.em = new EventManager();
        this.moveEm = new EventManager();
        this.em.add($f(".log_clear", this.logContainer), "click", this.clear.bind(this));
        document.body.appendChild(this.logContainer);
        this.em.add($f(".log_move", this.logContainer), "click", this._startMove.bind(this));
        this.em.add($f(".log_width", this.logContainer), "change", this._setWidth.bind(this));
        this.em.add($f(".log_height", this.logContainer), "change", this._setHeight.bind(this));
    } CustomLogger.prototype = {
        log : function (s) {
            this.logMessages.appendChild(tag("li", { style : { margin : "0" } }, s));
        },
        clear : function () {
            this.logMessages.innerHTML = "";
        },
        detach : function () {
            this.em.detach();
            this._stopMove();
            document.body.removeChild(this.logContainer);
        },
        moving : false,
        _startMove : function () {
            if (this.moving) {
                return;
            }
            this.moving = true;
            // If added at the spot, document click triggers on the start click.
            setTimeout(this.moveEm.add.bind(this.moveEm, document, "click", this._stopMove.bind(this)), 0);
        },
        _stopMove : function (e) {
            e = new Event(e);
            if (!this.moving) {
                return;
            }
            this.moving = false;
            this.moveEm.detach();
            this.logContainer.style.left = e.getMouseX() + "px";
            this.logContainer.style.top = e.getMouseY() + "px";
        },
        _setWidth : function () {
            this.logContainer.style.width = $f(".log_width", this.logContainer).value + "px";
        },
        _setHeight : function () {
            this.logContainer.style.height = $f(".log_height", this.logContainer).value + "px";
        }
    };

    return CustomLogger;
})();
