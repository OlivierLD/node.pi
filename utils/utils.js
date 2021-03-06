"use strict";

// Formatting Utilities
function getMask(num) {
  let maskDim = 2;
  for (let i=2; i<16; i+=2) {
    maskDim = i;
    if (Math.abs(num) < (Math.pow(16, i) - 1)) {
//    console.log("i=" + i + ", " + Math.abs(num) + " < " + (Math.pow(16, i) - 1));
      break;
    }
  }
  return Math.pow(16, maskDim) - 1;
}

function toHexString(num, len) {
  let l = (len !== undefined ? len : 4);
  return "0x" + lpad((num & getMask(num)).toString(16).trim().toUpperCase(), l, '0');
}

function toBinString(num, len) {
  let l = (len !== undefined ? len : 16);
  return "0&" + lpad((num & getMask(num)).toString(2).trim().toUpperCase(), l, '0');
}

function lpad(str, len, pad) {
  let s = str;
  while (s.length < len) {
    s = (pad !== undefined ? pad : " ") + s;
  }
  return s;
}

/**
 * Careful with this one, it could be demanding...
 * @Deprecated use waitfor instead
 */
function sleep(milliseconds) {
  let start = new Date().getTime();
  while (true) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

/**
 *
 * @param howMuch in millisec
 */
function waitfor(howMuch) {
  setTimeout(function() {}, howMuch);
  return;
}

// Date formatting
// Provide month names
Date.prototype.getMonthName = function() {
  const monthNames = [
    'January', 'February', 'March',     'April',   'May',      'June',
    'July',    'August',   'September', 'October', 'November', 'December' ];
  return monthNames[this.getMonth()];
};

// Provide month abbreviation
Date.prototype.getMonthAbbr = function() {
  const monthAbbrs = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
  return monthAbbrs[this.getMonth()];
};

// Provide full day of week name
Date.prototype.getDayFull = function() {
  const daysFull = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
  return daysFull[this.getDay()];
};

// Provide full day of week name
Date.prototype.getDayAbbr = function() {
  const daysAbbr = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat' ];
  return daysAbbr[this.getDay()];
};

// Provide the day of year 1-365
Date.prototype.getDayOfYear = function() {
  let jan1st = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((this - jan1st) / 86400000);
};

// Provide the day suffix (st, nd, rd, th). Note: 1st, 11th, 21st, 31st
Date.prototype.getDaySuffix = function() {
  const sfx = ["th", "st", "nd", "rd"];
  let d = this.getDate();
  let val = d % 100;
  return sfx[(val-20) % 10] || sfx[val] || sfx[0];
};

// Provide Week of Year
Date.prototype.getWeekOfYear = function() {
  let jan1st = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - jan1st) / 86400000) + jan1st.getDay() + 1) / 7);
};

// Provide if it is a leap year or not
Date.prototype.isLeapYear = function() {
  let yr = this.getFullYear();
  if ((parseInt(yr) % 4) === 0) {
    if (parseInt(yr) % 100 === 0) {
      if (parseInt(yr) % 400 !== 0) {
        return false;
      }
      if (parseInt(yr) % 400 === 0) {
        return true;
      }
    }
    if (parseInt(yr) % 100 !== 0) {
      return true;
    }
  }
  if ((parseInt(yr) % 4) !== 0) {
    return false;
  }
};

// Provide Number of Days in a given month
Date.prototype.getMonthDayCount = function() {
  const monthDayCounts = [
    31, this.isLeapYear() ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31 ];
  return monthDayCounts[this.getMonth()];
};

// format provided date into this.format format
Date.prototype.format = function(dateFormat) {
  // break apart format string into array of characters
  dateFormat = dateFormat.split("");

  let date = this.getDate(),
      month = this.getMonth(),
      hours = this.getHours(),
      minutes = this.getMinutes(),
      seconds = this.getSeconds(),
      milli = this.getTime() % 1000,
      tzOffset = -(this.getTimezoneOffset() / 60);

  // get all date properties ( based on PHP date object functionality )
  const dateProps =  {
    d: date < 10 ? '0' + date : date,
    D: this.getDayAbbr(),
    j: this.getDate(),
    l: this.getDayFull(),
    S: this.getDaySuffix(),
    w: this.getDay(),
    z: this.getDayOfYear(),
    W: this.getWeekOfYear(),
    F: this.getMonthName(),
    m: month < 10 ? '0' + (month + 1) : month + 1,
    M: this.getMonthAbbr(),
    n: month + 1,
    t: this.getMonthDayCount(),
    L: this.isLeapYear() ? '1' : '0',
    Y: this.getFullYear(),
    y: this.getFullYear() + ''.substring(2, 4),
    a: hours > 12 ? 'pm' : 'am',
    A: hours > 12 ? 'PM' : 'AM',
    g: hours % 12 > 0 ? hours % 12 : 12,
    G: hours > 0 ? hours : "12",
    h: hours % 12 > 0 ? hours % 12 : 12,
    H: hours < 10 ? '0' + hours : hours,
    i: minutes < 10 ? '0' + minutes : minutes,
    s: seconds < 10 ? '0' + seconds : seconds,
    Z: "UTC" + (tzOffset > 0 ? "+" : "") + tzOffset,
    _: lpad(milli, 3, '0')  };

  // loop through format array of characters and add matching data else add the format character (:,/, etc.)
  let dateString = "";
  for (let i=0; i<dateFormat.length; i++) {
    let f = dateFormat[i];
    if (f.match(/[a-zA-Z|_]/g)) {
      dateString += dateProps[f] ? dateProps[f] : '';
    } else  {
      dateString += f;
    }
  }
  return dateString;
};

let getNetworkIPs = (function () {
  let ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

  let exec = require('child_process').exec;
  let cached;
  let command;
  let filterRE;

  switch (process.platform) {
    case 'win32':
      //case 'win64': // TODO: test
      command = 'ipconfig';
      filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
      break;
    case 'darwin':
      command = 'ifconfig';
      filterRE = /\binet\s+([^\s]+)/g;
      // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
      break;
    default:
      command = 'ifconfig';
      filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
      // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
      break;
  }

  return function (callback, bypassCache) {
    if (cached && !bypassCache) {
      callback(null, cached);
      return;
    }
    // system call
    exec(command, function (error, stdout, sterr) {
      cached = [];
      let ip;
      let matches = stdout.match(filterRE) || [];
      //if (!error) {
      for (let i = 0; i < matches.length; i++) {
        ip = matches[i].replace(filterRE, '$1')
        if (!ignoreRE.test(ip)) {
          cached.push(ip);
        }
      }
      //}
      callback(error, cached);
    });
  };
})();

// Exports. Publicly exposed
//     external = internal
// -------------=------------
exports.version = '0.0.1';
exports.hexFmt  = toHexString;
exports.binFmt  = toBinString;
exports.getIPs  = getNetworkIPs;
exports.sleep   = sleep;
