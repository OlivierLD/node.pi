"use strict";

console.log('To stop: Ctrl-C, or enter "quit" + [return] here in the console');
console.log("Usage: node " + __filename );

let fs = require('fs'),
    readline = require('readline');;
let util = require('util');
let parser = require('./NMEAParser.js');

let NMEA_ARRAY = [
  "$IIRMB,A,0.23,R,,HMB-3   ,,,,,001.20,185,,V,A*1E",
  "$IIRMC,172347,A,3730.079,N,12228.853,W,00.0,301,300814,15,E,A*1E",
  "$IIVHW,,,002,M,00.0,N,,*66",
  "$IIVLW,08195,N,000.0,N*56",
  "$IIVWR,105,L,06.5,N,,,,*78",
  "$IIGLL,3730.079,N,12228.853,W,172347,A,A*4A",
  "$IIHDG,002,,,15,E*14",
  "$IIMTW,+18.0,C*31",
  "$IIMWV,255,R,06.9,N,A*1E",
  "$IIMWV,255,T,06.5,N,A*14",
  "$IIRMC,172347,A,3730.078,N,12228.853,W,00.0,301,300814,15,E,A*1F",
  "$IIVHW,,,002,M,00.0,N,,*66",
  "$IIVLW,08195,N,000.0,N*56",
  "$IIVWR,105,L,06.9,N,,,,*74",
  "$IIGLL,3730.078,N,12228.853,W,172347,A,A*4B",
  "$IIHDG,002,,,15,E*14",
  "$IIMTW,+18.0,C*31",
  "$IIMWV,256,R,07.1,N,A*14",
  "$IIMWV,255,T,06.9,N,A*18",
  "$IIRMB,A,0.23,R,,HMB-3   ,,,,,001.20,185,,V,A*1E",
  "$IIRMC,172349,A,3730.078,N,12228.853,W,00.0,301,300814,15,E,A*11",
  "$IIVHW,,,002,M,00.0,N,,*66",
  "$IIVLW,08195,N,000.0,N*56",
  "$IIVWR,104,L,07.1,N,,,,*7C",
  "$IIGLL,3730.078,N,12228.853,W,172349,A,A*45",
  "$IIHDG,002,,,15,E*14",
  "$IIMTW,+18.0,C*31",
  "$IIMWV,256,R,07.1,N,A*14",
  "$IIMWV,256,T,07.1,N,A*12",
  "$IIRMC,172349,A,3730.078,N,12228.853,W,00.0,301,300814,15,E,A*11",
  "$IIVHW,,,002,M,00.0,N,,*66",
  "$IIVLW,08195,N,000.0,N*56",
  "$IIVWR,104,L,07.1,N,,,,*7C",
  "$IIGLL,3730.078,N,12228.853,W,172349,A,A*45",
  "$IIHDG,001,,,15,E*17",
  "$IIMTW,+18.0,C*31",
  "$IIMWV,256,R,06.9,N,A*1D",
  "$IIMWV,256,T,07.1,N,A*12",
  "$IIRMB,A,0.23,R,,HMB-3   ,,,,,001.20,184,,V,A*1F",
  "$IIRMC,172349,A,3730.078,N,12228.853,W,00.0,301,300814,15,E,A*11",
  "$IIVHW,,,001,M,00.0,N,,*65"
];

try {
  console.log('== Sample strings ==');
  let str = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";
  let parsed = parser.parseRMC(str);
  console.log("1 - RMC: ", parsed);
  console.log("Date:", new Date(parsed.epoch));

  str = "$IIDBT,011.0,f,03.3,M,01.8,F*18";
  parsed = parser.parseDBT(str);
  console.log("2 - DBT: ", parsed);

  str = "$GPGLL,4916.45,N,12311.12,W,225444,A,*1D";
  parsed = parser.parseGLL(str);
  console.log("3 - GLL: ", parsed);
  console.log("Date:", new Date(parsed.epoch));

  let auto = parser.autoparse(str);
  console.log("Auto:", auto);

  str = "$HCHDG,101.1,,,7.1,W*3C";
  parsed = parser.parseHDG(str);
  console.log("4 - HDG: ", parsed);

  try {
    str = "$GPGGA,014457,3739.853,N,12222.821,W,1,03,5.4,1.1,M,-28.2,M,,*7E";
    parsed = parser.parseGGA(str);
    console.log("5 - GGA: ", parsed);
  } catch (err) {
    console.log(">> Error for GGA:", err);
  }

  try {
    str = "$IIXXX,whatever";
    auto = parser.autoparse(str);
    console.log("Auto:", auto);
  } catch (err) {
    console.log(">> Expected Error:", err);
  }

  // From hard-coded sample data
  console.log('== Sample data ==');
  for (let i=0; i<NMEA_ARRAY.length; i++) {
    try {
      str = NMEA_ARRAY[i];
      auto = parser.autoparse(str);
      console.log("Auto:", auto);
    } catch (err) {
      console.log(">> Error:", err);
    }
  }
  // From data file
  console.log('== Sample data files ==');
  let rd = readline.createInterface({
    input: fs.createReadStream('nmea/headless.nmea'),
//  output: process.stdout,
    terminal: false
  });

  rd.on('line', (line) => {
//  console.log("Line by line:" , line);
    try {
      console.log("Parsing ", line);
      if (line.startsWith("$RPSTD,")) {
        console.log("... skipping.")
      } else {
        auto = parser.autoparse(line);
        console.log("Auto:", auto);
      }
    } catch (err) {
      console.log(">> Error in line ", line, err);
    }
  }).on('close', () => {
    console.log("Data file exhausted");
    console.log("Type 'quit' now:");
  });

  let rd2 = readline.createInterface({
    input: fs.createReadStream('nmea/gps.nmea'),
//  output: process.stdout,
    terminal: false
  });

  rd2.on('line', (line) => {
//  console.log("Line by line:" , line);
    try {
      console.log("Parsing ", line);
      auto = parser.autoparse(line);
      console.log("Auto:", auto);
    } catch (err) {
      console.log(">> Error in line ", line, err);
    }
  }).on('close', () => {
    console.log("Data file exhausted");
    console.log("Type 'quit' now:");
  });

  console.log('== Test bottom ==');
} catch (err) {
  console.log("=============");
  console.log(">> Error:", err);
  console.log("=============");
}
console.log("Tests completed, enter [quit] or [Ctrl+C]")

function exit() {
  process.stdin.pause();
}

process.on('SIGINT', exit); // Ctrl C
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (text) => {
  if (text.startsWith('quit')) {
    done();
  }
});

function done() {
  console.log("Bye now!");
  exit();
  process.exit();
}
