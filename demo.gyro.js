// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";
 
/*
 * WebSocket server for the L3GD20 gyroscope
 * Doc at https://www.npmjs.com/package/websocket
 * Static requests must be prefixed with /data/, like in http://machine:9876/data/console.html
 */

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-gyro';
 
// Port where we'll run the websocket server
var port = 9876;
 
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var verbose = false;
 
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str)  {
    return this.indexOf(str) === 0;
  };
}

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

// HTTP Handler
var handler = function(req, res) {
  var respContent = "";
  if (verbose === true) {
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
    if (resource.indexOf("?") > -1) {
      resource = resource.substring(0, resource.indexOf("?"));
    }
    console.log('Loading static ' + req.url + " (" + resource + ")");
    fs.readFile(__dirname + '/' + resource,
                function (err, data) {
                  if (err) {
                    res.writeHead(500);
                    return res.end('Error loading ' + resource);
                  }
               // if (verbose)
               //   console.log("Read resource content:\n---------------\n" + data + "\n--------------");
                  var contentType = "text/html";
                  if (resource.endsWith(".css"))
                    contentType = "text/css";
                  else if (resource.endsWith(".html"))
                    contentType = "text/html";
                  else if (resource.endsWith(".xml"))
                    contentType = "text/xml";
                  else if (resource.endsWith(".js"))
                    contentType = "text/javascript";
                  else if (resource.endsWith(".jpg"))
                    contentType = "image/jpg";
                  else if (resource.endsWith(".gif"))
                    contentType = "image/gif";
                  else if (resource.endsWith(".png"))
                    contentType = "image/png";
                  else if (resource.endsWith(".ico"))
                    contentType = "image/ico";

                  res.writeHead(200, {'Content-Type': contentType});
                  if (resource.endsWith(".jpg") ||
                      resource.endsWith(".gif") ||
                      resource.endsWith(".ico") ||
                      resource.endsWith(".png"))
                  {
                //  res.writeHead(200, {'Content-Type': 'image/gif' });
                    res.end(data, 'binary');
                  }
                  else
                    res.end(data.toString().replace('$PORT$', port.toString())); // Replace $PORT$ with the actual port value.
                });
  } else if (req.url == "/") {
    if (req.method === "POST") {
      var data = "";
      console.log("---- Headers ----");
      for (var item in req.headers)
        console.log(item + ": " + req.headers[item]);
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
    console.log("Un-managed request: [" + req.url + "]");
    respContent = "Response from " + req.url;
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end(); // respContent);
  }
}; // HTTP Handler

var clients = []; // list of currently connected clients
 
/**
 * HTTP server
 */
var server = http.createServer(handler);
server.listen(port, function() {
  console.log((new Date()) + " Server is listening on port " + port);
  console.log("Connect to [http://localhost:9876/data/demos/gyro.one.html]");
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
 
  // accept connection - you should check 'request.origin' to make sure that
  // client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin);
  clients.push(connection);
  console.log((new Date()) + ' Connection accepted.');
 
  // user sent some message
  connection.on('message', function(message) {
    if (message.type === 'utf8') { // accept only text
      for (var i=0; i < clients.length; i++) {
        clients[i].sendUTF(message.utf8Data);
      }
    }
  });
 
  // user disconnected
  connection.on('close', function(code) {
    // Close
    console.log((new Date()) + ' Connection closed.');
    var nb = clients.length;
    for (var i=0; i<clients.length; i++) {
      if (clients[i] === connection) {
        clients.splice(i, 1);
        break;
      }
    }
    if (verbose) {
      console.log("We have (" + nb + "->) " + clients.length + " client(s) connected.");
    }
  });
});

var broadcastGyroData = function(x, y, z) {
  var mess = { x: x, y: y, z: z };
  for (var i=0; i < clients.length; i++) {
    clients[i].sendUTF(JSON.stringify(mess));
  }
};

// Gyro Sensor
var L3GD20 = require('./l3gd20.js').L3GD20;
var L3GD20Dictionaries = require('./utils/L3GD20Dictionaries.js').L3GD20Dictionaries;

var l3gd20 = new L3GD20();

console.log("Init...")
try {
  l3gd20.open();
  l3gd20.setPowerMode(L3GD20Dictionaries.NORMAL);
  l3gd20.setFullScaleValue(L3GD20Dictionaries._250_DPS);
  l3gd20.setAxisXEnabled(true);
  l3gd20.setAxisYEnabled(true);
  l3gd20.setAxisZEnabled(true);
} catch (err) {
  console.log(err);
  process.exit();
}
console.log("Starting...");
l3gd20.init();
l3gd20.calibrate();

var prevX, prevY, prevZ;

var minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0;

var iv = setInterval(function () {
  var data = l3gd20.getCalOutValue();
  var x = data[0], y = data[1], z = data[2];
  if (x !== prevX || y !== prevY || z !== prevZ) {
    broadcastGyroData(x, y, z);
  }
  minX = Math.min(x, minX); maxX = Math.max(x, maxX);
  minY = Math.min(y, minY); maxY = Math.max(y, maxY);
  minZ = Math.min(z, minZ); maxZ = Math.max(z, maxZ);
  prevX = x; prevY = y; prevZ = z;
}, 20);

// cleanup on exit
var exit = function() {
  console.log("Bye!");
  l3gd20.shutdown();
  console.log("x in [" + minX + ", " + maxX +
           "], y in [" + minY + ", " + maxY +
           "], z in [" + minZ + ", " + maxZ + "]");
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C
