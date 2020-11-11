// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

process.title = 'node-adc'; // Optional. You will see this name in eg. 'ps' or 'top' command

// Port where we'll run the websocket server
const port = 9876;

// websocket and http servers
let webSocketServer = require('websocket').server;
let http = require('http');
let fs = require('fs');

let verbose = false;

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) == 0;
    };
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

function handler(req, res) {
    let respContent = "";
    if (verbose) {
        console.log("Speaking HTTP from " + __dirname);
        console.log("Server received an HTTP Request:\n" + req.method + "\n" + req.url + "\n-------------");
        console.log("ReqHeaders:" + JSON.stringify(req.headers, null, '\t'));
        console.log('Request:' + req.url);
        let prms = require('url').parse(req.url, true);
        console.log(prms);
        console.log("Search: [" + prms.search + "]");
        console.log("-------------------------------");
    }
    if (req.url.startsWith("/data/")) { // Static resource
        let resource = req.url.substring("/data/".length);
        console.log('Loading static ' + req.url + " (" + resource + ")");
        fs.readFile(__dirname + '/' + resource,
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading ' + resource);
                }
                if (verbose)
                    console.log("Read resource content:\n---------------\n" + data + "\n--------------");
                let contentType = "text/html";
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
    } else if (req.url == "/") {
        if (req.method === "POST") {
            let data = "";
            console.log("---- Headers ----");
            for (let item in req.headers)
                console.log(item + ": " + req.headers[item]);
            console.log("-----------------");

            req.on("data", function (chunk) {
                data += chunk;
            });

            req.on("end", function () {
                console.log("POST request: [" + data + "]");
                res.writeHead(200, {'Content-Type': 'application/json'});
                let status = {'status': 'OK'};
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

let clients = []; // list of currently connected clients (users)

/**
 * HTTP server
 */
let server = http.createServer(handler);
server.listen(port, function () {
    console.log((new Date()) + " Server is listening on port " + port);
    console.log("Connect to [http://localhost:9876/data/demos/adc.one.html]");
});

/**
 * WebSocket server
 */
let wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    let connection = request.accept(null, request.origin);
    clients.push(connection);
    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // accept only text
            console.log((new Date()) + ' Received Message: ' + message.utf8Data);

            let obj = {
                time: (new Date()).getTime(),
                text: message.utf8Data
            };
            // broadcast message to all connected clients. That's what this app is doing.
            let json = JSON.stringify({type: 'message', data: obj});
            for (let i = 0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            }
        }
    });
    // user disconnected
    connection.on('close', function (connection) {
        // Close
    });
});

// ADC part
let MCP3008 = require('./mcp3008.js').MCP3008; // This is a class. Explicit location (path), not in 'node_modules'.

let mcp3008 = new MCP3008(); // Uses the default pins. See mcp3008.js for details.

let iv = setInterval(function () {
    let adc = mcp3008.readAdc(mcp3008.channels.CHANNEL_0);
//console.log("Val:" + adc);
    let json = JSON.stringify({type: 'message', data: adc});
    for (let i = 0; i < clients.length; i++) {
        clients[i].sendUTF(json);
    }
}, 500);

// cleanup GPIO on exit
function exit() {
    mcp3008.shutdown();
    process.exit();
}

process.on('SIGINT', exit); // Ctrl C
