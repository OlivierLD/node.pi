"use strict";

var debug = false;
console.log("Usage: node " + __filename + " [debug]");

if (process.argv.length > 2) {
  if (process.argv[2] === 'debug') {
    debug = true;
  }
}

var MCP3008 = require('./mcp3008.js').MCP3008; // This is a class. Explicit location (path), not in 'node_modules'.

var mcp3008 = new MCP3008(); // Uses the default pins. See mcp3008.js for details.
if (debug === true) {
  mcp3008.setDebug(true);
}

var iv = setInterval(function () {
  var adc = mcp3008.readAdc(mcp3008.channels.CHANNEL_0);
  console.log("Val:" + adc);
}, 1000);

setTimeout(function () {
  clearInterval(iv); // Stop reading
  exit();
}, 100000);

// cleanup GPIO on exit
function exit() {
  mcp3008.shutdown();
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C
