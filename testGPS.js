"use strict";

console.log('To stop: Ctrl-C, or enter "quit" + [return] here in the console');
console.log("Usage: node " + __filename + " [raw]|fmt|auto");

global.displayMode = "raw";

if (process.argv.length > 2) {
  if (process.argv[2] === 'fmt') {
    global.displayMode = "fmt";
  } else if (process.argv[2] === 'auto') {
    global.displayMode = "auto";
  }
}

var util = require('util');
var GPS = require('./SerialReader.js').NMEA;

var serialPort = '/dev/tty.usbserial'; // On Mac
// var serialPort = '/dev/ttyUSB0'; // On Linux (including Raspberry)
var gps = new GPS(serialPort, 4800);
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
