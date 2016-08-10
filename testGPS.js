"use strict";

var GPS = require('./NMEAReader.js').NMEA;
// var gps = new GPS('/dev/ttyUSB0', 4800);
var gps = new GPS();


var exit = function() {
  gps.exit();
};

process.on('SIGINT', exit); // Ctrl C
