"use strict";

var utils = require('./utils/utils.js');
var EndianReaders = require('./utils/endianreaders.js').EndianReaders;
var i2c   = require('i2c-bus');

// Registers/etc.
var MODE1         = 0x00;
var MODE2         = 0x01;
var SUBADR1       = 0x02;
var SUBADR2       = 0x03;
var SUBADR3       = 0x04;
var PRESCALE      = 0xFE;
var LED0_ON_L     = 0x06;
var LED0_ON_H     = 0x07;
var LED0_OFF_L    = 0x08;
var LED0_OFF_H    = 0x09;
var ALL_LED_ON_L  = 0xFA;
var ALL_LED_ON_H  = 0xFB;
var ALL_LED_OFF_L = 0xFC;
var ALL_LED_OFF_H = 0xFD;
    
// Bits
var RESTART       = 0x80;
var SLEEP         = 0x10;
var ALLCALL       = 0x01;
var INVRT         = 0x10;
var OUTDRV        = 0x04;
    
var SERVO_ADDRESS  = 0x40;

var verbose = true;

var PWM = function(addr) {
  addr |= SERVO_ADDRESS;

  var i2c1;

  this.init = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
    setAllPWM(0, 0);
    if (verbose) {
      console.log("01 - Writing 0x%02x to register 0x%02x\n", OUTDRV, MODE2);
    }
    i2c1.writeByteSync(addr, MODE2, OUTDRV);
    if (verbose) {
      console.log("02 - Writing 0x%02x to register 0x%02x\n", ALLCALL, MODE1);
    }
    i2c1.writeByteSync(addr, MODE1, ALLCALL);
    setTimeout(function() {
      var mode1 = EndianReaders.readU8(i2c1, addr, MODE1);
      if (verbose) {
        console.log("03 - Device 0x%02x returned 0x%02x from register 0x%02x\n", addr, mode1, MODE1);
      }
      mode1 = mode1 & ~SLEEP; // wake up (reset sleep)
      if (verbose) {
        console.log("04 - Writing 0x%02x to register 0x%02x\n", mode1, MODE1);
      }
      i2c1.writeByteSync(addr, MODE1, mode1);
      utils.sleep(5); // wait for oscillator
    }, 5); // wait for oscillator
  };

  this.shutdown = function() {
    i2c1.closeSync();
  };
    
  this.setAllPWM = function(on, off) {
    // Sets a all PWM channels
    if (verbose) {
      console.log("05 - Writing 0x%02x to register 0x%02x\n", (on & 0xFF), ALL_LED_ON_L);
      console.log("06 - Writing 0x%02x to register 0x%02x\n", (on >> 8), ALL_LED_ON_H);
      console.log("07 - Writing 0x%02x to register 0x%02x\n", (off & 0xFF), ALL_LED_OFF_L);
      console.log("08 - Writing 0x%02x to register 0x%02x\n", (off >> 8), ALL_LED_OFF_H);
    }
    i2c1.writeByteSync(addr, ALL_LED_ON_L, (on & 0xFF));
    i2c1.writeByteSync(addr, ALL_LED_ON_H, (on >> 8));
    i2c1.writeByteSync(addr, ALL_LED_OFF_L, (off & 0xFF));
    i2c1.writeByteSync(addr, ALL_LED_OFF_H, (off >> 8));
  };
    
  this.setPWM = function(channel, on, off) {
    // Sets a single PWM channel
    if (verbose) {
      console.log("ON:0x%02x, OFF:0x%02x\n", on, off);
      console.log("09 - Writing 0x%02x to register 0x%02x\n", (on & 0xFF), LED0_ON_L + 4 * channel);
      console.log("10 - Writing 0x%02x to register 0x%02x\n", (on >> 8) & 0xFF, LED0_ON_H + 4 * channel);
      console.log("11 - Writing 0x%02x to register 0x%02x\n", (off & 0xFF), LED0_OFF_L + 4 * channel);
      console.log("12 - Writing 0x%02x to register 0x%02x\n", (off >> 8) & 0xFF, LED0_OFF_H + 4 * channel);
    }
    i2c1.writeByteSync(addr, LED0_ON_L + 4 * channel, (on & 0xFF));
    i2c1.writeByteSync(addr, LED0_ON_H + 4 * channel, ((on >> 8) & 0xFF));
    i2c1.writeByteSync(addr, LED0_OFF_L + 4 * channel, (off & 0xFF));
    i2c1.writeByteSync(addr, LED0_OFF_H + 4 * channel, ((off >> 8) & 0xFF));
  };
    
  this.setPWMFreq = function(freq) {
    // Sets the PWM frequency
    var preScaleVal = 25000000.0; // 25MHz
    preScaleVal /= 4096.0; // 12-bit
    preScaleVal /= freq;
    preScaleVal -= 1.0;
    if (verbose) {
      console.log("Setting PWM frequency to " + freq + " Hz");
      console.log("Estimated pre-scale:" + preScaleVal);
    }
    preScale = Math.floor(preScaleVal + 0.5);
    if (verbose) {
      System.out.println("Final pre-scale: " + preScale);
    }
    var oldMode = EndianReaders.readU8(i2c1, addr, MODE1);
    var newMode = ((oldMode & 0x7F) | 0x10); // sleep
    if (verbose) {
      console.log("13 - Writing 0x%02x to register 0x%02x\n", newMode, MODE1);
      console.log("14 - Writing 0x%02x to register 0x%02x\n", (Math.floor(preScale)), PRESCALE);
      console.log("15 - Writing 0x%02x to register 0x%02x\n", oldMode, MODE1);
    }
    i2c1.writeByteSync(addr, MODE1, newMode); // go to sleep
    i2c1.writeByteSync(addr, PRESCALE, (Math.floor(preScale)));
    i2c1.writeByteSync(addr, MODE1, oldMode);

    if (verbose) {
      console.log("16 - Writing 0x%02x to register 0x%02x\n", (oldMode | 0x80), MODE1);
    }
    setTimeout(function() {
      i2c1.writeByteSync(addr, MODE1, (oldMode | 0x80));
    }, 5);
  };
};

exports.PWM = PWM; // Made public.