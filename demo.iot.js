"use strict";
/**
 * node-rest-client doc is at https://www.npmjs.com/package/node-rest-client
 *
 * You need an Adafruit-IO account (free).
 * You can interact with the IoT server directly at https://io.adafruit.com/olivierld
 *
 * This code will push some data sensor, and read some feed(s).
 * Also see the WebUI at demos/iot.one.html (can run in standalone, just load it in a browser).
 *
 * Feeds keys we need here are:
 * - onoff
 * - humidity
 * - atm-press
 * - air-temperature
 */
let verbose = false;

// Need the Adafruit-IO key as parameter
let key;
if (process.argv.length > 2) {
  key = process.argv[2];
}
if (key === undefined) {
  console.log("Usage: node " + __filename + " [Your-Adafruit-IO-Key]");
  process.exit();
}

const ONOFF_FEED    = "onoff";
const AIRTEMP_FEED  = "air-temperature";
const PRESSURE_FEED = "atm-press";
const HUMIDITY_FEED = "humidity";
const PREFIX = 'https://io.adafruit.com/api/feeds/';

let Client = require('node-rest-client').Client;

let client = new Client();

// Get data, through a callback
function getSwitchState(cb) {
  if (verbose) {
    console.log("Getting switch state");
  }
  let url = PREFIX + ONOFF_FEED;
  let args = {
    headers: {"X-AIO-Key": key}
  };
  client.get(url, args, function (data, response) {
    if (verbose) {
      console.log("Switch is " + data.last_value);
    }
    cb(data.last_value);
  });
}

function setFeedValue(feedName, valueObject) {
  let args = {
    data: valueObject,
    headers: { "Content-Type": "application/json",
               "X-AIO-Key": key }
  };
  let url = PREFIX + feedName + "/data";
  client.post(url, args, function (data, response) {
    if (verbose) { console.log("From " + feedName + " " + response.headers.status); }
  });
}

function setSwitchState(state) {
  let data = { "value": state };
  setFeedValue(ONOFF_FEED, data);
}

function setAirTemp(tmp) {
  let data = { "value": tmp };
  setFeedValue(AIRTEMP_FEED, data);
}

function setAirPress(prs) {
  let data = { "value": prs };
  setFeedValue(PRESSURE_FEED, data);
}

function setHumidity(hum) {
  let data = { "value": hum };
  setFeedValue(HUMIDITY_FEED, data);
}

let previousState;
function manageState(state) {
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
}

let interv = setInterval(function() {
  if (verbose) { console.log(">>> Reading switch state..."); }
  getSwitchState(manageState);
}, 1000);

let BME280 = require('./bme280.js').BME280;
let Switch = require('./switch.js').Switch;

let relay = new Switch(7); // GPIO_07, pin #26, Wiring/PI4J 11
relay.off(); // Off by default

let bme280 = new BME280();

console.log("Init...");
bme280.init();

let iv = setInterval(function () {
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
}

process.on('SIGINT', exit); // Ctrl C
