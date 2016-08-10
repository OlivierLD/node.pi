"use strict";

var checksum = function(str) {
  var cs = 0;
  for (var i=0; i<str.length; i++) {
    var c = str.charCodeAt(i);
    cs ^= c;
  }
  var ccs = cs.toString(16).toUpperCase();
  while (ccs.length < 2) {
    ccs = '0' + ccs;
  }
  return ccs;
};

var validate = function(str) {
  if (str.charAt(0) !== '$') {
    throw({ desc: 'Does not start with $' });
  }
  if (str.charAt(6) !== ',') {
    throw({ desc: 'Invalid key length' });
  }
  var starIdx = str.indexOf('*');
  if (starIdx === -1) {
    throw({ desc: 'Missing checksum' });
  }
  var checksumStr = str.substring(starIdx + 1);
  var nmea = str.substring(1, starIdx);
  var cs = checksum(nmea);
  if (checksumStr !== cs) {
    throw({ desc: 'Invalid checksum' });
  }
  var talker = str.substring(1, 3);
  var sentenceId = str.substring(3, 6);
  return { talker: talker, id: sentenceId };
};

var getChunks = function(str) {
  var starIdx = str.indexOf('*');
  if (starIdx === -1) {
    throw({ desc: 'Missing checksum' });
  }
  var checksumStr = str.substring(starIdx + 1);
  var nmea = str.substring(1, starIdx);
  var chunks = nmea.split(",");
  return chunks;
};

var parseRMC = function(str) {
    /* Structure is
     *         1      2 3        4 5         6 7     8     9      10    11
     *  $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
     *         |      | |        | |         | |     |     |      |     |
     *         |      | |        | |         | |     |     |      |     Variation sign
     *         |      | |        | |         | |     |     |      Variation value
     *         |      | |        | |         | |     |     Date DDMMYY
     *         |      | |        | |         | |     COG
     *         |      | |        | |         | SOG
     *         |      | |        | |         Longitude Sign
     *         |      | |        | Longitude Value
     *         |      | |        Latitude Sign
     *         |      | Latitude value
     *         |      Active or Void
     *         UTC
     */
  var data = getChunks(str);

  if (data[2] === 'V') {
    return;
  }
  var latStr = data[3];
  var latDeg = data[3].substring(0, 2);
  var latMin = data[3].substring(2);
  var lat = sexToDec(parseInt(latDeg), parseFloat(latMin));
  if (data[4] === 'S') {
    lat = -lat;
  }

  var lonStr = data[5];
  var lonDeg = data[5].substring(0, 3);
  var lonMin = data[5].substring(3);
  var lon = sexToDec(parseInt(lonDeg), parseFloat(lonMin));
  if (data[6] === 'W') {
    lon = -lon;
  }

  return { lat: lat, lon: lon };
};

var sexToDec = function(deg, min) {
  return deg + ((min * 60 / 100) / 100);
}
// Made public.
exports.validate = validate;
exports.parseRMC = parseRMC;
