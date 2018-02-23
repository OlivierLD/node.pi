"use strict";

/**
 * node-rest-client doc is at https://www.npmjs.com/package/node-rest-client
 *
 * You need an Adafruit-IO account (free).
 * You can interact with the IoT server directly at https://io.adafruit.com/olivierld
 *
 * This code will push some data sensor, and read some feed(s).
 * Also see the WebUI at demos/iot.one.html (can run in standalone, just load it in a browser).
 * From the WebUI you can change the state of the switch.
 *
 * Feeds keys we need here are:
 * - onoff
 */

// Need the Adafruit-IO key as parameter
let key;
if (process.argv.length > 2) {
  key = process.argv[2];
}
if (key === undefined) {
  console.log("Usage: node " + __filename + " [Your-Adafruit-IO-Key]");
  process.exit();
}

const ONOFF_FEED = "onoff";
const PREFIX = 'https://io.adafruit.com/api/feeds/';

let Client = require('node-rest-client').Client;

let client = new Client();

// Get data, through a callback
function getSwitchState(cb) {
    let url = PREFIX + ONOFF_FEED;
    let args = {
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

function setSwitchState(state) {
    let args = {
        data: { "value": state },
        headers: { "Content-Type": "application/json",
                   "X-AIO-Key": key }
    };
    let url = PREFIX + ONOFF_FEED + "/data";
    client.post(url, args, function (data, response) {
        // parsed response body as js object
    //  console.log(data);
        // raw response
        console.log(response.headers.status);
    });
};

let previousState;
function manageState(state) {
  if (state !== previousState) {
      console.log("State is now:" + state);
      // Do something with the hardware here
      previousState = state;
  }
};

let interv = setInterval(function() {
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
