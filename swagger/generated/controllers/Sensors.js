'use strict';

var url = require('url');


var Sensors = require('./SensorsService');


module.exports.getSensors = function getSensors (req, res, next) {
  Sensors.getSensors(req.swagger.params, res, next);
};

module.exports.readADC = function readADC (req, res, next) {
  Sensors.readADC(req.swagger.params, res, next);
};

module.exports.readBme280 = function readBme280 (req, res, next) {
  Sensors.readBme280(req.swagger.params, res, next);
};

module.exports.readGPS = function readGPS (req, res, next) {
  Sensors.readGPS(req.swagger.params, res, next);
};
