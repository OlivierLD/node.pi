"use strict";

console.log("Usage: node " + __filename);
console.log("Ctrl+C to stop");

let relay;
let Switch = require('./switch.js').Switch;
try {
  relay = new Switch(7); // GPIO_07, pin #26, Wiring/PI4J 11
} catch (err) {
  console.log(err);
  process.exit();
}
let on = true;
let iv = setInterval(() => {
  if (on === true) {
    console.log("Switching off");
    relay.off();
  } else {
    console.log("Switching on");
    relay.on();
  }
  on = !on;
}, 1000);

// cleanup GPIO on exit
let exit = () => {
  relay.shutdown();
  process.exit();
};

setTimeout(() => {
  clearInterval(iv); // Stop reading
  exit();
}, 100000); // Stop after 100 sec.

process.on('SIGINT', exit); // Ctrl C
