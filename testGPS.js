"use strict";

console.log('To stop: Ctrl-C, or enter "quit" + [return] here in the console');
console.log("Usage: node " + __filename + " [raw]|fmt");

global.displayMode = "raw";

if (process.argv.length > 2) {
  if (process.argv[2] === 'fmt') {
    global.displayMode = "fmt";
  }
}

var util = require('util');
var GPS = require('./NMEAReader.js').NMEA;
var gps = new GPS('/dev/ttyUSB0', 4800);
// var gps = new GPS();

if (global.displayMode === 'fmt') {
  gps.onPosition = function(pos) {
    console.log("Position:", pos);
  };
  gps.onTime = function(epoch) {
    console.log("Time: " + new Date(epoch));
  };
}
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
