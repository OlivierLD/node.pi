"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 * Use this to see if your serial output is available and readable.
 */

var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
  baudRate: 4800,
  parser: SerialPort.parsers.raw
});
 
port.on('open', function() {
  console.log('Port open');
});

port.on('data', function (data) {
  try {
    console.log(data.toString());
  } catch (err) {
    console.log('Oops');
  }
});

// open errors will be emitted as an error event 
port.on('error', function(err) {
  console.log('Error: ', err.message);
});

port.on('close', function() {
  console.log('Bye');
});

var exit = function() {
  port.close();
};

process.on('SIGINT', exit); // Ctrl C
