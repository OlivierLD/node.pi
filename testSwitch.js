"use strict";

console.log("Usage: node " + __filename);
console.log("Ctrl+C to stop");

let relay;
let Switch = require('./switch.js').Switch;
try {
  relay = new Switch(); // 7); // GPIO_07, pin #26, Wiring/PI4J 11
} catch (err) {
  console.log(err);
  process.exit();
}
let on = true;
// Flipping the switch every sec.
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

// Stop after 60 sec.
const DEMO_LEN = 60000;
setTimeout(() => {
  clearInterval(iv); // Stop reading
  exit();
}, DEMO_LEN);

process.on('SIGINT', exit); // Ctrl C
