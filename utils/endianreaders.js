"use strict";

var Endianness = {
  LITTLE_ENDIAN: 1,
  BIG_ENDIAN: 2
};

/**
 * Read an unsigned byte from the I2C device
 */
var readU8 = function(device, i2cAddr, reg) {
  var result = 0;
  try {
    result = device.readByteSync(i2cAddr, reg);
  } catch (ex) {
    console.log(ex);
  }
  return result; // & 0xFF;
};

/**
 * Read a signed byte from the I2C device
 */
var readS8 = function(device, i2cAddr, reg) {
  var result = 0;
  try {
    result = device.readByteSync(i2cAddr, reg); // & 0x7F;
    if (result > 127) {
      result -= 256;
    }
  } catch (ex) {
    console.log(ex);
  }
  return result; // & 0xFF;
};

var readU16 = function(device, i2cAddr, register, endianness) {
  var hi = readU8(device, i2cAddr, register);
  var lo = readU8(device, i2cAddr, register + 1);
  return ((endianness === Endianness.BIG_ENDIAN) ? (hi << 8) + lo : (lo << 8) + hi); // & 0xFFFF;
};

var readS16 = function(device, i2cAddr, register, endianness) {
  var hi = 0, lo = 0;
  if (endianness === Endianness.BIG_ENDIAN) {
    hi = readS8(device, i2cAddr, register);
    lo = readU8(device, i2cAddr, register + 1);
  } else {
    lo = readU8(device, i2cAddr, register);
    hi = readS8(device, i2cAddr, register + 1);
  }
  return ((hi << 8) + lo); // & 0xFFFF;
};

var readU16LE = function(device, i2cAddr, register) {
  return readU16(device, i2cAddr, register, Endianness.LITTLE_ENDIAN);
};

var readU16BE = function(device, i2cAddr, register) {
  return readU16(device, i2cAddr, register, Endianness.BIG_ENDIAN);
};

var readS16LE = function(device, i2cAddr, register) {
  return readS16(device, i2cAddr, register, Endianness.LITTLE_ENDIAN);
};

var readS16BE = function(device, i2cAddr, register) {
  return readS16(device, i2cAddr, register, Endianness.BIG_ENDIAN);
};

// Made public.
exports.Endianness = Endianness;
exports.readU8     = readU8;
exports.readS8     = readS8;
exports.readU16    = readU16;
exports.readS16    = readS16;
exports.readU16LE  = readU16LE;
exports.readU16BE  = readU16BE;
exports.readS16LE  = readS16LE;
exports.readS16BE  = readS16BE;
