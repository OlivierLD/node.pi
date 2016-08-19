"use strict";

// Can be used for a led, a relay... etc.

/**
 * For the onoff doc,
 * see https://github.com/fivdi/onoff
 */
var HIGH = 1;
var LOW  = 0;

var IN  = 'in';
var OUT = 'out';

var NONE    = 'none';
var RISING  = 'rising';
var FAILING = 'failing';
var BOTH    = 'both';

var Gpio = require('onoff').Gpio; // Constructor function for Gpio objects.

Gpio.prototype.high = function() {
  this.writeSync(HIGH);
};
Gpio.prototype.low = function() {
  this.writeSync(LOW);
};
Gpio.prototype.isHigh = function() {
  return this.readSync() === HIGH;
};

var defaultPin = 18; // GPIO_18, Wiring/PI4J 1

var Switch = function(pin) {
  if (pin === undefined) {
    pin = defaultPin;
  }
  console.log("Switch on pin:", pin);
  var PIN  = new Gpio(pin, OUT);

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
