"use strict";

console.log('To stop: Ctrl-C, or enter "quit" + [return] here in the console');
console.log("Usage: node " + __filename );

var util = require('util');
var parser = require('./NMEAParser.js');

try {
  var str = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";
  var parsed = parser.parseRMC(str);
  console.log("1 - RMC: ", parsed);
  console.log("Date:", new Date(parsed.epoch));

  str = "$IIDBT,011.0,f,03.3,M,01.8,F*18";
  parsed = parser.parseDBT(str);
  console.log("2 - DBT: ", parsed);

  str = "$GPGLL,4916.45,N,12311.12,W,225444,A,*1D";
  parsed = parser.parseGLL(str);
  console.log("3 - GLL: ", parsed);
  console.log("Date:", new Date(parsed.epoch));

  var auto = parser.autoparse(str);
  console.log("Auto:", auto);

  str = "$HCHDG,101.1,,,7.1,W*3C";
  parsed = parser.parseHDG(str);
  console.log("4 - HDG: ", parsed);

  str = "$IIXXX,whatever";
  auto = parser.autoparse(str);
  console.log("Auto:", auto);

  str = "$GPGGA,014457,3739.853,N,12222.821,W,1,03,5.4,1.1,M,-28.2,M,,*7E";
  parsed = parser.parseGGA(str);
  console.log("X - GGA: ", parsed);
} catch (err) {
  console.log("=============");
  console.log("Error:", err);
  console.log("=============");
}
console.log("Tests completed, enter [quit] or [Ctrl+C]")

var exit = function() {
  process.stdin.pause();
};

process.on('SIGINT', exit); // Ctrl C
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
  if (text.startsWith('quit')) {
    done();
  }
});

function done() {
  console.log("Bye now!");
  exit();
  process.exit();
};
