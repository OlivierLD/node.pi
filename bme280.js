"use strict";

/*
 * Doc is at https://www.npmjs.com/package/i2c-bus
 */

var utils = require('./utils/utils.js');
var EndianReaders = require('./utils/endianreaders.js').EndianReaders;
var i2c   = require('i2c-bus');

var BME280_I2CADDR = 0x77;

  // Operating Modes
var BME280_OSAMPLE_1  = 1;
var BME280_OSAMPLE_2  = 2;
var BME280_OSAMPLE_4  = 3;
var BME280_OSAMPLE_8  = 4;
var BME280_OSAMPLE_16 = 5;

  // BME280 Registers
var BME280_REGISTER_DIG_T1 = 0x88;  // Trimming parameter registers
var BME280_REGISTER_DIG_T2 = 0x8A;
var BME280_REGISTER_DIG_T3 = 0x8C;

var BME280_REGISTER_DIG_P1 = 0x8E;
var BME280_REGISTER_DIG_P2 = 0x90;
var BME280_REGISTER_DIG_P3 = 0x92;
var BME280_REGISTER_DIG_P4 = 0x94;
var BME280_REGISTER_DIG_P5 = 0x96;
var BME280_REGISTER_DIG_P6 = 0x98;
var BME280_REGISTER_DIG_P7 = 0x9A;
var BME280_REGISTER_DIG_P8 = 0x9C;
var BME280_REGISTER_DIG_P9 = 0x9E;

var BME280_REGISTER_DIG_H1 = 0xA1;
var BME280_REGISTER_DIG_H2 = 0xE1;
var BME280_REGISTER_DIG_H3 = 0xE3;
var BME280_REGISTER_DIG_H4 = 0xE4;
var BME280_REGISTER_DIG_H5 = 0xE5;
var BME280_REGISTER_DIG_H6 = 0xE6;
var BME280_REGISTER_DIG_H7 = 0xE7;

var BME280_REGISTER_CHIPID    = 0xD0;
var BME280_REGISTER_VERSION   = 0xD1;
var BME280_REGISTER_SOFTRESET = 0xE0;

var BME280_REGISTER_CONTROL_HUM   = 0xF2;
var BME280_REGISTER_CONTROL       = 0xF4;
var BME280_REGISTER_CONFIG        = 0xF5;
var BME280_REGISTER_PRESSURE_DATA = 0xF7;
var BME280_REGISTER_TEMP_DATA     = 0xFA;
var BME280_REGISTER_HUMIDITY_DATA = 0xFD;

