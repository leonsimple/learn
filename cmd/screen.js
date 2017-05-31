function nextTick(cb) {
	setTimeout(cb, 0)
}
function make4Len16(len) {
	var len16 = len.toString(16);
	while (len16.length < 4) {
		len16 = "0" + len16
	}
	return len16
}
var pendingFuncs;
window.addEventListener("message", function () {
	if (pendingFuncs) {
		$.each(pendingFuncs, function (i, func) {
			func()
		});
		pendingFuncs = null
	}
}, false);
function unsafeCallback(cb) {
	return cb
}
function ab2str(buf) {
	if (buf.constructor.name == "ArrayBuffer") {
		buf = new Uint8Array(buf)
	}
	return String.fromCharCode.apply(null, buf)
}
function str2ab(str, buf, terminate) {
	var len = str.length;
	if (terminate)
		len++;
	if (!buf) {
		buf = new ArrayBuffer(len)
	}
	var bufView = new Uint8Array(buf);
	if (terminate)
		bufView[str.length] = 0;
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i)
	}
	return buf
}
var slashN = "\n".charCodeAt(0);
function writeLine(socket, str, cb) {
	socket.write(str2ab(str + "\n"), cb)
}
function readLine(socket, cb) {
	var pending = [];
	function readMore() {
		socket.read(function (buffer) {
			for (var i = 0; i < buffer.byteLength; i++) {
				if (buffer[i] == slashN) {
					var keep = buffer.subarray(0, i);
					pending.push(keep);
					var data = "";
					for (var b in pending) {
						b = pending[b];
						data += ab2str(b)
					}
					var remaining = buffer.subarray(i + 1);
					socket.unshift(remaining);
					cb(data);
					return
				}
			}
			pending.push(buffer);
			readMore()
		})
	}
	readMore()
}
function readString(socket, cb) {
	var str = "";
	socket.onClose = function () {
		cb(str)
	};
	function reader(data) {
		str += ab2str(data);
		socket.read(reader)
	}
	socket.read(reader)
}
function appendBuffer(buffer1, buffer2) {
	var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(buffer1, 0);
	tmp.set(buffer2, buffer1.byteLength);
	return tmp
}
var timeThing = (new Date).getTime();
function timeTrace(stamp) {
	var now = (new Date).getTime();
	console.log(stamp + ": " + (now - timeThing));
	timeThing = now
}
function bufferToHex(buffer) {
	var view = new Uint8Array(buffer);
	var ret = "";
	for (var b in view) {
		b = view[b];
		if (b < 16)
			ret += "0" + b.toString(16);
		else
			ret += b.toString(16)
	}
	return ret
}
function hexToBuffer(str) {
	var buf = new ArrayBuffer(str.length / 2);
	var view = new Uint8Array(buf);
	for (var i = 0; i < str.length / 2; i++) {
		var c = str.substr(i * 2, 2);
		view[i] = parseInt(c, 16)
	}
	return buf
}
function base64ToArrayBuffer(base64) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		var ascii = binary_string.charCodeAt(i);
		bytes[i] = ascii
	}
	return bytes.buffer
}
function arrayBufferToBase64(buffer) {
	var binary = "";
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return window.btoa(binary)
}
var b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64pad = "=";
function hex2b64(h) {
	var i;
	var c;
	var ret = "";
	for (i = 0; i + 3 <= h.length; i += 3) {
		c = parseInt(h.substring(i, i + 3), 16);
		ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63)
	}
	if (i + 1 == h.length) {
		c = parseInt(h.substring(i, i + 1), 16);
		ret += b64map.charAt(c << 2)
	} else if (i + 2 == h.length) {
		c = parseInt(h.substring(i, i + 2), 16);
		ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4)
	}
	while ((ret.length & 3) > 0) {
		ret += b64pad
	}
	return ret
}
if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, "startsWith", {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.lastIndexOf(searchString, position) === position
		}
	})
}
function getQueryVariable(variable, url) {
	if (!url)
		url = window.location;
	var query = url.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (decodeURIComponent(pair[0]) == variable) {
			return decodeURIComponent(pair[1])
		}
	}
	console.log("Query variable %s not found", variable)
}
Object.fromArray = function (arr) {
	var ret = {};
	for (var i in arr) {
		var val = arr[i];
		ret[val] = val
	}
	return ret
};
$.ajaxTransport("+binary", function (options, originalOptions, jqXHR) {
	if (window.FormData && (options.dataType && options.dataType == "binary" || options.data && (window.ArrayBuffer && options.data instanceof ArrayBuffer || window.Blob && options.data instanceof Blob))) {
		return {
			send: function (headers, callback) {
				var xhr = new XMLHttpRequest,
				url = options.url,
				type = options.type,
				async = options.async || true,
				dataType = options.responseType || "blob",
				data = options.data || null,
				username = options.username || null,
				password = options.password || null;
				xhr.addEventListener("load", function () {
					var data = {};
					data[options.dataType] = xhr.response;
					callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders())
				});
				xhr.open(type, url, async, username, password);
				for (var i in headers) {
					xhr.setRequestHeader(i, headers[i])
				}
				xhr.responseType = dataType;
				xhr.send(data)
			},
			abort: function () {
				jqXHR.abort()
			}
		}
	}
});
function throttleTimeout(token, item, throttle, cb) {
	if (token) {
		clearTimeout(token.timeout)
	} else {
		token = {
			items: []
		}
	}
	token.timeout = setTimeout(function () {
			cb(token.items);
			token.items = []
		}, throttle);
	token.items.push(item);
	return token
}
function copyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.style.position = "fixed";
	textArea.style.top = 0;
	textArea.style.left = 0;
	textArea.style.width = "2em";
	textArea.style.height = "2em";
	textArea.style.padding = 0;
	textArea.style.border = "none";
	textArea.style.outline = "none";
	textArea.style.boxShadow = "none";
	textArea.style.background = "transparent";
	textArea.value = text;
	document.body.appendChild(textArea);
	textArea.select();
	try {
		var successful = document.execCommand("copy")
	} catch (err) {
		console.log("Oops, unable to copy")
	}
	document.body.removeChild(textArea)
}
function showNotification(text) {
	console.log("notification:", text);
	var appName = chrome.runtime.getManifest().name;
	chrome.notifications.create({
		type: "basic",
		iconUrl: "/icon.png",
		title: appName,
		message: text
	})
}
var readers = {};
if (window.chrome && window.chrome.sockets) {
	chrome.sockets.tcp.onReceive.addListener(function (resultData) {
		var socket = readers[resultData.socketId];
		if (socket == null)
			return;
		socket.dataReceived(new Uint8Array(resultData.data))
	});
	chrome.sockets.tcp.onReceiveError.addListener(function (resultData) {
		var socket = readers[resultData.socketId];
		if (socket == null)
			return;
		socket.destroy();
		socket.dataReceived(null)
	})
}
function Socket(options, cb) {
	if (options.socketId) {
		this.socketId = options.socketId;
		readers[this.socketId] = this
	} else {
		chrome.sockets.tcp.create(function (createInfo) {
			this.socketId = createInfo.socketId;
			chrome.sockets.tcp.connect(this.socketId, options.host, options.port, function (result) {
				chrome.runtime.lastError;
				if (!result) {
					readers[createInfo.socketId] = this;
					cb(this)
				} else {
					this.destroy();
					cb(null)
				}
			}
				.bind(this))
		}
			.bind(this))
	}
}
Socket.connect = function (options, cb) {
	return new Socket(options, cb)
};
Socket.pump = function (s1, s2, cb) {
	var writeDone = function () {
		s1.read(reader)
	}
	.bind(s1);
	var reader = function (data) {
		var buffer = data.buffer;
		if (data.byteOffset || data.length != buffer.byteLength) {
			buffer = buffer.slice(data.byteOffset, data.byteOffset + data.length)
		}
		s2.write(buffer, writeDone)
	}
	.bind(s2);
	s1.read(reader);
	s1.onClose = cb
};
Socket.stream = function (s1, s2, cb) {
	Socket.pump(s1, s2, function () {
		s2.destroy();
		if (cb) {
			var tmp = cb;
			cb = null;
			tmp()
		}
	});
	Socket.pump(s2, s1, function () {
		s1.destroy();
		if (cb) {
			var tmp = cb;
			cb = null;
			tmp()
		}
	})
};
Socket.eat = function (s) {
	function reader() {
		s.read(reader)
	}
	reader()
};
Socket.prototype.init = function () {
	chrome.sockets.tcp.onReceive.addListener(function (receiveInfo) {
		if (acceptInfo.socketId != createInfo.socketId) {
			return
		}
	})
};
Socket.prototype.read = function () {
	if (this.pendingCallback) {
		throw new Error("double callback")
	}
	if (this.closed && !this.pending) {
		var cb = this.onClose;
		if (cb) {
			delete this.onClose;
			cb()
		}
		return
	}
	var argc = 0;
	if (arguments[argc].constructor.name == "Number") {
		this.pendingLength = arguments[argc++]
	} else {
		this.pendingLength = 0
	}
	var cb = arguments[argc];
	if (!this.pending || this.paused) {
		this.pendingCallback = cb;
		return
	}
	if (!this.pendingLength) {
		this.pendingLength = this.buffered()
	} else if (this.pendingLength > this.buffered()) {
		this.pendingCallback = cb;
		return
	}
	var data;
	var totalRead = 0;
	while (totalRead < this.pendingLength) {
		var buf = this.pending.shift();
		if (!this.pending.length)
			delete this.pending;
		var add = buf;
		var need = Math.min(add.byteLength, this.pendingLength - totalRead);
		if (need != add.byteLength) {
			var part = add.subarray(0, need);
			var leftover = add.subarray(need);
			this.unshift(leftover);
			add = part
		}
		if (!data && add.byteLength != this.pendingLength)
			data = new Uint8Array(this.pendingLength);
		if (data) {
			data.set(add, totalRead)
		} else {
			data = add
		}
		totalRead += add.byteLength
	}
	cb(data)
};
Socket.prototype.write = function (data, cb) {
	chrome.sockets.tcp.send(this.socketId, data, function (writeInfo) {
		chrome.runtime.lastError;
		if (!writeInfo || writeInfo.resultCode) {
			return
		}
		if (writeInfo.bytesSent < data.byteLength) {
			this.write(data.slice(writeInfo.bytesSent), cb)
		} else {
			cb()
		}
	}
		.bind(this))
};
Socket.prototype.destroy = function (data, cb) {
	chrome.sockets.tcp.close(this.socketId, function () {
		chrome.runtime.lastError
	})
};
Socket.prototype.unshift = function (buffer) {
	if (buffer.byteLength == 0)
		return;
	if (!this.pending)
		this.pending = [buffer];
	else
		this.pending.unshift(buffer)
};
Socket.prototype.dataReceived = function (payload) {
	if (payload && payload.length) {
		var arr = new Uint8Array(payload);
		if (!this.pending)
			this.pending = [arr];
		else
			this.pending.push(arr)
	}
	if (payload == null)
		this.closed = true;
	if (this.paused || !this.pending || !this.pending.length) {
		var cb = this.onClose;
		if (this.closed && cb) {
			delete this.onClose;
			cb()
		}
		return
	}
	var pl = this.pendingLength;
	var cb = this.pendingCallback;
	if (cb) {
		delete this.pendingCallback;
		this.read(pl, cb)
	}
};
Socket.prototype.buffered = function () {
	var ret = 0;
	if (this.pending) {
		for (var buf in this.pending) {
			buf = this.pending[buf];
			ret += buf.byteLength
		}
	}
	return ret
};
Socket.prototype.pause = function () {
	if (this.paused) {
		return
	}
	this.paused = true;
	this.onPause()
};
Socket.prototype.resume = function () {
	if (!this.paused) {
		return
	}
	this.paused = false;
	this.onResume()
};
Socket.prototype.onResume = function () {
	chrome.sockets.tcp.setPaused(this.socketId, false, function () {})
};
Socket.prototype.onPause = function () {
	chrome.sockets.tcp.setPaused(this.socketId, true, function () {})
};
function Server() {}
Server.prototype.__proto__ = Socket.prototype;
Server.prototype.destroy = function () {
	chrome.sockets.tcpServer.close(this.socketId)
};
var listeners = {};
if (window.chrome && window.chrome.sockets) {
	chrome.sockets.tcpServer.onAccept.addListener(function (acceptInfo) {
		chrome.sockets.tcp.setPaused(acceptInfo.clientSocketId, false);
		var listener = listeners[acceptInfo.socketId];
		if (listener == null)
			return;
		listener(new Socket({
				socketId: acceptInfo.clientSocketId
			}))
	})
}
Server.prototype.listen = function (args, cb, listening) {
	var port;
	var address;
	if (args.constructor.name == "Number") {
		port = args;
		address = "0.0.0.0"
	} else {
		address = args.address;
		port = args.port
	}
	chrome.sockets.tcpServer.create(function (createInfo) {
		this.socketId = createInfo.socketId;
		listeners[this.socketId] = cb;
		chrome.sockets.tcpServer.listen(createInfo.socketId, address, port, function (result) {
			chrome.runtime.lastError;
			if (result) {
				this.destroy();
				if (listening) {
					listening(result)
				}
				return
			}
			chrome.sockets.tcpServer.getInfo(this.socketId, function (info) {
				this.localAddress = info.localAddress;
				this.localPort = info.localPort;
				if (listening) {
					listening(result)
				}
			}
				.bind(this))
		}
			.bind(this))
	}
		.bind(this))
};
function FetchSocket(url, cb) {
	this.promise = fetch(url).then(function (response) {
			this.connected = true;
			this.response = response;
			this.reader = this.response.body.getReader();
			this.reader.closed.then(function () {
				if (this.onClose)
					this.dataReceived(null)
			}
				.bind(this));
			this.onResume();
			cb(this)
		}
			.bind(this), function (error) {
			cb(null, error)
		})
}
FetchSocket.connect = function (url, cb) {
	new FetchSocket(url, cb)
};
FetchSocket.prototype.write = function (data, cb) {
	throw new Error("write not supported on fetch socket")
};
FetchSocket.prototype.destroy = function () {
	if (this.promise && this.promise.cancel)
		this.promise.cancel()
};
FetchSocket.prototype.unshift = Socket.prototype.unshift;
FetchSocket.prototype.dataReceived = Socket.prototype.dataReceived;
FetchSocket.prototype.read = Socket.prototype.read;
FetchSocket.prototype.pause = Socket.prototype.pause;
FetchSocket.prototype.resume = Socket.prototype.resume;
FetchSocket.prototype.buffered = Socket.prototype.buffered;
FetchSocket.prototype.onPause = function () {};
FetchSocket.prototype.onResume = function () {
	this.reader.read().then(function (chunk) {
		if (!chunk.value)
			return;
		this.dataReceived(chunk.value);
		if (this.paused) {
			return
		}
		this.onResume()
	}
		.bind(this))
};
function GcmRtcSocket(conn, dc) {
	this.conn = conn;
	this.dc = dc;
	this.gotEof = false;
	dc.onmessage = function (message) {
		var ui = new Uint8Array(message.data);
		var eof = ui[ui.byteLength - 1] == 1;
		this.dataReceived(ui.subarray(0, ui.byteLength - 1));
		if (eof) {
			this.gotEof = true;
			this.destroy()
		}
	}
	.bind(this);
	dc.onclose = dc.onerror = this.destroy.bind(this);
	this.needsBufferShim = true || parseInt(/Chrome\/(\d\d)/.exec(navigator.userAgent)[1]) < 46
}
GcmRtcSocket.prototype.buffered = Socket.prototype.buffered;
GcmRtcSocket.prototype.unshift = Socket.prototype.unshift;
GcmRtcSocket.prototype.dataReceived = Socket.prototype.dataReceived;
GcmRtcSocket.prototype.read = Socket.prototype.read;
GcmRtcSocket.prototype.pause = Socket.prototype.pause;
GcmRtcSocket.prototype.resume = Socket.prototype.resume;
GcmRtcSocket.prototype.buffered = Socket.prototype.buffered;
GcmRtcSocket.prototype.writeable = function () {
	var cb = this.writeCallback;
	if (cb) {
		delete this.writeCallback;
		cb()
	}
};
GcmRtcSocket.prototype.write = function (data, cb) {
	if (!this.dc || this.dc.readyState != "open") {
		this.destroy();
		return
	}
	this.writeCallback = cb;
	var packet = new Uint8Array(data.byteLength + 1);
	packet.set(new Uint8Array(data));
	this.dc.send(packet.buffer);
	if (this.reentrantWrite)
		return;
	try {
		this.reentrantWrite = true;
		while (this.writeCallback && (this.dc.bufferedAmount == 0 || this.needsBufferShim)) {
			this.writeable()
		}
	}
	finally {
		this.reentrantWrite = false
	}
};
GcmRtcSocket.prototype.destroy = function () {
	if (this.dc != null) {
		if (this.dc.readyState == "open") {
			this.dc.send(new Uint8Array([1]));
			if (this.gotEof)
				this.conn.recycleChannel(this.dc);
			else
				this.conn.waitForEof(this.dc)
		} else [];
		this.dc = null
	}
	this.dataReceived(null)
};
function GcmRtcConnection(pc) {
	this.pc = pc;
	this.pc.oniceconnectionstatechange = function () {
		if (this.pc.iceConnectionState == "disconnected" || this.pc.iceConnectionState == "closed") {
			this.destroy()
		}
	}
	.bind(this)
}
GcmRtcConnection.prototype.waitForCommand = function (dc) {
	dc.onmessage = function (message) {
		if (message.data.byteLength == 1)
			return;
		this.removeChannel(dc);
		var command = ab2str(message.data);
		var socket = new GcmRtcSocket(this, dc);
		this.openSocket(command, socket)
	}
	.bind(this)
};
GcmRtcConnection.prototype.compactChannels = function () {
	if (this.channels && !this.channels.length)
		this.channels = null
};
GcmRtcConnection.prototype.removeChannel = function (dc) {
	i;
	if (!this.channels)
		return;
	var i = this.channels.indexOf(dc);
	if (i == -1)
		return;
	this.channels.splice(i, 1);
	this.compactChannels()
};
GcmRtcConnection.prototype.waitForEof = function (dc) {
	dc.onmessage = function (message) {
		var ui = new Uint8Array(message.data);
		var eof = ui[ui.byteLength - 1] == 1;
		if (eof)
			this.recycleChannel(dc)
	}
	.bind(this)
};
GcmRtcConnection.prototype.recycleChannel = function (dc) {
	if (!this.channels)
		this.channels = [];
	this.channels.push(dc);
	dc.onclose = dc.onerror = function () {
		this.removeChannel(dc)
	}
	.bind(this);
	this.waitForCommand(dc)
};
GcmRtcConnection.prototype.addCandidates = function (message) {
	for (var candidate in message.candidates) {
		this.pc.addIceCandidate(new RTCIceCandidate(message.candidates[candidate]))
	}
};
GcmRtcConnection.prototype.setupPinger = function (pinger) {
	var timeout;
	function ping() {
		pinger.send(str2ab("ping"));
		timeout = setTimeout(ping, 1e3)
	}
	pinger.onmessage = function (ignored) {};
	pinger.onclose = pinger.onerror = function () {
		clearTimeout(timeout);
		this.destroy()
	}
	.bind(this);
	ping()
};
GcmRtcConnection.prototype.listenSockets = function () {
	this.pc.ondatachannel = function (ev) {
		this.waitForCommand(ev.channel)
	}
	.bind(this)
};
GcmRtcConnection.prototype.prepareChannel = function (label) {
	var dc = this.pc.createDataChannel(label || "gcm", {
			reliable: true,
			ordered: true
		});
	dc.binaryType = "arraybuffer";
	return dc
};
GcmRtcConnection.prototype.newSocket = function (label, connectCallback) {
	if (this.channels) {
		var dc = this.channels.shift();
		this.compactChannels();
		dc.send(str2ab(label));
		var socket = new GcmRtcSocket(this, dc);
		connectCallback(socket, this);
		return
	}
	var dc = this.prepareChannel("gcm");
	dc.onopen = function () {
		dc.send(str2ab(label));
		var socket = new GcmRtcSocket(this, dc);
		connectCallback(socket, this)
	}
	.bind(this)
};
GcmRtcConnection.prototype.destroy = function () {
	if (this.pc.signalingState != "closed") {
		this.pc.close()
	}
	var cb = this.onClose;
	if (cb) {
		delete this.onClose;
		cb()
	}
};
function GcmRtcManager(senderId, authorization, registrationId, rtcc) {
	this.senderId = senderId;
	this.registrationId = registrationId;
	this.authorization = authorization;
	this.rtcc = rtcc
}
GcmRtcManager.gcmRtcConnections = {};
GcmRtcManager.onMessage = function (data) {
	var message = JSON.parse(data.message);
	var type = data.type;
	var src = data.src;
	var srcPort = data.srcPort;
	var dstPort = data.dstPort;
	if (type == "offer") {
		var listener = GcmRtcManager.gcmRtcListeners[dstPort];
		if (!listener)
			console.log("not listening on " + dstPort);
		else
			listener.listener.incoming(src, srcPort, dstPort, message, listener.listenCallback);
		return
	} else if (type == "answer") {
		var key = GcmRtcManager.getKey(src, srcPort, dstPort);
		var conn = GcmRtcManager.gcmRtcConnections[key];
		if (!conn) {
			console.log("pending connection not found");
			return
		}
		conn.manager.incoming(src, srcPort, dstPort, message);
		return
	}
	console.log("unknown message " + type)
};
GcmRtcManager.hasLoadedChannels = false;
GcmRtcManager.start = function (senderId, authorization, rtcc, cb) {
	if (window.chrome && window.chrome.gcm) {
		chrome.gcm.register([senderId], function (registrationId) {
			console.log("gcm registration " + registrationId);
			if (!registrationId) {
				cb();
				return
			}
			var s = new GcmRtcManager(senderId, authorization, registrationId, rtcc);
			cb(s)
		})
	} else {
		function listenChannel() {
			$.ajax({
				type: "GET",
				url: "https://vysor-1026.appspot.com/listen",
				success: function (data) {
					console.log(data);
					var channel = new goog.appengine.Channel(data.token);
					var handler = {
						onopen: function () {
							var s = new GcmRtcManager(senderId, authorization, "web:" + data.channel, rtcc);
							cb(s)
						},
						onmessage: function (data) {
							GcmRtcManager.onMessage(JSON.parse(data.data))
						},
						onerror: function () {
							console.log("error", arguments)
						},
						onclose: function () {
							console.log("onclose", arguments)
						}
					};
					var socket = channel.open(handler)
				}
			})
		}
		if (GcmRtcManager.hasLoadedChannels) {
			listenChannel()
		} else {
			$.getScript("https://vysor-1026.appspot.com/_ah/channel/jsapi", listenChannel)
		}
	}
	if (window.chrome && window.chrome.gcm) {
		chrome.gcm.onMessage.addListener(function (data) {
			GcmRtcManager.onMessage(data.data)
		})
	}
};
GcmRtcManager.prototype.sendGcm = function (registrationId, dstPort, srcPort, type, message) {
	if (registrationId.startsWith("web:")) {
		$.ajax({
			type: "POST",
			url: "https://vysor-1026.appspot.com/send",
			data: JSON.stringify({
				channel: registrationId.substring(4),
				data: {
					src: this.registrationId,
					srcPort: srcPort,
					dstPort: dstPort,
					type: type,
					message: JSON.stringify(message)
				}
			}),
			contentType: "application/json",
			dataType: "json",
			success: function () {}
		})
	} else {
		$.ajax({
			type: "POST",
			url: "https://gcm-http.googleapis.com/gcm/send",
			headers: {
				Authorization: "key=" + this.authorization
			},
			data: JSON.stringify({
				to: registrationId,
				data: {
					src: this.registrationId,
					srcPort: srcPort,
					dstPort: dstPort,
					type: type,
					message: JSON.stringify(message)
				}
			}),
			contentType: "application/json",
			dataType: "json",
			success: function () {}
		})
	}
};
GcmRtcManager.getKey = function (registrationId, dstPort, srcPort) {
	return srcPort + ":" + dstPort + ":" + registrationId
};
GcmRtcManager.prototype.setupPeerConnection = function (type, registrationId, dstPort, srcPort, getDesc) {
	var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
	var pc = new RTCPeerConnection(this.rtcc);
	var token;
	var sendConnect = function (candidates) {
		this.sendGcm(registrationId, dstPort, srcPort, type, {
			desc: getDesc(),
			candidates: candidates
		})
	}
	.bind(this);
	pc.onicecandidate = function (evt) {
		if (evt.candidate == null)
			return;
		token = throttleTimeout(token, evt.candidate, 1e3, sendConnect)
	}
	.bind(this);
	var key = GcmRtcManager.getKey(registrationId, dstPort, srcPort);
	var conn = new GcmRtcConnection(pc);
	conn.manager = this;
	var stableToken;
	pc.onsignalingstatechange = function (ev) {
		if (pc.signalingState == "stable") {
			if (GcmRtcManager.gcmRtcConnections[key] == conn) {
				delete GcmRtcManager.gcmRtcConnections[key]
			}
		} else if (pc.signalingState == "closed") {
			conn.destroy()
		}
	};
	GcmRtcManager.gcmRtcConnections[key] = conn;
	return conn
};
GcmRtcManager.gcmPortCount = 0;
GcmRtcManager.prototype.connect = function (registrationId, port, connectCallback) {
	var localPort = GcmRtcManager.gcmPortCount++;
	var d;
	var conn = this.setupPeerConnection("offer", registrationId, port, localPort, function () {
			return d
		}, connectCallback);
	var pc = conn.pc;
	var pinger = conn.prepareChannel("pinger");
	pinger.onopen = function () {
		conn.setupPinger(pinger);
		connectCallback(this)
	}
	.bind(conn);
	conn.listenSockets();
	pc.createOffer(function (desc) {
		d = desc;
		pc.setLocalDescription(desc)
	}, function () {})
};
GcmRtcManager.gcmRtcListeners = {};
GcmRtcManager.prototype.listen = function (port, cb) {
	if (GcmRtcManager.gcmRtcListeners[port]) {
		console.log("already listening on gcm port " + port);
		return
	}
	GcmRtcManager.gcmRtcListeners[port] = {
		listener: this,
		listenCallback: cb
	}
};
GcmRtcManager.prototype.incoming = function (src, srcPort, dstPort, message, listenCallback) {
	var key = GcmRtcManager.getKey(src, srcPort, dstPort);
	var conn = GcmRtcManager.gcmRtcConnections[key];
	if (!conn) {
		var d;
		conn = this.setupPeerConnection("answer", src, srcPort, dstPort, function () {
				return d
			});
		conn.remoteDesc = new RTCSessionDescription(message.desc);
		var pc = conn.pc;
		pc.setRemoteDescription(conn.remoteDesc, function () {
			pc.createAnswer(function (answer) {
				d = answer;
				pc.setLocalDescription(answer)
			}, function () {})
		});
		pc.ondatachannel = function (ev) {
			this.setupPinger(ev.channel);
			listenCallback(conn);
			this.listenSockets()
		}
		.bind(conn)
	} else if (!conn.remoteDesc) {
		conn.remoteDesc = new RTCSessionDescription(message.desc);
		var pc = conn.pc;
		pc.setRemoteDescription(conn.remoteDesc)
	}
	conn.addCandidates(message)
};
var headFader;
var screenWidth;
var screenHeight;
var inputWebSocket;
var h264Socket;
var rectLeft;
var rectTop;
var rectWidth;
var rectHeight;
var titleBarHeight = 24;
var bottomBarHeight = 48;
var drawCanvas;
if (!window.tracker) {
	window.tracker = {
		sendEvent: function () {}
	}
}
function sendEvent(e) {
	if (!inputWebSocket)
		return;
	if (e.clientX) {
		if (!drawCanvas)
			drawCanvas = $("#mirror")[0];
		var l;
		if (window.chrome && window.chrome.app && window.chrome.app.window)
			l = 0;
		else
			l = (innerWidth - rectWidth) / 2;
		e.clientX = (e.clientX - l) / drawCanvas.width * screenWidth;
		if (e.clientX > screenWidth || e.clientX < 0)
			return
	}
	if (e.clientY) {
		if (!drawCanvas)
			drawCanvas = $("#mirror")[0];
		var t;
		if (window.chrome && window.chrome.app && window.chrome.app.window)
			t = 0;
		else
			t = (innerHeight - rectHeight - bottomBarHeight) / 2;
		e.clientY = (e.clientY - t) / drawCanvas.height * screenHeight;
		if (e.clientY > screenHeight || e.clientY < 0)
			return
	}
	inputWebSocket.send(JSON.stringify(e))
}
function delayFadeHead() {
	$(".head").fadeTo(0, .8);
	clearTimeout(headFader);
	headFader = setTimeout(function () {
			$(".head").fadeOut()
		}, 2e3)
}
$(window).focus(function () {
	delayFadeHead();
	sendEvent({
		type: "wakeup"
	})
});
$(window).bind("paste", function (e) {
	var pastedData = e.originalEvent.clipboardData.getData("text");
	if (pastedData && pastedData.length) {
		sendEvent({
			type: "keychar",
			keychar: pastedData
		})
	}
});
window.addEventListener("mousewheel", function (e) {
	sendEvent({
		type: "scroll",
		clientX: e.clientX,
		clientY: e.clientY,
		deltaX: e.wheelDeltaX / 100,
		deltaY: e.wheelDeltaY / 100
	})
}, false);
$(window).keypress(function (e) {
	var s = String.fromCharCode(e.keyCode);
	if (!s.length)
		return;
	sendEvent({
		type: "keychar",
		keychar: s
	})
});
$(window).keydown(function (e) {
	if (e.keyCode == 36) {
		sendEvent({
			type: "home"
		});
		return
	} else if (e.keyCode == 27) {
		sendEvent({
			type: "back"
		});
		return
	} else if (e.keyCode == 112) {
		sendEvent({
			type: "menu"
		});
		return
	} else if (e.keyCode == 113) {
		delayFadeHead();
		return
	} else if (e.keyCode == 8) {
		sendEvent({
			type: "backspace"
		});
		return
	} else if (e.keyCode == 38) {
		sendEvent({
			type: "up"
		});
		return
	} else if (e.keyCode == 40) {
		sendEvent({
			type: "down"
		});
		return
	} else if (e.keyCode == 37) {
		sendEvent({
			type: "left"
		});
		return
	} else if (e.keyCode == 39) {
		sendEvent({
			type: "right"
		});
		return
	} else {}
});
$(window).mouseup(function (e) {
	if (e.button != 0)
		return;
	sendEvent({
		type: e.type,
		clientX: e.clientX,
		clientY: e.clientY
	})
});
$(window).mousedown(function (e) {
	if (e.button == 1) {
		sendEvent({
			type: "home"
		});
		return
	}
	if (e.button == 2) {
		sendEvent({
			type: "back"
		});
		return
	}
	if (e.button != 0)
		return;
	sendEvent({
		type: e.type,
		clientX: e.clientX,
		clientY: e.clientY
	})
});
$(window).mousemove(function (e) {
	if ((e.buttons & 1) == 0)
		return;
	sendEvent({
		type: e.type,
		clientX: e.clientX,
		clientY: e.clientY
	})
});
var resizeTimeout;
$(window).resize(function (e) {
	if (!screenHeight || !screenWidth)
		return;
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(function () {
			var iw = innerWidth;
			if (window.chrome && window.chrome.app && window.chrome.app.window)
				iw = chrome.app.window.current().innerBounds.width;
			var newScreenHeight = iw * (screenHeight / screenWidth);
			rectWidth = iw;
			rectHeight = newScreenHeight;
			resizeWindow()
		}, 500)
});
function enforceAspectRatio(ow, oh) {
	if (oh == screenWidth && ow == screenHeight) {
		var tmp = rectWidth;
		rectWidth = rectHeight;
		rectHeight = tmp
	} else {
		var iw = innerWidth;
		if (window.chrome && window.chrome.app && window.chrome.app.window)
			iw = chrome.app.window.current().innerBounds.width;
		var newScreenHeight = iw * (screenHeight / screenWidth);
		rectWidth = iw;
		rectHeight = newScreenHeight
	}
	resizeWindow()
}
function resizeWindow() {
	if (rectWidth > screen.availWidth) {
		rectWidth = screen.availWidth;
		rectHeight = screenHeight / screenWidth * rectWidth
	}
	var windowDecorHeight = outerHeight - innerHeight;
	if (rectHeight + bottomBarHeight + windowDecorHeight > screen.availHeight) {
		rectHeight = screen.availHeight - bottomBarHeight - windowDecorHeight;
		rectWidth = screenWidth / screenHeight * rectHeight
	}
	if (!rectWidth || !rectHeight)
		return;
	console.log("new window dimensions: " + rectWidth + "x" + rectHeight);
	var c = $("#mirror");
	var canvasElement = c[0];
	if (window.chrome && window.chrome.app && window.chrome.app.window) {
		chrome.app.window.current().innerBounds.width = Math.round(rectWidth);
		chrome.app.window.current().innerBounds.height = Math.round(rectHeight + bottomBarHeight);
		c.css("left", 0);
		c.css("top", 0)
	} else {
		var l = (innerWidth - rectWidth) / 2;
		c.css("left", l);
		c.css("top", (innerHeight - rectHeight - bottomBarHeight) / 2);
		$(".foot").width(rectWidth);
		$(".foot").css("left", l);
		$(".overlay").width(rectWidth);
		$(".overlay").css("left", l)
	}
	canvasElement.width = Math.round(rectWidth);
	canvasElement.height = Math.round(rectHeight);
	$("#dead").width(rectWidth);
	$("#dead").height(rectHeight + bottomBarHeight)
}
function trackUsage(elapsed) {
	if (!window.chrome || !window.chrome.storage)
		return;
	chrome.storage.local.get(["vysorUsage", "vysorDailyUsage", "lastDailyReport"], function (d) {
		var vysorUsage = d.vysorUsage;
		var lastDailyReport = d.lastDailyReport;
		var vysorDailyUsage = d.vysorDailyUsage;
		var now = Date.now();
		if (!vysorUsage)
			vysorUsage = 0;
		if (!vysorDailyUsage)
			vysorDailyUsage = 0;
		if (!lastDailyReport) {
			chrome.storage.local.set({
				lastDailyReport: now
			})
		} else {
			if (now > lastDailyReport + 24 * 60 * 60 * 1e3) {
				var hoursUsed = vysorDailyUsage / (60 * 60 * 1e3);
				hoursUsed = Math.round(hoursUsed * 2) / 2;
				if (hoursUsed <= 24 && hoursUsed >= 0) {
					tracker.sendEvent("daily-usage", hoursUsed.toString())
				}
				vysorDailyUsage = 0;
				chrome.storage.local.set({
					lastDailyReport: now
				})
			}
		}
		vysorUsage += elapsed;
		vysorDailyUsage += elapsed;
		chrome.storage.local.set({
			vysorUsage: vysorUsage,
			vysorDailyUsage: vysorDailyUsage
		})
	})
}
window.docready = function () {
	$("#loading").fadeIn();
	$("#dead").fadeOut();
	delayFadeHead();
	function handleData(json) {
		if (json.type == "displaySize") {
			var needs264 = !h264Socket;
			var ow = screenWidth;
			var oh = screenHeight;
			screenWidth = json.screenWidth;
			screenHeight = json.screenHeight;
			enforceAspectRatio(ow, oh);
			if (needs264)
				connect264()
		} else if (json.type == "clip") {
			copyTextToClipboard(json.clip)
		}
	}
	var attemptCount = 0;
	var maxRetries = 5;
	function reattempt() {
		console.log("input websocket failed, retrying. attempt " + attemptCount + " out of " + maxRetries);
		setTimeout(attemptConnection, 2e3)
	}
	function attemptConnection() {
		attemptCount++;
		if (attemptCount == maxRetries) {
			withSocket();
			return
		}
		createWebSocket(function (ws) {
			inputWebSocket = ws;
			inputWebSocket.onopen = function () {
				console.log("input websocket opened");
				inputWebSocket.onerror = null;
				sendEvent({
					type: "password",
					password: password
				});
				sendEvent({
					type: "wakeup"
				})
			};
			inputWebSocket.onerror = reattempt;
			inputWebSocket.onmessage = function (event) {
				console.log(event.data);
				var json = JSON.parse(event.data);
				handleData(json)
			}
		})
	}
	var createWebSocket;
	if (!window.port) {
		var registrationId = getQueryVariable("registrationId");
		if (!registrationId)
			return;
		var gcmSocketManager;
		GcmRtcManager.start("64148182473", "AIzaSyDd7k1v017osyYbIC92fyf-36s3pv0z73U", {
			iceServers: [{
					url: "turn:n0.clockworkmod.com",
					username: "foo",
					credential: "bar"
				}, {
					url: "turn:n1.clockworkmod.com",
					username: "foo",
					credential: "bar"
				}
			]
		}, function (gcm) {
			gcmSocketManager = gcm;
			gcmSocketManager.sharedDevices = {};
			var channel = getQueryVariable("channel");
			gcmSocketManager.connect(registrationId, channel, function (gcmConn) {
				console.log(gcmConn);
				vysorVirtualDevices = {};
				vysorVirtualDevices[serialno] = gcmConn;
				console.log("starting remote vysor daemon");
				gcmConn.newSocket("webstart", function (socket) {
					console.log("waiting for password");
					readLine(socket, function (password) {
						socket.destroy();
						console.log("got password", password);
						window.password = password;
						createWebSocket = function (cb) {
							gcmConn.newSocket("tcp:53518", function (ws) {
								ws.send = function (json) {
									writeLine(ws, json)
								}
								.bind(ws);
								cb(ws);
								var hasConnected = false;
								ws.onClose = function () {
									if (!hasConnected) {
										if (ws.onerror)
											ws.onerror()
									}
								};
								function onblob(s) {
									if (!hasConnected) {
										hasConnected = true;
										if (ws.onopen)
											ws.onopen()
									}
									if (ws.onmessage)
										ws.onmessage({
											data: s
										});
									readLine(ws, onblob)
								}
								readLine(ws, onblob)
							})
						};
						attemptConnection()
					})
				})
			})
		});
		serialno = "web"
	} else {
		createWebSocket = function (cb) {
			cb(new WebSocket("ws://127.0.0.1:" + port + "/input", "mirror-protocol"))
		}
	}
	$("#serialno").text(serialno);
	console.log("init");
	function withSocket(socket) {
		console.log("received socket", socket);
		if (h264Socket) {
			h264Socket.destroy()
		}
		h264Socket = socket;
		$(".overlay").fadeOut();
		if (!socket) {
			$("#dead").fadeIn();
			return
		}
		socket.onClose = function () {
			$("#dead").fadeIn();
			inputWebSocket = null;
			if (h264Socket == socket)
				h264Socket = null
		};
		var defaultConfig = {
			filter: "original",
			filterHorLuma: "optimized",
			filterVerLumaEdge: "optimized",
			getBoundaryStrengthsA: "optimized"
		};
		var canvas;
		var asmInstance;
		var avc = new Avc;
		avc.configure(defaultConfig, function () {
			console.log("callback for avc")
		});
		var frameTracker;
		avc.onPictureDecoded = function (buffer, width, height) {
			if (!buffer) {
				console.log("no buffer?");
				return
			}
			if (!canvas) {
				frameTracker = Date.now();
				console.log("first frame decoded");
				tracker.sendEvent("view-device");
				var c = $("#mirror");
				var canvasElement = c[0];
				canvas = new WebGLCanvas(canvasElement, undefined, {});
				if (!canvas.contextGL) {
					var appName = chrome.runtime.getManifest().name;
					chrome.notifications.create("enableWebGL", {
						type: "basic",
						iconUrl: "/icon.png",
						title: appName,
						message: "WebGL is disabled in Chrome. Enable it for Vysor to work properly.",
						isClickable: true,
						buttons: [{
								title: "Enable WebGL"
							}
						]
					})
				}
			} else {
				var now = Date.now();
				var elapsed = now - frameTracker;
				if (elapsed > 60 * 1e3) {
					frameTracker = now;
					trackUsage(elapsed)
				}
			}
			if (!rectWidth || !rectHeight)
				return;
			canvas.drawNextOutputPicture(width, height, {
				left: 0,
				top: 0,
				width: Math.round(rectWidth),
				height: Math.round(rectHeight)
			}, buffer)
		};
		var isSps = true;
		var payloadReader = function (data) {
			var video = data.subarray(8);
			if (isSps) {
				isSps = false;
				if (video[5] != 66 && video.byteLength >= 6)
					showNotification("Your Android needs to send H264 Baseline by default. You may get this error and see a black screen if running a custom ROM.")
			}
			avc.decode(video);
			socket.read(4, headerReader)
		};
		var headerReader = function (data) {
			if (data.byteLength != 4) {
				throw new Error("WTF")
			}
			var lenBuf = new DataView(data.buffer, data.byteOffset, 4);
			var len = lenBuf.getInt32(0, true);
			socket.read(len, payloadReader)
		};
		var firstRead = setTimeout(function () {
				showNotification("Your Android screen is unavailable right now. This can sometimes be resolved by rebooting your Android.")
			}, 5e3);
		socket.read(4, function (data) {
			clearTimeout(firstRead);
			headerReader(data)
		})
	}
	function connect264() {
		if (vysorVirtualDevices[serialno]) {
			console.log("vysor socket fast path");
			var vd = vysorVirtualDevices[serialno];
			vd.newSocket("tcp:53517", function (socket) {
				if (!socket) {
					withSocket();
					return
				}
				writeLine(socket, password, function () {
					withSocket(socket)
				})
			})
		} else if (adbServer.isRunning()) {
			console.log("adb server socket path");
			var adb = adbServer.adbDevices[serialno];
			adb.newSocket("tcp:53517", function (socket) {
				if (!socket) {
					withSocket();
					return
				}
				writeLine(socket, password, function () {
					withSocket(socket)
				})
			})
		} else {
			if (true || vysorForceSocket) {
				console.log("adb client socket path");
				Adb.sendClientCommand({
					serialno: serialno,
					command: "tcp:53517"
				}, function (socket) {
					if (!socket) {
						withSocket();
						return
					}
					writeLine(socket, password, function () {
						withSocket(socket)
					})
				})
			} else {
				console.log("fetch path");
				FetchSocket.connect("http://127.0.0.1:" + port + "/h264?password=" + password, withSocket)
			}
		}
	}
	if (window.port)
		attemptConnection()
};
window.docready();
if (window.chrome && window.chrome.notifications) {
	chrome.notifications.onButtonClicked.addListener(function (nid, bid) {
		if (nid == "enableWebGL") {
			chrome.browser.openTab({
				url: "https://github.com/koush/vysor.io/issues/3"
			})
		}
	});
	chrome.notifications.onClicked.addListener(function (nid, bid) {
		if (nid == "enableWebGL") {
			chrome.browser.openTab({
				url: "https://github.com/koush/vysor.io/issues/3"
			})
		}
	})
}
$(document).ready(function () {
	$(".head").bind("mouseup mousedown mousemove", function (e) {
		e.stopPropagation();
		delayFadeHead()
	});
	$("#rotate-button").click(function () {
		sendEvent({
			type: "rotate"
		})
	});
	$("#screenshot-button").click(function () {
		chrome.browser.openTab({
			url: "http://127.0.0.1:" + port + "/screenshot.jpg?password=" + password
		})
	});
	$("#power").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 26
		})
	});
	$("#volume-down").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 25
		})
	});
	$("#volume-up").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 24
		})
	});
	$("#bottom-back").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 4
		})
	});
	$("#bottom-home").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 3
		})
	});
	$("#bottom-tasks").click(function () {
		sendEvent({
			type: "keycode",
			keycode: 187
		})
	});
	if (window.chrome && window.chrome.storage) {
		chrome.storage.local.get("show-softkeys-" + chrome.app.window.current().id, function (vals) {
			var showSoftkeys = vals["show-softkeys-" + chrome.app.window.current().id] !== false;
			if (showSoftkeys) {
				bottomBarHeight = 48;
				$(".foot").show()
			} else {
				bottomBarHeight = 0;
				$(".foot").hide()
			}
			resizeWindow()
		})
	} else {
		$(".foot").show()
	}
	$("#softkey-button").click(function () {
		var softKeyKey = "show-softkeys-" + serialno;
		var setObj = {};
		if ($(".foot").is(":visible")) {
			$(".foot").hide();
			bottomBarHeight = 0;
			setObj[softKeyKey] = false
		} else {
			$(".foot").show();
			bottomBarHeight = 48;
			setObj[softKeyKey] = true
		}
		if (window.chrome && window.chrome.storage) {
			chrome.storage.local.set(setObj)
		}
		resizeWindow()
	})
});
