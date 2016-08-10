"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 */

var SerialPort = require('serialport');
var NMEAParser = require('./NMEAParser.js');

var NMEA = function(serial, br) {

  if (serial === undefined) {
    serial = '/dev/ttyUSB0';
  }
  br |= 4800;

  console.log("Serial", serial, "br", br);

  var port = new SerialPort(serial, {
    baudRate: br,
    parser: SerialPort.parsers.raw
  });

  port.on('open', function() {
    console.log('Port open');
  });

  var received = "";
  var dataBuffer = Buffer.from("");

  var EOS = "\r\n";

  var isSentenceCompleted = function(str) {
    var ok = false;
    if (str.charAt(0) === '$') {
      if (str.charAt(str.length - 3) === '*') {
        ok = true;
      }
    }
    return ok;
  };

  port.on('data', function (data) {
    try {
      dataBuffer = Buffer.concat([dataBuffer, data]);
      var stringBuffer = dataBuffer.toString();
      var sentences = stringBuffer.split(EOS);
      for (var i=0; i<sentences.length; i++) {
        if (sentences[i].charAt(0) === '$') {
          if (isSentenceCompleted(sentences[i])) {
            try {
              NMEAParser.validate(sentences[i]); // Validation!
              console.log(">> Sentence: ", sentences[i]); // TODO Manage that one
            } catch (err) {
              console.log("Argh!");
            }
          } else {
            dataBuffer = Buffer.from(sentences[i]);
          }
        }
      }
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

  this.exit = function() {
    port.close();
  };
};

// Made public.
exports.NMEA = NMEA;
