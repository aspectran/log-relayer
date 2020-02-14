function LogtailViewer(endpoint, tailers) {
    this.endpoint = endpoint;
    this.tailers = tailers;
    this.socket = null;
    this.heartbeatTimer = null;
    this.scrollTimer = null;

    this.openSocket = function() {
        if (this.socket) {
            this.socket.close();
        }
        let url = new URL(this.endpoint, location.href);
        url.protocol = url.protocol.replace('https:', 'wss:');
        url.protocol = url.protocol.replace('http:', 'ws:');
        this.socket = new WebSocket(url.href);
        let self = this;
        this.socket.onopen = function (event) {
            self.printEventMessage("Socket connection successful");
            self.socket.send("JOIN:" + self.tailers);
            self.heartbeatPing();
            self.switchTailBite(false, true);
        };
        this.socket.onmessage = function (event) {
            if (typeof event.data === "string") {
                if (event.data === "--heartbeat-pong--") {
                    self.heartbeatPing();
                    return;
                }
                let msg = event.data;
                let idx = msg.indexOf(":");
                if (idx !== -1) {
                    self.printMessage(msg.substring(0, idx), msg.substring(idx + 1));
                }
            }
        };
        this.socket.onclose = function (event) {
            self.printEventMessage('Socket connection closed. Please refresh this page to try again!');
            self.closeSocket();
        };
        this.socket.onerror = function (event) {
            console.error("WebSocket error observed:", event);
            self.printErrorMessage('Could not connect to WebSocket server');
            self.switchTailBite(false, false);
            setTimeout(function () {
                self.openSocket();
            }, 60000);
        };
    };

    this.closeSocket = function() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    };

    this.heartbeatPing = function() {
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
        }
        let self = this;
        this.heartbeatTimer = setTimeout(function () {
            if (self.socket) {
                self.socket.send("--heartbeat-ping--");
                self.heartbeatTimer = null;
                self.heartbeatPing();
            }
        }, 57000);
    };

    this.printMessage = function(tailer, text) {
        let self = this;
        setTimeout(function () {
            self.launchMissile(text);
        }, 1);
        let line = $("<p/>").text(text);
        let logtail = $("#" + tailer);
        logtail.append(line);
        this.scrollToBottom(logtail);
    };

    this.printEventMessage = function(text, tailer) {
        let logtail = (tailer ? $("#" + tailer) : $(".log-tail"));
        $("<p/>").addClass("event").html(text).appendTo(logtail);
        this.scrollToBottom(logtail);
    };

    this.printErrorMessage = function(text, tailer) {
        let logtail = (tailer ? $("#" + tailer) : $(".log-tail"));
        $("<p/>").addClass("event error").html(text).appendTo(logtail);
        this.scrollToBottom(logtail);
    };

    this.switchTailBite = function(logtail, status) {
        if (!logtail) {
            logtail = $(".log-tail");
        }
        if (status !== true && status !== false) {
            status = !logtail.data("bite");
        }
        if (status) {
            logtail.closest(".log-container").find(".tail-status").addClass("active");
            logtail.data("bite", true);
            this.scrollToBottom(logtail)
        } else {
            logtail.closest(".log-container").find(".tail-status").removeClass("active");
            logtail.data("bite", false);
        }
    };

    this.scrollToBottom = function(logtail) {
        if (logtail.data("bite")) {
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
            }
            this.scrollTimer = setTimeout(function () {
                logtail.scrollTop(logtail.prop("scrollHeight"));
                if (logtail.find("p").length > 11000) {
                    logtail.find("p:gt(10000)").remove();
                }
            }, 300);
        }
    };

    const pattern1 = /^Session ([\w\.]+) complete, active requests=(\d+)/i;
    const pattern2 = /^Session ([\w\.]+) deleted in session data store/i;
    const pattern3 = /^Session ([\w\.]+) accessed, stopping timer, active requests=(\d+)/i;
    const pattern4 = /^Creating new session id=([\w\.]+)/i;

    this.launchMissile = function(line) {
        let idx = line.indexOf("] ");
        if (idx !== -1) {
            line = line.substring(idx + 2);
        }

        let sessionId = "";
        let requests = 0;
        if (pattern1.test(line) || pattern2.test(line)) {
            sessionId = RegExp.$1;
            requests = RegExp.$2||0;
            if (requests > 3) {
                requests = 3;
            }
            requests++;
            let mis = $(".missile-route").find(".missile[sessionId='" + (sessionId + requests) + "']");
            if (mis.length > 0) {
                let dur = 850;
                if (mis.hasClass("mis-2")) {
                    dur += 250;
                } else if (mis.hasClass("mis-3")) {
                    dur += 500;
                }
                setTimeout(function () {
                    mis.remove();
                }, dur);
            }
            return;
        }
        if (pattern3.test(line) || pattern4.test(line)) {
            sessionId = RegExp.$1;
            requests = RegExp.$2||1;
            if (requests > 3) {
                requests = 3;
            }
        }
        if (requests > 0) {
            let min = 3;
            let max = 90 - (requests * 2);
            let top = (Math.floor(Math.random() * (max - min + 1)) + min) + '%';
            $("<div/>")
                .attr("sessionId", sessionId + requests)
                .css("top", top)
                .addClass("missile mis-" + requests)
                .appendTo($(".missile-route"));
        }
    };
}