"use strict";

/*
 * Doc is at https://www.npmjs.com/package/i2c-bus
 */

let utils = require('./utils/utils.js');
let EndianReaders = require('./utils/endianreaders.js').EndianReaders;
let i2c   = require('i2c-bus');

const BME280_I2CADDR = 0x77;

  // Operating Modes
const BME280_OSAMPLE_1  = 1;
const BME280_OSAMPLE_2  = 2;
const BME280_OSAMPLE_4  = 3;
const BME280_OSAMPLE_8  = 4;
const BME280_OSAMPLE_16 = 5;

  // BME280 Registers
const BME280_REGISTER_DIG_T1 = 0x88;  // Trimming parameter registers
const BME280_REGISTER_DIG_T2 = 0x8A;
const BME280_REGISTER_DIG_T3 = 0x8C;

const BME280_REGISTER_DIG_P1 = 0x8E;
const BME280_REGISTER_DIG_P2 = 0x90;
const BME280_REGISTER_DIG_P3 = 0x92;
const BME280_REGISTER_DIG_P4 = 0x94;
const BME280_REGISTER_DIG_P5 = 0x96;
const BME280_REGISTER_DIG_P6 = 0x98;
const BME280_REGISTER_DIG_P7 = 0x9A;
const BME280_REGISTER_DIG_P8 = 0x9C;
const BME280_REGISTER_DIG_P9 = 0x9E;

const BME280_REGISTER_DIG_H1 = 0xA1;
const BME280_REGISTER_DIG_H2 = 0xE1;
const BME280_REGISTER_DIG_H3 = 0xE3;
const BME280_REGISTER_DIG_H4 = 0xE4;
const BME280_REGISTER_DIG_H5 = 0xE5;
const BME280_REGISTER_DIG_H6 = 0xE6;
const BME280_REGISTER_DIG_H7 = 0xE7;

const BME280_REGISTER_CHIPID    = 0xD0;
const BME280_REGISTER_VERSION   = 0xD1;
const BME280_REGISTER_SOFTRESET = 0xE0;

const BME280_REGISTER_CONTROL_HUM   = 0xF2;
const BME280_REGISTER_CONTROL       = 0xF4;
const BME280_REGISTER_CONFIG        = 0xF5;
const BME280_REGISTER_PRESSURE_DATA = 0xF7;
const BME280_REGISTER_TEMP_DATA     = 0xFA;
const BME280_REGISTER_HUMIDITY_DATA = 0xFD;

