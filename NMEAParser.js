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
  try {
    var valid = validate(str);
  } catch (err) {
    throw { validating: str,
      error: err };
  }
  var nmea = str.substring(1, starIdx);
  var chunks = nmea.split(",");
  return chunks;
};

var getSentenceID = function(str) {
  if (str.charAt(0) !== '$') {
    throw({ desc: 'Does not start with $' });
  }
  if (str.charAt(6) !== ',') {
    throw({ desc: 'Invalid key length' });
  }
  return str.substring(3, 6);
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
  return { type: "DBT",
    feet: parseFloat(data[1]),
    meters: parseFloat(data[3]),
    fathoms: parseFloat(data[5]) };
};

var parseGLL = function(str) {
  /* Structure is
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
  var data = getChunks(str);
  if ("A" !== data[6]) {
    throw { err: "No data available" };
  }
  var latDeg = data[1].substring(0, 2);
  var latMin = data[1].substring(2);
  var lat = sexToDec(parseInt(latDeg), parseFloat(latMin));
  if (data[2] === 'S') {
    lat = -lat;
  }

  var lonDeg = data[3].substring(0, 3);
  var lonMin = data[3].substring(3);
  var lon = sexToDec(parseInt(lonDeg), parseFloat(lonMin));
  if (data[4] === 'W') {
    lon = -lon;
  }

  var hours   = parseInt(data[5].substring(0, 2));
  var minutes = parseInt(data[5].substring(2, 4));
  var seconds = parseInt(data[5].substring(4, 6));
  var now = new Date();
  var d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, 0));

  return { type: "GLL",
    latitude: lat,
    longitude: lon,
    epoch: d.getTime() };
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
  throw { exception: "parseGGA Not implemented" };
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
  throw ({ exception: "parseGSA Not implemented" });
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
  throw ({ exception: "parseGSV Not implemented" });
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
  var data = getChunks(str);
  return { hdg: parseFloat(data[1]),
    dev: ((data[3] === 'W' ? -1 : 1) * parseFloat(data[2])),
    dec: ((data[5] === 'W' ? -1 : 1) * parseFloat(data[4])) };
};

var parseHDM = function(str) {
  throw ({ exception: "parseHDM Not implemented" });
};

var parseMDA = function(str) {
  /*                                             13    15    17    19
   *        1   2 3   4 5   6 7   8 9   10  11  12    14    16    18    20
   * $--MDA,x.x,I,x.x,B,x.x,C,x.x,C,x.x,x.x,x.x,C,x.x,T,x.x,M,x.x,N,x.x,M*hh
   *        |     |     |     |     |   |   |     |     |     |     Wind speed, m/s
   *        |     |     |     |     |   |   |     |     |     Wind speed, knots
   *        |     |     |     |     |   |   |     |     Wind dir Mag
   *        |     |     |     |     |   |   |     Wind dir, True
   *        |     |     |     |     |   |   Dew Point C
   *        |     |     |     |     |   Absolute hum %
   *        |     |     |     |     Relative hum %
   *        |     |     |     Water temp in Celcius
   *        |     |     Air Temp in Celcius  |
   *        |     Pressure in Bars
   *        Pressure in inches
   *
   * Example: $WIMDA,29.4473,I,0.9972,B,17.2,C,,,,,,,,,,,,,,*3E
   */
  var data = getChunks(str);
  return { type: "MDA",
    pressure: {
      inches: parseFloat(data[1]),
      bars: parseFloat(data[3])
    },
    temperature: {
      air: parseFloat(data[5]),
      water: parseFloat(data[7])
    },
    humidity: {
      relative: parseFloat(data[9]),
      absolute: parseFloat(data[10]),
      dewpoint: parseFloat(data[11])
    },
    wind: {
      dir: {
        true: parseFloat(data[13]),
        magnetic: parseFloat(data[15])
      },
      speed: {
        knots: parseFloat(data[17]),
        ms: parseFloat(data[19])
      }
    }
  };
};

var parseMMB = function(str) {
  /*
   * Structure is
   *        1       2 3      4
   * $IIMMB,29.9350,I,1.0136,B*7A
   *        |       | |      |
   *        |       | |      Bars
   *        |       | Pressure in Bars
   *        |       Inches of Hg
   *        Pressure in inches of Hg
   */
  var data = getChunks(str);
  return { type: "MMB", pressure: {
    inches: parseFloat(data[1]),
    bars: parseFloat(data[3])
  }};
};

var parseMTA = function(str) {
  /*
   * Structure is
   *        1   2
   * $RPMTA,9.9,C*37
   *        |   |
   *        |   Celcius
   *        Value
   */
  var data = getChunks(str);
  return { type: "MTA", temp: parseFloat(data[1]), unit: data[2] };
};

