"use strict";

console.log('To stop: Ctrl-C');
console.log("Usage: node " + __filename + " [verbose]");
global.verbose = false;

if (process.argv.length > 2) {
  if (process.argv[2] === 'verbose') {
    global.verbose = true;
  }
}

var BME280 = require('./bme280.js').BME280;

var bme280 = new BME280();

console.log("Init...")
bme280.init();

var iv = setInterval(function () {
  bme280.readTemperature(function(temp) {
    console.log("Temperature : " + temp.toFixed(2) + "°C");
    console.log("Humidity    : " + bme280.readHumidity().toFixed(2) + " %");
    console.log("Pressure    : " + (bme280.readPressure() / 100).toFixed(2) + " hPa");
    console.log("--------------------------------");
  });
}, 1000);

setTimeout(function () {
  clearInterval(iv); // Stop reading
  exit();
}, 10000);

// cleanup on exit
var exit = function() {
  console.log("Bye!");
  bme280.shutdown();
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C
