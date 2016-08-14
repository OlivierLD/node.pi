"use strict";

console.log('To stop: Ctrl-C');
console.log("Usage: node " + __filename + " [verbose]");
global.verbose = false;

if (process.argv.length > 2) {
  if (process.argv[2] === 'verbose') {
    global.verbose = true;
  }
}

var L3GD20 = require('./l3gd20.js').L3GD20;
var L3GD20Dictionaries = require('./utils/L3GD20Dictionaries.js').L3GD20Dictionaries;

var l3gd20 = new L3GD20();

console.log("Init...")
try {
  l3gd20.open();
  l3gd20.setPowerMode(L3GD20Dictionaries.NORMAL);
  l3gd20.setFullScaleValue(L3GD20Dictionaries._250_DPS);
  l3gd20.setAxisXEnabled(true);
  l3gd20.setAxisYEnabled(true);
  l3gd20.setAxisZEnabled(true);
} catch (err) {
  console.log(err);
  process.exit();
}
console.log("Starting...");
l3gd20.init();
l3gd20.calibrate();

var prevX, prevY, prevZ;

var iv = setInterval(function () {
  var data = l3gd20.getCalOutValue();
  var x = data[0], y = data[1], z = data[2];
  if (x !== prevX || y !== prevY || z !== prevZ) {
    console.log(">> X:" + x + " Y:" + y + " Z:" + z);
  }
  prevX = x; prevY = y; prevZ = z;
}, 20);

setTimeout(function () {
  clearInterval(iv); // Stop reading
  exit();
}, 10000);

// cleanup on exit
var exit = function() {
  console.log("Bye!");
  l3gd20.shutdown();
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C
