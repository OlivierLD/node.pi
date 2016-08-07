"use strict";

var utils = require('./utils/utils.js');

var value = 1023;
console.log(value + " = " + utils.hexFmt(value, 4) + ", " + utils.binFmt(value, 16));

var now = new Date();
console.log("Now, formatted: " + now.format("H:i:s"));
console.log("Now, formatted: " + now.format("l F dS, Y, H:i:s Z"));
