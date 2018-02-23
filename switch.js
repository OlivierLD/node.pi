"use strict";

// Can be used for a led, a relay... etc.

/**
 * For the onoff doc,
 * see https://github.com/fivdi/onoff
 */
const State = {
  HIGH: 1,
  LOW: 0
};

var Direction = {
  IN: 'in',
  OUT: 'out'
};

const Event = {
  NONE: 'none',
  RISING: 'rising',
  FAILING: 'failing',
  BOTH: 'both'
};

const Gpio = require('onoff').Gpio; // Constructor function for Gpio objects.

Gpio.prototype.high = function() {
  this.writeSync(State.HIGH);
};
Gpio.prototype.low = function() {
  this.writeSync(State.LOW);
};
Gpio.prototype.isHigh = function() {
  return this.readSync() === State.HIGH;
};

const defaultPin = 18; // GPIO_18, Wiring/PI4J 1

var Switch = function(pin) {
  if (pin === undefined) {
    pin = defaultPin;
  }
  console.log("Switch on pin:", pin);
  let PIN  = new Gpio(pin, Direction.OUT);

  this.on = function() {
    PIN.high();
  };
  this.off = function() {
    PIN.low();
  };

  this.shutdown = function() {
    PIN.unexport();
  };
};

exports.Switch = Switch; // Made public.
