"use strict";

/**
 * node-rest-client doc is at https://www.npmjs.com/package/node-rest-client
 *
 * You need an Adafruit-IO account (free).
 * You can interact with the IoT server directly at https://io.adafruit.com/olivierld
 *
 * This code will push some data sensor, and read some feed(s).
 * Also see the WebUI at demos/iot.one.html (can run in standalone).
 *
 * Feeds keys we need here are:
 * - onoff
 * - humidity
 * - atm-press
 * - air-temperature
 */
var verbose = false;

// Need the Adafruit-IO key as parameter
var key;
if (process.argv.length > 2) {
  key = process.argv[2];
}
if (key === undefined) {
  console.log("Usage: node " + __filename + " [Your-Adafruit-IO-Key]");
  process.exit();
}

var ONOFF_FEED    = "onoff";
var AIRTEMP_FEED  = "air-temperature";
var PRESSURE_FEED = "atm-press";
var HUMIDITY_FEED = "humidity";
var PREFIX = 'https://io.adafruit.com/api/feeds/';

var Client = require('node-rest-client').Client;

var client = new Client();

// Get data, through a callback
var getSwitchState = function(cb) {
    if (verbose) {
      console.log("Getting switch state");
    }
    var url = PREFIX + ONOFF_FEED;
    var args = {
        headers: {"X-AIO-Key": key}
    };
    client.get(url, args, function (data, response) {
        // parsed response body as js object
    //  console.log("Last Value of [%s] (%s) was %s.", data.name, data.description, data.last_value);
        // raw response
    //  console.log(response);
        if (verbose) {
          console.log("Switch is " + data.last_value);
        }
        cb(data.last_value);
    });
};

var setFeedValue = function(feedName, valueObject) {
    var args = {
        data: valueObject,
        headers: { "Content-Type": "application/json",
                   "X-AIO-Key": key }
    };
    var url = PREFIX + feedName + "/data";
    client.post(url, args, function (data, response) {
      if (verbose) { console.log("From " + feedName + " " + response.headers.status); }
    });
};

var setSwitchState = function(state) {
  var data = { "value": state };
  setFeedValue(ONOFF_FEED, data);
};

var setAirTemp = function(tmp) {
  var data = { "value": tmp };
  setFeedValue(AIRTEMP_FEED, data);
};

var setAirPress = function(prs) {
  var data = { "value": prs };
  setFeedValue(PRESSURE_FEED, data);
};

var setHumidity = function(hum) {
  var data = { "value": hum };
  setFeedValue(HUMIDITY_FEED, data);
};

var previousState;
var manageState = function(state) {
  if (verbose) {
     console.log("Managing state:" + state);
  }
  if (state !== previousState) {
      console.log("State is now:" + state);
      // Do something with the hardware here
      if (state === 'ON') {
        relay.on();
      } else {
        relay.off();
      }
      previousState = state;
  }
};

var interv = setInterval(function() {
  if (verbose) { console.log(">>> Reading switch state..."); }
  getSwitchState(manageState);
}, 1000);

var BME280 = require('./bme280.js').BME280;
var Switch = require('./switch.js').Switch;

var relay = new Switch(7); // GPIO_07, pin #26, Wiring/PI4J 11
relay.off(); // Off by default

var bme280 = new BME280();

console.log("Init...")
bme280.init();

var iv = setInterval(function () {
  bme280.readTemperature(function(temp) {
    if (verbose) {
      console.log("Temperature : " + temp.toFixed(2) + "°C");
      console.log("Humidity    : " + bme280.readHumidity().toFixed(2) + " %");
      console.log("Pressure    : " + (bme280.readPressure() / 100).toFixed(2) + " hPa");
      console.log("--------------------------------");
    }
    setAirTemp(temp.toFixed(2));
    setHumidity(bme280.readHumidity().toFixed(2));
    setAirPress((bme280.readPressure() / 100).toFixed(2));
  });
}, 5000);

function exit() {
    console.log("\nBye now!");
    relay.shutdown();
    process.exit();
};

process.on('SIGINT', exit); // Ctrl C