function BME280(addr) {
  if (addr === undefined) {
    addr = BME280_I2CADDR;
  }

  let i2c1;
  let mode = BME280_OSAMPLE_8;

  this.init = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
    readCalibrationData();
  };
  this.shutdown = function() {
    i2c1.closeSync();
  };

  let dig_T1 = 0;
  let dig_T2 = 0;
  let dig_T3 = 0;

  let dig_P1 = 0;
  let dig_P2 = 0;
  let dig_P3 = 0;
  let dig_P4 = 0;
  let dig_P5 = 0;
  let dig_P6 = 0;
  let dig_P7 = 0;
  let dig_P8 = 0;
  let dig_P9 = 0;

  let dig_H1 = 0;
  let dig_H2 = 0;
  let dig_H3 = 0;
  let dig_H4 = 0;
  let dig_H5 = 0;
  let dig_H6 = 0;

  let tFine = 0.0;

  function readCalibrationData() {
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

    let h4 = EndianReaders.readS8(i2c1, addr, BME280_REGISTER_DIG_H4);
    h4 = (h4 << 24) >> 20;
    dig_H4 = h4 | (EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H5) & 0x0F);

    let h5 = EndianReaders.readS8(i2c1, addr, BME280_REGISTER_DIG_H6);
    h5 = (h5 << 24) >> 20;
    dig_H5 = h5 | (EndianReaders.readU8(i2c1, addr, BME280_REGISTER_DIG_H5) >> 4 & 0x0F);
  }

  function readRawTemp(cb) {
    // Reads the raw (uncompensated) temperature from the sensor
    let meas = mode;
    i2c1.writeByteSync(addr, BME280_REGISTER_CONTROL_HUM, meas); // HUM ?
    meas = mode << 5 | mode << 2 | 1;
    i2c1.writeByteSync(addr, BME280_REGISTER_CONTROL, meas);

    let sleepTime = 0.00125 + 0.0023 * (1 << mode);
    sleepTime = sleepTime + 0.0023 * (1 << mode) + 0.000575;
    sleepTime = sleepTime + 0.0023 * (1 << mode) + 0.000575;

    setTimeout(function() {
      let msb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA);
      let lsb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA + 1);
      let xlsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_TEMP_DATA + 2);
      let raw  = ((msb << 16) | (lsb << 8) | xlsb) >> 4;
      cb(raw);
    }, sleepTime * 1000);
  }

  function readRawPressure() {
    // Reads the raw (uncompensated) pressure level from the sensor
    let msb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA);
    let lsb  = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA + 1);
    let xlsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_PRESSURE_DATA + 2);
    let raw = ((msb << 16) | (lsb << 8) | xlsb) >> 4;
    return raw;
  }

  function readRawHumidity() {
    let msb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_HUMIDITY_DATA);
    let lsb = EndianReaders.readU8(i2c1, addr, BME280_REGISTER_HUMIDITY_DATA + 1);
    let raw = (msb << 8) | lsb;
    return raw;
  }

  this.readTemperature = function(cb) {
    // Gets the compensated temperature in degrees Celcius
    readRawTemp(function(val) {
      let UT = val;
   // console.log("RawTemp:", val);
      // Read raw temp before aligning it with the calibration values
      let var1 = (UT / 16384.0 - dig_T1 / 1024.0) * dig_T2;
      let var2 = ((UT / 131072.0 - dig_T1 / 8192.0) * (UT / 131072.0 - dig_T1 / 8192.0)) * dig_T3;
      tFine = (var1 + var2);
      let temp = (var1 + var2) / 5120.0;
      cb(temp);
    });
  };

  this.readPressure = function() {
    // Gets the compensated pressure in pascal
    let adc = readRawPressure();
    let var1 = (tFine / 2.0) - 64000.0;
    let var2 = var1 * var1 * (dig_P6 / 32768.0);
    var2 = var2 + var1 * dig_P5 * 2.0;
    var2 = (var2 / 4.0) + (dig_P4 * 65536);
    var1 = (dig_P3 * var1 * var1 / 524288.0 + dig_P2 * var1) / 524288.0;
    var1 = (1.0 + var1 / 32768.0) * dig_P1;
    if (var1 === 0) {
      return 0;
    }
    let p = 1048576.0 - adc;
    p = ((p - var2 / 4096.0) * 6250.0) / var1;
    var1 = dig_P9 * p * p / 2147483648.0;
    var2 = p * dig_P8 / 32768.0;
    p = p + (var1 + var2 + dig_P7) / 16.0;
    return p;
  };

  this.readHumidity = function() {
    let adc = readRawHumidity();
    let h = tFine - 76800.0;
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

  let standardSeaLevelPressure = 101325;
  this.setPRMSL = function(press) {
    standardSeaLevelPressure = press;
  };

  function calculateAltitude(press) {
    // Calculates the altitude in meters
    return 44330.0 * (1.0 - Math.pow(press / standardSeaLevelPressure, 0.1903));
  }

  this.readAltitude = function() {
    return calculateAltitude(readPressure());
  };

  this.readAllData = function(cb) {
    let instance = this;
    this.readTemperature(function(temp) {
      let hum = instance.readHumidity();
      let press = instance.readPressure();
      if (cb !== undefined) {
        cb({ "temperature": temp,
             "humidity": hum,
             "pressure": press,
             "altitude": calculateAltitude(press) });
      }
    });
  };
};

exports.BME280 = BME280; // Made public.
