"use strict";

/**
 * For the onoff doc, 
 * see https://github.com/fivdi/onoff
 */

var State = {
  HIGH: 1,
  LOW: 0
};

var Direction = {
  IN: 'in',
  OUT: 'out'
};

var Event = {
  NONE: 'none',
  RISING: 'rising',
  FAILING: 'failing',
  BOTH: 'both'
};

var utils = require('./utils/utils.js'); // This is a class. Explicit location (path), not in 'node_modules'.
var Gpio = require('onoff').Gpio; // Constructor function for Gpio objects.

Gpio.prototype.high = function() {
  this.writeSync(State.HIGH);
};    
Gpio.prototype.low = function() {
  this.writeSync(State.LOW);
};    
Gpio.prototype.isHigh = function() {
  return this.readSync() === State.HIGH;
};
Gpio.prototype.tick = function() {
  this.writeSync(State.HIGH);
  this.writeSync(State.LOW);
};

var defaultClock = 18; // GPIO_18, Wiring/PI4J 1
var defaultMiso  = 23; // GPIO_23, Wiring/PI4J 4
var defaultMosi  = 24; // GPIO_24, Wiring/PI4J 5
var defaultCs    = 25; // GPIO_25, Wiring/PI4J 6

var MCP3008 = function(clock, miso, mosi, cs) {

  if (clock === undefined) { clock = defaultClock };
  if (miso === undefined)  { miso  = defaultMiso };
  if (mosi === undefined)  { mosi = defaultMosi };
  if (cs === undefined)    { cs = defaultCs };
  console.log("Reading MCP3008: CLK:", clock, "MISO:", miso, "MOSI:", mosi, "CS:", cs);

  var debug = false;
  this.setDebug = function(val) {
    debug = val;
  };

  this.channels = {
    CHANNEL_0: 0,
    CHANNEL_1: 1,
    CHANNEL_2: 2,
    CHANNEL_3: 3,
    CHANNEL_4: 4,
    CHANNEL_5: 5,
    CHANNEL_6: 6,
    CHANNEL_7: 7 };

  var SPI_CLK  = new Gpio(clock, Direction.OUT),
      SPI_MISO = new Gpio(miso,  Direction.IN),
      SPI_MOSI = new Gpio(mosi,  Direction.OUT),
      SPI_CS   = new Gpio(cs,    Direction.OUT);

  SPI_CLK.low();
  SPI_MOSI.low();
  SPI_CS.low();

  this.readAdc = function(ch) {
  	ch |= this.channels.CHANNEL_0;

    SPI_CS.high();
    SPI_CLK.low();
    SPI_CS.low();
    
    var adcCommand = ch;
    if (debug) {
      console.log(">> 1 -       ADCCOMMAND", utils.hexFmt(adcCommand, 4), utils.binFmt(adcCommand, 16));
    }
    adcCommand |= 0x18; // 0x18: 00011000
    if (debug) {
      console.log(">> 2 -       ADCCOMMAND", utils.hexFmt(adcCommand, 4), utils.binFmt(adcCommand, 16));
    }
    adcCommand <<= 3;
    if (debug) {
      console.log(">> 3 -       ADCCOMMAND", utils.hexFmt(adcCommand, 4), utils.binFmt(adcCommand, 16));
    }
    // Send 5 bits: 8 - 3. 8 input channels on the MCP3008.
    for (var i=0; i<5; i++) {
      if (debug) {
        console.log(">> 4 - (i=" + i + ") ADCCOMMAND", utils.hexFmt(adcCommand, 4), utils.binFmt(adcCommand, 16));
      }
      if ((adcCommand & 0x80) != 0x0) { // 0x80 = 0&10000000
        SPI_MOSI.high();
      } else {
        SPI_MOSI.low();
      }
      adcCommand <<= 1;
      SPI_CLK.tick();
    }
    var adcOut = 0;
    for (var i=0; i<12; i++) { // Read in one empty bit, one null bit and 10 ADC bits    
      SPI_CLK.tick();
      adcOut <<= 1;

      if (SPI_MISO.isHigh()) {
        adcOut |= 0x1;
      }
      if (debug) {
        console.log(">> ADCOUT", utils.hexFmt(adcOut, 4), utils.binFmt(adcOut, 16));
      }
    }
    SPI_CS.high();
    adcOut >>= 1; // Drop first bit
    return adcOut;
  };

  this.shutdown = function() {
    SPI_CLK.unexport();
    SPI_MISO.unexport();
    SPI_CS.unexport();
    SPI_MOSI.unexport();
  };
};

exports.MCP3008 = MCP3008; // Made public.
