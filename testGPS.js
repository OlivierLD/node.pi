"use strict";

var GPS = require('./NMEAReader.js').NMEA;
var gps = new GPS('/dev/ttyUSB0', 4800);
// var gps = new GPS();

gps.onPosition = function(pos) {
  console.log("Position:", pos);
};
gps.onTime = function(epoch) {
  console.log("Time: " + new Date(epoch));
};

var exit = function() {
  gps.exit();
};

process.on('SIGINT', exit); // Ctrl C
