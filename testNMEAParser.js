"use strict";

console.log('To stop: Ctrl-C, or enter "quit" + [return] here in the console');
console.log("Usage: node " + __filename );

var util = require('util');
var parser = require('./NMEAParser.js');

try {
  var str = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";
  var parsed = parser.parseRMC(str);
  console.log("RMC: ", parsed);

  str = "$IIDBT,011.0,f,03.3,M,01.8,F*18";
  parsed = parser.parseDBT(str);
  console.log("DBT: ", parsed);

  str = "$GPGGA,014457,3739.853,N,12222.821,W,1,03,5.4,1.1,M,-28.2,M,,*7E";
  parsed = parser.parseGGA(str);
  console.log("GGA: ", parsed);
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
//console.log('received data:', util.inspect(text));
  if (text.startsWith('quit')) {
    done();
  }
});

function done() {
  console.log("Bye now!");
  exit();
  process.exit();
};
