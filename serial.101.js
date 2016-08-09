"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 */

var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
  baudRate: 9600,
  parser: SerialPort.parsers.raw
});
 
port.on('open', function() {
  console.log('Port open');
//  port.write('main screen turn on', function(err) {
//    if (err) {
//      return console.log('Error on write: ', err.message);
//    }
//    console.log('message written');
//  });
});

port.on('data', function (data) {
  try {
    console.log('Data: ', data);
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
