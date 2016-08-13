"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 */

var SerialPort = require('serialport');
var NMEAParser = require('./NMEAParser.js');

var NMEA = function(serial, br) {

  var instance = this;

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
              var id = NMEAParser.validate(sentences[i]); // Validation!
              if (id !== undefined) {
                if (global.displayMode === 'fmt') {
                  switch (id.id) {
                    case 'RMC':
                      var rmc = NMEAParser.parseRMC(sentences[i]);
                      if (rmc !== undefined) {
                  //    console.log("RMC:", rmc);
                        if (instance.onPosition !== undefined) {
                          if (rmc.pos !== undefined) {
                            instance.onPosition(rmc.pos);
                          }
                        }
                        if (instance.onTime !== undefined) {
                          if (rmc.epoch !== undefined) {
                            instance.onTime(rmc.epoch);
                          }
                        }
                        if (instance.onCOG !== undefined) {
                          if (rmc.cog !== undefined) {
                            instance.onCOG(rmc.cog);
                          }
                        }
                        if (instance.onSOG !== undefined) {
                          if (rmc.sog !== undefined) {
                            instance.onSOG(rmc.sog);
                          }
                        }
                      }
                      break;
                    default:
                 //   console.log(">> Sentence: " + sentences[i] + " not managed yet");
                      break;
                  }
                } else {
                  console.log(sentences[i]);
                }
              }
            } catch (err) {
              console.log("Argh!", err);
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

  this.onPosition;
  this.onTime;
  this.onCOG;
  this.onSOG;
};

// Made public.
exports.NMEA = NMEA;