var BME280 = function(addr) {
  addr |= BME280_I2CADDR;

  var i2c1;
  var mode = BME280_OSAMPLE_8;

  this.init = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
    readCalibrationData();
  };
  this.shutdown = function() {
    i2c1.closeSync();
  };

  var dig_T1 = 0;
  var dig_T2 = 0;
  var dig_T3 = 0;

  var dig_P1 = 0;
  var dig_P2 = 0;
  var dig_P3 = 0;
  var dig_P4 = 0;
  var dig_P5 = 0;
  var dig_P6 = 0;
  var dig_P7 = 0;
  var dig_P8 = 0;
  var dig_P9 = 0;

  var dig_H1 = 0;
  var dig_H2 = 0;
  var dig_H3 = 0;
  var dig_H4 = 0;
  var dig_H5 = 0;
  var dig_H6 = 0;

  var tFine = 0.0;

  var readCalibrationData = function() {
    // Reads the calibration data from the IC
    dig_T1 = EndianReaders.readU16LE(i2c1, addr, BME280_REGISTER_DIG_T1);
    dig_T2 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_T2);
    dig_T3 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_T3);

    dig_P1 = EndianReaders.readU16LE(i2c1, addr, BME280_REGISTER_DIG_P1);
    dig_P2 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P2);
    dig_P3 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P3);
    dig_P4 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P4);
    dig_P5 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P5);
    dig_P6 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P6);
    dig_P7 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P7);
    dig_P8 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P8);
    dig_P9 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_P9);

    dig_H1 = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H1);
    dig_H2 = EndianReaders.readS16LE(i2c1, addr, BME280_REGISTER_DIG_H2);
    dig_H3 = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H3);
    dig_H6 = EndianReaders.readS8(i2c1, addr, BME280_REGISTER_DIG_H7);

    var h4 = EndianReaders.readS8(i2c1, addr, BME280_REGISTER_DIG_H4);
    h4 = (h4 << 24) >> 20;
    dig_H4 = h4 | (EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H5) & 0x0F);

    var h5 = EndianReaders.readS8(i2c1, addr, BME280_REGISTER_DIG_H6);
    h5 = (h5 << 24) >> 20;
    dig_H5 = h5 | (EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H5) >> 4 & 0x0F);
  };

  var readRawTemp = function(cb) {
    // Reads the raw (uncompensated) temperature from the sensor
    var meas = mode;
    i2c1.writeByteSync(addr, BME280_REGISTER_CONTROL_HUM, meas); // HUM ?
    meas = mode << 5 | mode << 2 | 1;
    i2c1.writeByteSync(addr, BME280_REGISTER_CONTROL, meas);

    var sleepTime = 0.00125 + 0.0023 * (1 << mode);
    sleepTime = sleepTime + 0.0023 * (1 << mode) + 0.000575;
    sleepTime = sleepTime + 0.0023 * (1 << mode) + 0.000575;

    setTimeout(function() {
      var msb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA);
      var lsb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA + 1);
      var xlsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA + 2);
      var raw  = ((msb << 16) | (lsb << 8) | xlsb) >> 4;
      cb(raw);
    }, sleepTime * 1000);
  };

  var readRawPressure = function() {
    // Reads the raw (uncompensated) pressure level from the sensor
    var msb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA);
    var lsb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA + 1);
    var xlsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA + 2);
    var raw = ((msb << 16) | (lsb << 8) | xlsb) >> 4;
    return raw;
  };

  var readRawHumidity = function() {
    var msb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_HUMIDITY_DATA);
    var lsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_HUMIDITY_DATA + 1);
    var raw = (msb << 8) | lsb;
    return raw;
  };

  this.readTemperature = function(cb) {
    // Gets the compensated temperature in degrees celcius
    readRawTemp(function(val) {
      var UT = val;
   // console.log("RawTemp:", val);
      var var1 = 0;
      var var2 = 0;
      var temp = 0.0;

      // Read raw temp before aligning it with the calibration values
      var1 = (UT / 16384.0 - dig_T1 / 1024.0) * dig_T2;
      var2 = ((UT / 131072.0 - dig_T1 / 8192.0) * (UT / 131072.0 - dig_T1 / 8192.0)) * dig_T3;
      tFine = (var1 + var2);
      temp = (var1 + var2) / 5120.0;
      cb(temp);
    });
  };

  this.readPressure = function() {
    // Gets the compensated pressure in pascal
    var adc = readRawPressure();
    var var1 = (tFine / 2.0) - 64000.0;
    var var2 = var1 * var1 * (dig_P6 / 32768.0);
    var2 = var2 + var1 * dig_P5 * 2.0;
    var2 = (var2 / 4.0) + (dig_P4 * 65536);
    var1 = (dig_P3 * var1 * var1 / 524288.0 + dig_P2 * var1) / 524288.0;
    var1 = (1.0 + var1 / 32768.0) * dig_P1;
    if (var1 === 0) {
      return 0;
    }
    var p = 1048576.0 - adc;
    p = ((p - var2 / 4096.0) * 6250.0) / var1;
    var1 = dig_P9 * p * p / 2147483648.0;
    var2 = p * dig_P8 / 32768.0;
    p = p + (var1 + var2 + dig_P7) / 16.0;
    return p;
  };

  this.readHumidity = function() {
    var adc = readRawHumidity();
    var h = tFine - 76800.0;
    h = (adc - (dig_H4 * 64.0 + dig_H5 / 16384.0 * h)) *
               (dig_H2 / 65536.0 * (1.0 + dig_H6 / 67108864.0 * h * (1.0 + dig_H3 / 67108864.0 * h)));
    h = h * (1.0 - dig_H1 * h / 524288.0);
    if (h > 100) {
      h = 100;
    } else if (h < 0) {
      h = 0;
    }
    return h;
  };

  var standardSeaLevelPressure = 101325;

  this.readAltitude = function() {
    // Calculates the altitude in meters
    var altitude = 0.0;
    var pressure = readPressure();
    altitude = 44330.0 * (1.0 - Math.pow(pressure / standardSeaLevelPressure, 0.1903));
    return altitude;
  };

  this.readAllData = function(cb) {
    this.readTemperature(function(temp) {
      var hum = this.readHumidity();
      var press = this.readPressure();
      if (cb !== undefined) {
        cb({ "temperature": temp,
             "humidity": hum,
             "pressure": press });
      }
    });
  };
};

exports.BME280 = BME280; // Made public.
