"use strict";

/**
 * node-rest-client doc is at https://www.npmjs.com/package/node-rest-client
 *
 * You need an Adafruit-IO account (free).
 * You can interact with the IoT server directly at https://io.adafruit.com/olivierld
 *
 * This code will push some data sensor, and read some feed(s).
 * Also see the WebUI at demos/iot.one.html (can run in standalone).
 * From the WebUI you can change the state of the switch.
 *
 * Feeds keys we need here are:
 * - onoff
 */

// Need the Adafruit-IO key as parameter
var key;
if (process.argv.length > 2) {
  key = process.argv[2];
}
if (key === undefined) {
  console.log("Usage: node " + __filename + " [Your-Adafruit-IO-Key]");
  process.exit();
}

var ONOFF_FEED = "onoff";
var PREFIX = 'https://io.adafruit.com/api/feeds/';

var Client = require('node-rest-client').Client;

var client = new Client();

// Get data, through a callback
var getSwitchState = function(cb) {
    var url = PREFIX + ONOFF_FEED;
    var args = {
        headers: {"X-AIO-Key": key}
    };
    client.get(url, args, function (data, response) {
        // parsed response body as js object
    //  console.log("Last Value of [%s] (%s) was %s.", data.name, data.description, data.last_value);
        // raw response
    //  console.log(response);
        cb(data.last_value);
    });
};

var setSwitchState = function(state) {
    var args = {
        data: { "value": state },
        headers: { "Content-Type": "application/json",
                   "X-AIO-Key": key }
    };
    var url = PREFIX + ONOFF_FEED + "/data";
    client.post(url, args, function (data, response) {
        // parsed response body as js object
    //  console.log(data);
        // raw response
        console.log(response.headers.status);
    });
};

var previousState;
var manageState = function(state) {
  if (state !== previousState) {
      console.log("State is now:" + state);
      // Do something with the hardware here
      previousState = state;
  }
};

var interv = setInterval(function() {
  getSwitchState(manageState);
}, 1000);

setTimeout(function() {
  // Read sensor, push data
  setSwitchState('ON');
}, 5000);

function exit() {
    console.log("\nBye now!");
    process.exit();
};

process.on('SIGINT', exit); // Ctrl C
