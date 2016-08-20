'use strict';

var BME280 = require('../../../bme280.js').BME280;

var bme280 = new BME280();

console.log("Init...")
bme280.init();

var temperature = 0;
var pressure    = 0;
var humidity    = 0;
var altitude    = 0;

var iv = setInterval(function () {
  bme280.readAllData(function(data) {
    temperature = data.temperature;
    pressure = data.pressure;
    humidity = data.humidity;
    altitude = data.altitude;
  });
}, 1000);


exports.getSensors = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
//examples['application/json'] = "";
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end(JSON.stringify(["MCP3008", "BME280", "GPS"], null, 2));
//  res.end();
  }
  
}

exports.readADC = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
//examples['application/json'] = { };
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    var data = 786;
    res.end(data.toString());
  }
}

exports.readBme280 = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
//   examples['application/json'] = {
//   "altitude" : 1.3579000000000001069366817318950779736042022705078125,
//   "temperature" : 1.3579000000000001069366817318950779736042022705078125,
//   "humidity" : 1.3579000000000001069366817318950779736042022705078125,
//   "pressure" : 1.3579000000000001069366817318950779736042022705078125
// };
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    var data = {
      "temperature": temperature.toFixed(2),
      "pressure": (pressure / 100).toFixed(2),
      "humidity": humidity.toFixed(2),
      "altitude": altitude.toFixed(2)
    };
    res.end(JSON.stringify(data, null, 2));
  }
  
}

exports.readGPS = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
//   examples['application/json'] = {
//   "heading" : "",
//   "latitude" : 1.3579000000000001069366817318950779736042022705078125,
//   "speed" : 1.3579000000000001069366817318950779736042022705078125,
//   "longitude" : 1.3579000000000001069366817318950779736042022705078125
// };
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    var data = {
      "latitude": 37.75,
      "longitude": -122.34,
      "speed": 0,
      "heading": 15
    };
    res.end(JSON.stringify(data, null, 2));
  }
  
}

// cleanup on exit
var exit = function() {
  console.log("Bye!");
  bme280.shutdown();
  process.exit();
}
process.on('SIGINT', exit); // Ctrl C

