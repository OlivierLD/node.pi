"use strict";

var getMask = function(num) {
  var maskDim = 2;
  for (var i=2; i<16; i+=2) {
    maskDim = i;
    if (Math.abs(num) < (Math.pow(16, i) - 1)) {
//    console.log("i=" + i + ", " + Math.abs(num) + " < " + (Math.pow(16, i) - 1));
      break;
    }
  }
  return Math.pow(16, maskDim) - 1;
};

var toHexString = function(num, len) {
  var l = (len !== undefined ? len : 4);
  return "0x" + lpad((num & getMask(num)).toString(16).trim().toUpperCase(), l, '0');
};

var toBinString = function(num, len) {
  var l = (len !== undefined ? len : 16);
  return "0&" + lpad((num & getMask(num)).toString(2).trim().toUpperCase(), l, '0');
};

var lpad = function(str, len, pad) {
  var s = str;
  while (s.length < len) {
    s = (pad !== undefined ? pad : " ") + s;
  }
  return s;
};

exports.version = '0.0.1';     // Static member, made public
exports.hexFmt  = toHexString; // Made public.
exports.binFmt  = toBinString; // Made public.