var parseMTW = function(str) {
  /*
   * Structure is
   *         1    2
   * $IIMTW,+18.0,C*31
   *         |    |
   *         |    Celcius
   *         Value
   */
  var data = getChunks(str);
  return { type: "MTW", temp: parseFloat(data[1]), unit: data[2] };
};

var parseMWV = function(str) {
  /*
   * Structure is:
   *         1    2 3    4 5
   *  $IIMWV,256, R,07.1,N,A*14
   *  $aaMWV,xx.x,a,x.x,a,A*hh
   *         |    | |   | |
   *         |    | |   | status : A=data valid
   *         |    | |   Wind Speed unit (K/M/N)
   *         |    | Wind Speed
   *         |    reference R=relative, T=true
   *         Wind angle 0 to 360 degrees
   */
  var data = getChunks(str);
  if (data[5] !== 'A') {
    throw { err: "No data available for MWV" }
  } else {
    return {
      type: "MWV",
      wind: {
        speed: parseFloat(data[3]),
        dir: parseFloat(data[1]),
        unit: data[4],
        reference: (data[2] === 'R' ? 'relative' : 'true')
      }
    };
  }
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
  throw ({ exception: "parseRMB Not implemented" });
};

var parseVDR = function(str) {
  throw ({ exception: "parseVDR Not implemented" });
};

var parseVHW = function(str) {
  /* Structure is
   *         1   2 3   4 5   6 7   8
   *  $aaVHW,x.x,T,x.x,M,x.x,N,x.x,K*hh
   *         |     |     |     |
   *         |     |     |     Speed in km/h
   *         |     |     Speed in knots
   *         |     Heading in degrees, Magnetic
   *         Heading in degrees, True
   */
  var data = getChunks(str);
  return { heading: {
    true: parseFloat(data[1]),
    magnetic: parseFloat(data[3])},
    speed: {
      knots: parseFloat(data[5]),
      kmh: parseFloat(data[7])
    }}
};

var parseVLW = function(str) {
  throw ({ exception: "parseVLW Not implemented" });
};

var parseVTG = function(str) {
  throw ({ exception: "parse VTG Not implemented" });
};

var parseVWR = function(str) {
  throw ({ exception: "parseVWR Not implemented" });
};

var parseVWT = function(str) {
  throw ({ exception: "parseVWR Not implemented" });
};

var parseXDR = function(str) {
  throw ({ exception: "parseXDR Not implemented" });
};

var parseZDA = function(str) {
  throw ({ exception: "parseZDA Not implemented" });
};

var sexToDec = function(deg, min) {
  return deg + ((min * 10 / 6) / 100);
};

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
};

var matcher = {};
matcher["RMC"] = parseRMC;
matcher["DBT"] = parseDBT;
matcher["GLL"] = parseGLL;

var dispatcher = function(str) {
  try {
    var id = getSentenceID(str);
    switch (id) {
      case "RMC":
        return matcher["RMC"];
      case "DBT":
        return parseDBT;
      case "GLL":
        return parseGLL;
      case "GGA":
        return parseGGA;
      case "GSA":
        return parseGSA;
      case "GSV":
        return parseGSV;
      case "HDG":
        return parseHDG;
      case "HDM":
        return parseHDM;
      case "MDA":
        return parseMDA;
      case "MMB":
        return parseMMB;
      case "MTA":
        return parseMTA;
      case "MTW":
        return parseMTW;
      case "MWV":
        return parseMWV;
      case "RMB":
        return parseRMB;
      case "VDR":
        return parseVDR;
      case "VHW":
        return parseVHW;
      case "VTG":
        return parseVTG;
      case "VWR":
        return parseVWR;
      case "VWT":
        return parseVWT;
      case "XDR":
        return parseXDR;
      case "ZDA":
        return parseZDA;
      case "VLW":
        return parseVLW;
      default:
        return undefined;
    }
  } catch (err) {
    throw err;
  }
};

var autoparse = function(str) {
  var parser = dispatcher(str);
  if (parser !== undefined) {
    return parser(str);
  } else {
    throw { err: "No parser found for sentence ID [" + getSentenceID(str) + "]" }
  }
};

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
exports.autoparse = autoparse;
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
exports.parseVHW = parseVHW;
exports.parseVLW = parseVLW;
exports.parseVTG = parseVTG;
exports.parseVWR = parseVWR;
exports.parseVWT = parseVWT;
exports.parseXDR = parseXDR;
exports.parseZDA = parseZDA;
