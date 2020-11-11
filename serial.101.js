"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 *
 * Use this to see if your serial output is available and readable.
 */
/**
 * Nov 2020, problem reading the serial ports...
 /home/pi/node.pi/node_modules/serialport/node_modules/bindings/bindings.js:91
 throw err
 ^

 Error: Could not locate the bindings file. Tried:
 → /home/pi/node.pi/node_modules/serialport/build/serialport.node
 → /home/pi/node.pi/node_modules/serialport/build/Debug/serialport.node
 → /home/pi/node.pi/node_modules/serialport/build/Release/serialport.node
 → /home/pi/node.pi/node_modules/serialport/out/Debug/serialport.node
 → /home/pi/node.pi/node_modules/serialport/Debug/serialport.node
 → /home/pi/node.pi/node_modules/serialport/out/Release/serialport.node
 → /home/pi/node.pi/node_modules/serialport/Release/serialport.node
 → /home/pi/node.pi/node_modules/serialport/build/default/serialport.node
 → /home/pi/node.pi/node_modules/serialport/compiled/10.23.0/linux/arm/serialport.node
 at bindings (/home/pi/node.pi/node_modules/serialport/node_modules/bindings/bindings.js:88:9)
 at Object.<anonymous> (/home/pi/node.pi/node_modules/serialport/lib/bindings.js:3:35)
 at Module._compile (internal/modules/cjs/loader.js:778:30)
 at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)
 at Module.load (internal/modules/cjs/loader.js:653:32)
 at tryModuleLoad (internal/modules/cjs/loader.js:593:12)
 at Function.Module._load (internal/modules/cjs/loader.js:585:3)
 at Module.require (internal/modules/cjs/loader.js:692:17)
 at require (internal/modules/cjs/helpers.js:25:18)
 at Object.<anonymous> (/home/pi/node.pi/node_modules/serialport/lib/serialport.js:12:25)

 */
let SerialPort = require('serialport');
let port = new SerialPort('/dev/ttyS80', {
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
