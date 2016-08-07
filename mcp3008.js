"use strict";

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

var utils = require('./utils/utils.js'); // This is a class. Explicit location (path), not in 'node_modules'.
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
Gpio.prototype.tick = function() {
  this.writeSync(HIGH);
  this.writeSync(LOW);
};

var MCP3008 = function(clock, miso, mosi, cs) {

  clock |= 18; // GPIO_18, Wiring/PI4J 1
  miso  |= 23; // GPIO_23, Wiring/PI4J 4
  mosi  |= 24; // GPIO_24, Wiring/PI4J 5
  cs    |= 25; // GPIO_25, Wiring/PI4J 6
  console.log("Reading MCP3008: CLK:", clock, "MISO:", miso, "MOSI:", mosi, "CS:", cs);

  var debug = false;
  this.setDebug = function(val) {
    debug = val;
  };

  this.CHANNEL_0 = 0;
  this.CHANNEL_1 = 1;
  this.CHANNEL_2 = 2;
  this.CHANNEL_3 = 3;
  this.CHANNEL_4 = 4;
  this.CHANNEL_5 = 5;
  this.CHANNEL_6 = 6;
  this.CHANNEL_7 = 7;

  var SPI_CLK  = new Gpio(clock, OUT),
      SPI_MISO = new Gpio(miso,  IN), 
      SPI_MOSI = new Gpio(mosi,  OUT),
      SPI_CS   = new Gpio(cs,    OUT);

  SPI_CLK.low();
  SPI_MOSI.low();
  SPI_CS.low();

  this.readAdc = function(ch) {
  	ch |= this.CHANNEL_0;

    SPI_CS.high();
    SPI_CLK.low();
    SPI_CS.low();
    
    var adccommand = ch;
    if (debug) {
      console.log(">> 1 -       ADCCOMMAND", utils.hexFmt(adccommand, 4), utils.binFmt(adccommand, 16));
    }
    adccommand |= 0x18; // 0x18: 00011000
    if (debug) {
      console.log(">> 2 -       ADCCOMMAND", utils.hexFmt(adccommand, 4), utils.binFmt(adccommand, 16));
    }
    adccommand <<= 3;
    if (debug) {
      console.log(">> 3 -       ADCCOMMAND", utils.hexFmt(adccommand, 4), utils.binFmt(adccommand, 16));
    }
    // Send 5 bits: 8 - 3. 8 input channels on the MCP3008.
    for (var i=0; i<5; i++) {
      if (debug) {
        console.log(">> 4 - (i=" + i + ") ADCCOMMAND", utils.hexFmt(adccommand, 4), utils.binFmt(adccommand, 16));
      }
      if ((adccommand & 0x80) != 0x0) { // 0x80 = 0&10000000
        SPI_MOSI.high();
      } else {
        SPI_MOSI.low();
      }
      adccommand <<= 1;      
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
