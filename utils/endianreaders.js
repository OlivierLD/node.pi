"use strict";

var utils = require('./utils.js');

var Endianness = {
  LITTLE_ENDIAN: 1,
  BIG_ENDIAN: 2
};

var EndianReaders = {
  /**
   * Read an unsigned byte from the I2C device
   */
  readU8: function(device, i2cAddr, reg) {
    var result = 0;
    try {
      result = device.readByteSync(i2cAddr, reg);
    } catch (ex) {
      console.log(ex);
    }
    if (global.verbose === true) {
      console.log("(U8) I2C: Device " + utils.hexFmt(i2cAddr, 2) + " returned " + utils.hexFmt(result, 2) + " from reg " + utils.hexFmt(reg, 2));
    }
    return result; // & 0xFF;
  },
  /**
   * Read a signed byte from the I2C device
   */
  readS8: function(device, i2cAddr, reg) {
    var result = 0;
    try {
      result = device.readByteSync(i2cAddr, reg); // & 0x7F;
      if (result > 127) {
        result -= 256;
      }
    } catch (ex) {
      console.log(ex);
    }
    if (global.verbose === true) {
      console.log("(S8) I2C: Device " + utils.hexFmt(i2cAddr, 2) + " returned " + utils.hexFmt(result, 2) + " from reg " + utils.hexFmt(reg, 2));
    }
    return result; // & 0xFF;
  },
  readU16: function(device, i2cAddr, register, endianness) {
    var hi = this.readU8(device, i2cAddr, register);
    var lo = this.readU8(device, i2cAddr, register + 1);
    return ((endianness === Endianness.BIG_ENDIAN) ? (hi << 8) + lo : (lo << 8) + hi); // & 0xFFFF;
  },
  readS16: function(device, i2cAddr, register, endianness) {
    var hi = 0, lo = 0;
    if (endianness === Endianness.BIG_ENDIAN) {
      hi = this.readS8(device, i2cAddr, register);
      lo = this.readU8(device, i2cAddr, register + 1);
    } else {
      lo = this.readU8(device, i2cAddr, register);
      hi = this.readS8(device, i2cAddr, register + 1);
    }
    return ((hi << 8) + lo); // & 0xFFFF;
  },
  readU16LE: function(device, i2cAddr, register) {
    return this.readU16(device, i2cAddr, register, Endianness.LITTLE_ENDIAN);
  },
  readU16BE: function(device, i2cAddr, register) {
    return this.readU16(device, i2cAddr, register, Endianness.BIG_ENDIAN);
  },
  readS16LE: function(device, i2cAddr, register) {
    return this.readS16(device, i2cAddr, register, Endianness.LITTLE_ENDIAN);
  },
  readS16BE: function(device, i2cAddr, register) {
    return this.readS16(device, i2cAddr, register, Endianness.BIG_ENDIAN);
  }
};

// Made public.
exports.Endianness    = Endianness;
exports.EndianReaders = EndianReaders;
