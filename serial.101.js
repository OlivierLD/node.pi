"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 * Use this to see if your serial output is available and readable.
 */

let SerialPort = require('serialport');
let port = new SerialPort('/dev/ttyUSB0', {
  baudRate: 4800,
  parser: SerialPort.parsers.raw
});

port.on('open', () => {
  console.log('Port open');
});

port.on('data', (data) => {
  try {
    console.log(data.toString());
  } catch (err) {
    console.log('Oops');
  }
});

// open errors will be emitted as an error event
port.on('error', (err) => {
  console.log('Error: ', err.message);
});

port.on('close', () => {
  console.log('Bye');
});

function exit() {
  port.close();
}

process.on('SIGINT', exit); // Ctrl C
