"use strict";

let utils = require('./utils/utils.js');

let value = 1023;
console.log(value + " = " + utils.hexFmt(value, 4) + ", " + utils.binFmt(value, 16));

let now = new Date();
console.log("Now, formatted: " + now.format("H:i:s"));
console.log("Now, formatted: " + now.format("l F dS, Y, H:i:s Z"));
console.log("Now, formatted: " + now.format("D M dS, Y, H:i:s Z"));

// Test IP address
console.log("IP Test:");
utils.getIPs(function (err, ip) {
  if (ip !== undefined && ip !== null) {
    for (let add in ip) {
      console.log("Addr:" + ip[add]);
    }
  } else {
    console.log("Found no IP ", err);
  }
}, false);