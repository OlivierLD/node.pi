"use strict";

var nmea = "$IIRMC,225158,A,3730.075,N,12228.854,W,,,021014,15,E,A*3C";

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

  var chunks = nmea.split(",");
  // TODO Keep going...
};


try {
  validate(nmea);
} catch (err) {
  console.log("Error:", err);
}

try {
  validate("$AKEUCOUCOU,ta mere");
} catch (err) {
  console.log("Error:", err);
}

try {
  validate("AKEUCOUCOU,ta mere");
} catch (err) {
  console.log("Error:", err);
}

// Made public.
exports.validate = validate;
