"use strict";

let utils = require('./utils/utils.js');
let EndianReaders = require('./utils/endianreaders.js').EndianReaders;
let i2c = require('i2c-bus');

// Registers/etc.
const MODE1         = 0x00;
const MODE2         = 0x01;
const SUBADR1       = 0x02;
const SUBADR2       = 0x03;
const SUBADR3       = 0x04;
const PRESCALE      = 0xFE;
const LED0_ON_L     = 0x06;
const LED0_ON_H     = 0x07;
const LED0_OFF_L    = 0x08;
const LED0_OFF_H    = 0x09;
const ALL_LED_ON_L  = 0xFA;
const ALL_LED_ON_H  = 0xFB;
const ALL_LED_OFF_L = 0xFC;
const ALL_LED_OFF_H = 0xFD;

// Bits
const RESTART       = 0x80;
const SLEEP         = 0x10;
const ALLCALL       = 0x01;
const INVRT         = 0x10;
const OUTDRV        = 0x04;

const SERVO_ADDRESS  = 0x40;

let verbose = true;

function PWM(addr) {
  if (addr === undefined) {
    addr = SERVO_ADDRESS;
  }

  if (verbose) {
    console.log(">>> Creating PWM", utils.hexFmt(addr, 2));
  }

  var i2c1;

  this.init = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
    this.setAllPWM(0, 0);
    if (verbose) {
      console.log("01 - Writing %s to register %s", utils.hexFmt(OUTDRV), utils.hexFmt(MODE2));
    }
    i2c1.writeByteSync(addr, MODE2, OUTDRV);
    if (verbose) {
      console.log("02 - Writing %s to register %s", utils.hexFmt(ALLCALL), utils.hexFmt(MODE1));
    }
    i2c1.writeByteSync(addr, MODE1, ALLCALL);
    setTimeout(function() {
      let mode1 = EndianReaders.readU8(i2c1, addr, MODE1);
      if (verbose) {
        console.log("03 - Device %s returned %s from register %s", utils.hexFmt(addr), utils.hexFmt(mode1), utils.hexFmt(MODE1));
      }
      mode1 = mode1 & ~SLEEP; // wake up (reset sleep)
      if (verbose) {
        console.log("04 - Writing %s to register %s", utils.hexFmt(mode1), utils.hexFmt(MODE1));
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
      console.log("05 - Writing %s to register %s", utils.hexFmt(on & 0xFF), utils.hexFmt(ALL_LED_ON_L));
      console.log("06 - Writing %s to register %s", utils.hexFmt(on >> 8), utils.hexFmt(ALL_LED_ON_H));
      console.log("07 - Writing %s to register %s", utils.hexFmt(off & 0xFF), utils.hexFmt(ALL_LED_OFF_L));
      console.log("08 - Writing %s to register %s", utils.hexFmt(off >> 8), utils.hexFmt(ALL_LED_OFF_H));
    }
    i2c1.writeByteSync(addr, ALL_LED_ON_L, (on & 0xFF));
    i2c1.writeByteSync(addr, ALL_LED_ON_H, (on >> 8));
    i2c1.writeByteSync(addr, ALL_LED_OFF_L, (off & 0xFF));
    i2c1.writeByteSync(addr, ALL_LED_OFF_H, (off >> 8));
  };

  this.setPWM = function(channel, on, off) {
    // Sets a single PWM channel
    if (verbose) {
      console.log("ON:%s, OFF:%s", on, off);
      console.log("09 - Writing %s to register %s", utils.hexFmt(on & 0xFF), utils.hexFmt(LED0_ON_L + 4 * channel));
      console.log("10 - Writing %s to register %s", utils.hexFmt(on >> 8) & 0xFF, utils.hexFmt(LED0_ON_H + 4 * channel));
      console.log("11 - Writing %s to register %s", utils.hexFmt(off & 0xFF), utils.hexFmt(LED0_OFF_L + 4 * channel));
      console.log("12 - Writing %s to register %s", utils.hexFmt(off >> 8) & 0xFF, utils.hexFmt(LED0_OFF_H + 4 * channel));
    }
    i2c1.writeByteSync(addr, LED0_ON_L + 4 * channel, (on & 0xFF));
    i2c1.writeByteSync(addr, LED0_ON_H + 4 * channel, ((on >> 8) & 0xFF));
    i2c1.writeByteSync(addr, LED0_OFF_L + 4 * channel, (off & 0xFF));
    i2c1.writeByteSync(addr, LED0_OFF_H + 4 * channel, ((off >> 8) & 0xFF));
  };

  this.setPWMFreq = function(freq) {
    // Sets the PWM frequency
    let preScaleVal = 25000000.0; // 25MHz
    preScaleVal /= 4096.0; // 12-bit
    preScaleVal /= freq;
    preScaleVal -= 1.0;
    if (verbose) {
      console.log("Setting PWM frequency to " + freq + " Hz");
      console.log("Estimated pre-scale:" + preScaleVal);
    }
    let preScale = Math.floor(preScaleVal + 0.5);
    if (verbose) {
      console.log("Final pre-scale: " + preScale);
    }
    let oldMode = EndianReaders.readU8(i2c1, addr, MODE1);
    let newMode = ((oldMode & 0x7F) | 0x10); // sleep
    if (verbose) {
      console.log("13 - Writing %s to register %s", utils.hexFmt(newMode), utils.hexFmt(MODE1));
      console.log("14 - Writing %s to register %s", utils.hexFmt(Math.floor(preScale)), utils.hexFmt(PRESCALE));
      console.log("15 - Writing %s to register %s", utils.hexFmt(oldMode), utils.hexFmt(MODE1));
    }
    i2c1.writeByteSync(addr, MODE1, newMode); // go to sleep
    i2c1.writeByteSync(addr, PRESCALE, (Math.floor(preScale)));
    i2c1.writeByteSync(addr, MODE1, oldMode);

    if (verbose) {
      console.log("16 - Writing %s to register %s", utils.hexFmt(oldMode | 0x80), utils.hexFmt(MODE1));
    }
    // SLEEP Here
    utils.sleep(5);
//  setTimeout(function() {
      i2c1.writeByteSync(addr, MODE1, (oldMode | 0x80));
//  }, 5);
  };
};

exports.PWM = PWM; // Made public.
