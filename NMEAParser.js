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
  var checksumStr = str.substring(starIdx + 1); // TODO Validate checksum ?
  var nmea = str.substring(1, starIdx);
  var chunks = nmea.split(",");
  return chunks;
};

var parseRMC = function(str) {
    /* Structure is
     *         1      2 3        4 5         6 7     8     9      10    11      <- Indexes in getChunks.
     *  $ddRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
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

var parseDBT = function(str) {
  /* Structure is
   *         1     2 3    4 5    6
   *  $aaDBT,011.0,f,03.3,M,01.8,F*18
   *         |     | |    | |    |
   *         |     | |    | |    F for fathoms
   *         |     | |    | Depth in fathoms
   *         |     | |    M for meters
   *         |     | Depth in meters
   *         |     f for feet
   *         Depth in feet
   */
  var data = getChunks(str);
  
  return { type: "DBT", feet: parseFloat(data[1]), meters: parseFloat(data[3]), fathoms: parseFloat(data[5]) };
};

var parseGLL = function(str) {
  /* Structure isgit
   *         1       2 3       4 5         6
   *  $aaGLL,llll.ll,a,gggg.gg,a,hhmmss.ss,A*hh
   *         |       | |       | |         |
   *         |       | |       | |         A:data valid
   *         |       | |       | UTC of position
   *         |       | |       Long sign :E/W
   *         |       | Longitude
   *         |       Lat sign :N/S
   *         Latitude
   */
  throw ({ exception: "Not implemented" });
};

var parseGGA = function(str) {
  /* Structure is
   *  $GPGGA,014457,3739.853,N,12222.821,W,1,03,5.4,1.1,M,-28.2,M,,*7E
   *         1         2       3 4       5 6 7  8   9   10    12    14
   *                                                      11    13
   *  $aaGGA,hhmmss.ss,llll.ll,a,gggg.gg,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*CS
   *         |         |         |         | |  |   |   | |   | |   |
   *         |         |         |         | |  |   |   | |   | |   Differential reference station ID
   *         |         |         |         | |  |   |   | |   | Age of differential GPS data (seconds)
   *         |         |         |         | |  |   |   | |   Unit of geodial separation, meters
   *         |         |         |         | |  |   |   | Geodial separation
   *         |         |         |         | |  |   |   Unit of antenna altitude, meters
   *         |         |         |         | |  |   Antenna altitude above sea level
   *         |         |         |         | |  Horizontal dilution of precision
   *         |         |         |         | number of satellites in use 00-12 (in use, not in view!)
   *         |         |         |         GPS quality indicator (0:invalid, 1:GPS fix, 2:DGPS fix)
   *         |         |         Longitude
   *         |         Latitude
   *         UTC of position
   */
  throw ({ exception: "Not implemented" });
};

var parseGSA = function(str) {
  /*
   *        1 2
   * $GPGSA,A,3,19,28,14,18,27,22,31,39,,,,,1.7,1.0,1.3*35
   *        | | |                           |   |   |
   *        | | |                           |   |   VDOP
   *        | | |                           |   HDOP
   *        | | |                           PDOP (dilution of precision). No unit; the smaller the better.
   *        | | IDs of the SVs used in fix (up to 12)
   *        | Mode: 1=Fix not available, 2=2D, 3=3D
   *        Mode: M=Manual, forced to operate in 2D or 3D
   *              A=Automatic, 3D/2D
   */
  throw ({ exception: "Not implemented" });
};

var parseGSV = function(str) {
  /* Structure is
   * $GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74
   *        | | |  |  |  |   |  |            |            |
   *        | | |  |  |  |   |  |            |            Fourth SV...
   *        | | |  |  |  |   |  |            Third SV...
   *        | | |  |  |  |   |  Second SV...
   *        | | |  |  |  |   SNR (0-99 db)
   *        | | |  |  |  Azimuth in degrees (0-359)
   *        | | |  |  Elevation in degrees (0-90)
   *        | | |  First SV PRN Number
   *        | | Total number of SVs in view
   *        | Message Number
   *        Number of messages in this cycle
   */
  throw ({ exception: "Not implemented" });
};

var parseHDG = function(str) {
  /* Structure is
   *        1   2   3 4   5
   * $xxHDG,x.x,x.x,a,x.x,a*CS
   *        |   |   | |   | |
   *        |   |   | |   | Checksum
   *        |   |   | |   Magnetic Variation direction, E = Easterly, W = Westerly
   *        |   |   | Magnetic Variation degrees
   *        |   |   Magnetic Deviation direction, E = Easterly, W = Westerly
   *        |   Magnetic Deviation, degrees
   *        Magnetic Sensor heading in degrees
   */
  throw ({ exception: "Not implemented" });
};

var parseHDM = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseMDA = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseMMB = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseMTA = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseMTW = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseMWV = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseRMB = function(str) {
  /*        1 2   3 4    5    6       7 8        9 10  11  12  13
   * $GPRMB,A,x.x,a,c--c,d--d,llll.ll,e,yyyyy.yy,f,g.g,h.h,i.i,j*kk
   *        | |   | |    |    |       | |        | |   |   |   |
   *        | |   | |    |    |       | |        | |   |   |   A=Entered or perpendicular passed, V:not there yet
   *        | |   | |    |    |       | |        | |   |   Destination closing velocity in knots
   *        | |   | |    |    |       | |        | |   Bearing to destination, degrees, True
   *        | |   | |    |    |       | |        | Range to destination, nm
   *        | |   | |    |    |       | |        E or W
   *        | |   | |    |    |       | Destination Waypoint longitude
   *        | |   | |    |    |       N or S
   *        | |   | |    |    Destination Waypoint latitude
   *        | |   | |    Destination Waypoint ID
   *        | |   | Origin Waypoint ID
   *        | |   Direction to steer (L or R) to correct error
   *        | Crosstrack error in nm
   *        Data Status (Active or Void)
   */
  throw ({ exception: "Not implemented" });
};

var parseVDR = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseVWH = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseVLW = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseVTG = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseVWR = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseVWT = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseXDR = function(str) {
  throw ({ exception: "Not implemented" });
};

var parseZDA = function(str) {
  throw ({ exception: "Not implemented" });
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
exports.parseDBT = parseDBT;
exports.parseGLL = parseGLL;
exports.parseGGA = parseGGA;
exports.parseGSA = parseGSA;
exports.parseGSV = parseGSV;
exports.parseHDG = parseHDG;
exports.parseHDM = parseHDM;
exports.parseMDA = parseMDA;
exports.parseMMB = parseMMB;
exports.parseMTA = parseMTA;
exports.parseMTW = parseMTW;
exports.parseMWV = parseMWV;
exports.parseRMB = parseRMB;
exports.parseVDR = parseVDR;
exports.parseVWH = parseVWH;
exports.parseVLW = parseVLW;
exports.parseVTG = parseVTG;
exports.parseVWR = parseVWR;
exports.parseVWT = parseVWT;
exports.parseXDR = parseXDR;
exports.parseZDA = parseZDA;
