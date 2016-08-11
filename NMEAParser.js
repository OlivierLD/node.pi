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
  var latDeg = data[3].substring(0, 2);
  var latMin = data[3].substring(2);
  var lat = sexToDec(parseInt(latDeg), parseFloat(latMin));
  if (data[4] === 'S') {
    lat = -lat;
  }

  var lonDeg = data[5].substring(0, 3);
  var lonMin = data[5].substring(3);
  var lon = sexToDec(parseInt(lonDeg), parseFloat(lonMin));
  if (data[6] === 'W') {
    lon = -lon;
  }

  var hours   = parseInt(data[1].substring(0, 2));
  var minutes = parseInt(data[1].substring(2, 4));
  var seconds = parseInt(data[1].substring(4, 6));

  var day     = parseInt(data[9].substring(0, 2));
  var month   = parseInt(data[9].substring(2, 4)) - 1;
  var year    = parseInt(data[9].substring(4, 6)) + 2000;
  var d = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));

  var sog = parseFloat(data[7]);
  var cog = parseFloat(data[8]);
  var W = parseFloat(data[10]);
  if (data[11] === 'W') {
    W = -W;
  }
  return { type: "RMC", epoch: d.getTime(), sog: sog, cog: cog, variation: W, pos: {lat: lat, lon: lon} };
};

var sexToDec = function(deg, min) {
  return deg + ((min * 10 / 6) / 100);
}

/**
 * Converts decimal degrees inot Deg Min.dd
 * @param val value in decimal degrees
 * @param ns_ew 'NS' or 'EW'
 * @returns {string}
 */
var decToSex = function(val, ns_ew) {
  var absVal = Math.abs(val);
  var intValue = Math.floor(absVal);
  var dec = absVal - intValue;
  var i = intValue;
  dec *= 60;
  var s = i + "°" + dec.toFixed(2) + "'";

  if (val < 0) {
    s += (ns_ew === 'NS' ? 'S' : 'W');
  } else {
    s += (ns_ew === 'NS' ? 'N' : 'E');
  }
  return s;
}

// Tests
var tests = function() {
  var val = sexToDec(333, 22.07);
  console.log(val);
  var ret = decToSex(val, 'EW');
  console.log(ret);

  var rmc = "$IIRMC,225158,A,3730.075,N,12228.854,W,,,021014,15,E,A*3C";
  console.log(rmc);
  console.log(validate(rmc));
  var parsed = parseRMC(rmc);
  console.log(parsed);
  console.log("Pos: " + decToSex(parsed.pos.lat, 'NS') + " " + decToSex(parsed.pos.lon, 'NS'));
  var date = new Date(parsed.epoch);
  console.log(date);
};

// Made public.
exports.validate = validate;
exports.toDegMin = decToSex;
exports.parseRMC = parseRMC;

