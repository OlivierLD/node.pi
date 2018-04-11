// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

process.title = 'node-gps'; // Optional. You will see this name in eg. 'ps' or 'top' command

// Port where we'll run the websocket server
var port = 9876;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var verbose = false;

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str) {
    return this.indexOf(str) == 0;
  };
}

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function handler (req, res) {
  var respContent = "";
  console.log("Verbose is:", verbose);
  if (verbose) {
    console.log("Speaking HTTP from " + __dirname);
    console.log("Server received an HTTP Request:\n" + req.method + "\n" + req.url + "\n-------------");
    console.log("ReqHeaders:" + JSON.stringify(req.headers, null, '\t'));
    console.log('Request:' + req.url);
    var prms = require('url').parse(req.url, true);
    console.log(prms);
    console.log("Search: [" + prms.search + "]");
    console.log("-------------------------------");
  }
  if (req.url.startsWith("/data/")) { // Static resource
    var resource = req.url.substring("/data/".length);
    console.log('Loading static ' + req.url + " (" + resource + ")");
    fs.readFile(__dirname + '/' + resource,
                function (err, data) {
	                if (err) {
		                res.writeHead(500);
		                return res.end('Error loading ' + resource);
	                }
	                if (verbose) {
		                console.log("Read resource content:\n---------------\n" + data + "\n--------------");
	                }
	                var contentType = "text/html";
	                if (resource.endsWith(".css")) {
		                contentType = "text/css";
	                } else if (resource.endsWith(".html")) {
		                contentType = "text/html";
	                } else if (resource.endsWith(".xml")) {
		                contentType = "text/xml";
	                } else if (resource.endsWith(".js")) {
		                contentType = "text/javascript";
                  } else if (resource.endsWith(".jpg")) {
		                contentType = "image/jpg";
	                } else if (resource.endsWith(".gif")) {
		                contentType = "image/gif";
	                } else if (resource.endsWith(".png")) {
		                contentType = "image/png";
	                }

                  res.writeHead(200, {'Content-Type': contentType});
              //  console.log('Data is ' + typeof(data));
                  if (resource.endsWith(".jpg") ||
                      resource.endsWith(".gif") ||
                      resource.endsWith(".png")) {
                //  res.writeHead(200, {'Content-Type': 'image/gif' });
                    res.end(data, 'binary');
                  } else {
                    res.end(data.toString().replace('$PORT$', port.toString())); // Replace $PORT$ with the actual port value.
                  }
                });
  } else if (req.url === "/") {
    if (req.method === "POST") {
      var data = "";
      console.log("---- Headers ----");
      for(var item in req.headers) {
	      console.log(item + ": " + req.headers[item]);
      }
      console.log("-----------------");

      req.on("data", function(chunk) {
        data += chunk;
      });

      req.on("end", function() {
        console.log("POST request: [" + data + "]");
        res.writeHead(200, {'Content-Type': 'application/json'});
        var status = {'status':'OK'};
        res.end(JSON.stringify(status));
      });
    }
  } else {
    console.log("Unmanaged request: [" + req.url + "]");
    respContent = "Response from " + req.url;
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end(); // respContent);
  }
} // HTTP Handler

var clients = []; // list of currently connected clients (users)

/**
 * HTTP server
 */
var server = http.createServer(handler);
server.listen(port, function() {
  console.log((new Date()) + " Server is listening on port " + port);
  console.log("Connect to [http://localhost:9876/data/demos/gps.demo.html]");
	console.log("Connect to [http://localhost:9876/data/demos/gps.demo.wc.html] (for WebComponents)");
  console.log('Verbose is ', verbose);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket request is just
  // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
  httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
  var connection = request.accept(null, request.origin);
  clients.push(connection);
  console.log((new Date()) + ' Connection accepted.');

  // user sent some message
  connection.on('message', function(message) {
    if (message.type === 'utf8') { // accept only text
      console.log((new Date()) + ' Received Message: ' + message.utf8Data);

      var obj = {
        time: (new Date()).getTime(),
        text: message.utf8Data
      };
      // broadcast message to all connected clients. That's what this app is doing.
      var json = JSON.stringify({ type:'message', data: obj });
      for (var i=0; i < clients.length; i++) {
        clients[i].sendUTF(json);
      }
    }
  });
  // user disconnected
  connection.on('close', function(connection) {
    // Close
  });
});

// GPS part
console.log("+-----------------------------------------------------------------+")
console.log('| To stop: Ctrl-C, or enter "quit" + [return] here in the console |');
console.log("+-----------------------------------------------------------------+")
console.log("Usage: node " + __filename + " --verbose:true|false --port:/dev/ttyXXXX --format:raw|fmt|[auto]");
console.log("-  Default verbose is false");
console.log("-  Default port is /dev/ttyUSB0");
console.log("-  Default format is auto");

global.displayMode = "auto";

var util = require('util');
var GPS = require('./SerialReader.js').NMEA;

// var serialPort = '/dev/tty.usbserial'; // On Mac
var serialPort = '/dev/ttyUSB0'; // On Linux (including Raspberry)

for (var i=0; i<process.argv.length; i++) {
	console.log("arg #%d: %s", i, process.argv[i]);
}

if (process.argv.length > 2) {
	for (var argc=2; argc<process.argv.length; argc++) {
		if (process.argv[argc].startsWith("--verbose:")) {
			var value = process.argv[argc].substring("--verbose:".length);
			if (value !== 'true' && value !== 'false') {
				console.log("Invalid verbose value [%s]. Only 'true' and 'false' are supported.", value);
				process.exit(1);
			}
			verbose = (value === 'true');
		} else if (process.argv[argc].startsWith("--port:")) {
			var value = process.argv[argc].substring("--port:".length);
			serialPort = value;
			console.log("Using serial port ", serialPort);
		} else if (process.argv[argc].startsWith("--format:")) {
			var value = process.argv[argc].substring("--format:".length);
			if (value !== "raw" && value !== "auto" && value !== "fmt" ) {
				console.log("Invalid format value %s. Only 'raw', 'auto', or 'fmt'.", value);
				process.exit(1);
			}
			global.displayMode = value;
			console.log("Using serial format ", value);
		} else {
			console.log("Unsupported parameter %s, ignored.", process.argv[argc]);
		}
	}
}

var gps = new GPS(serialPort, 4800);

var processData = function(gps) {
  var json = JSON.stringify({ type:'message', data: gps });
  for (var i=0; i < clients.length; i++) {
    clients[i].sendUTF(json);
  }
};

gps.onFullGPSData = function(gps) {
	if (verbose) {
		console.log("GPS Data:", gps);
	}
  processData(gps);
};

var exit = function() {
  gps.exit();
  process.stdin.pause();
};

process.on('SIGINT', exit); // Ctrl C
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
//console.log('received data:', util.inspect(text));
  if (text.startsWith('quit')) {
    done();
  }
});

function done() {
  console.log("Bye now!");
  exit();
  process.exit();
};
