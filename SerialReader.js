"use strict";

/*
 * Doc at https://www.npmjs.com/package/serialport
 */

let SerialPort = require('serialport');
let NMEAParser = require('./NMEAParser.js');

let fullContext = {};

function NMEA(serial, br) {

  let instance = this;

  if (serial === undefined) {
    serial = '/dev/ttyUSB0'; // Linux
  }
  if (br === undefined) {
    br = 4800;
  }

  console.log(">>> Reading Serial", serial, "br", br);

  let port = new SerialPort(serial, {
    baudRate: br,
    parser: SerialPort.parsers.raw
  });

  port.on('open', function() {
    console.log('Port open');
  });

  let dataBuffer = Buffer.from("");

  let EOS = "\r\n";

  function isSentenceCompleted(str) {
    let ok = false;
    if (str.charAt(0) === '$') {
      if (str.charAt(str.length - 3) === '*') {
        ok = true;
      }
    }
    return ok;
  }

  port.on('data', function (data) {
    try {
      dataBuffer = Buffer.concat([dataBuffer, data]);
      let stringBuffer = dataBuffer.toString();
      let sentences = stringBuffer.split(EOS);
      for (let i=0; i<sentences.length; i++) {
        if (sentences[i].charAt(0) === '$') {
          if (isSentenceCompleted(sentences[i])) {
            try {
              let id = NMEAParser.validate(sentences[i]); // Validation!
              if (id !== undefined) {
                if (global.displayMode === 'fmt') {
                  switch (id.id) {
                    case 'RMC':
                      let rmc = NMEAParser.parseRMC(sentences[i]);
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
                } else if (global.displayMode === 'auto') {
                  try {
                    let str = sentences[i];
                    let auto = NMEAParser.autoparse(str);
                    try {
                      if (auto !== undefined && auto.type !== undefined) {
                    //  console.log(">> Autoparsed:" + auto.type);
                        fullContext.lastID = auto.type;
                        switch (auto.type) {
                          case "GSV":
                            if (auto.satData !== undefined) {
                              fullContext.nbSat = auto.satData.length;
                              fullContext.satellites = auto.satData;
                            }
                            break;
                          case "RMC":
                            fullContext.date = new Date(auto.epoch);
                            fullContext.latitude = auto.pos.lat;
                            fullContext.longitude = auto.pos.lon;
                            fullContext.cog = auto.cog;
                            fullContext.sog = auto.sog;
                            break;
                          case "GGA":
                            fullContext.date = new Date(auto.epoch);
                            fullContext.latitude = auto.position.latitude;
                            fullContext.longitude = auto.position.longitude;
                            fullContext.altitude = auto.antenna.altitude;
                            break;
                        }
                        if (instance.onFullGPSData !== undefined) {
//                        console.log(">>> GPS Data sent to client:", fullContext);
                          instance.onFullGPSData(fullContext);
                        } else {
                          console.log(">>> NMEA:", JSON.stringify(fullContext));
                        }
                      }
                    } catch (err) {
                      console.log(err);
                      console.log("AutoParsed:", auto);
                    }
                  } catch (err) {
                    console.log(">> Error:", err);
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
  this.onFullGPSData;
}

// Made public.
exports.NMEA = NMEA;
