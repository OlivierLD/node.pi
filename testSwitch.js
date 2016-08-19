"use strict";

console.log("Usage: node " + __filename);
console.log("Ctrl+C to stop");

var Switch = require('./switch.js').Switch;

var relay = new Switch(7); // GPIO_07, pin #26, Wiring/PI4J 11

var on = true;
var iv = setInterval(function () {
  if (on === true) {
    console.log("Switching off");
    relay.off();
  } else {
    console.log("Switching on");
    relay.on();
  }
  on = !on;
}, 1000);

setTimeout(function () {
  clearInterval(iv); // Stop reading
  exit();
}, 100000);

// cleanup GPIO on exit
function exit() {
  relay.shutdown();
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C
