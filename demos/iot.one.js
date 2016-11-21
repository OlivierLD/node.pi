/**
 * Read feeds on the IoT server
 * Uses JQuery promises.
 */

var SWITCH = 1;
var HUM    = 2;
var PRESS  = 3;
var TEMP   = 4;

var qsK;
$(document).ready(function() {
  if (document.location.search !== undefined && document.location.search !== null) {
    var prms = document.location.search.substring(1);
    var pa = prms.split('&');
    for (var p in pa) {
      var nv = pa[p].split('=');
      if (nv[0] === 'key') {
        qsK = nv[1];
        break;
      }
    }
  }
  // Start each feed, one second apart.
  setTimeout(function() {
    setInterval(function() {
      go(SWITCH);
    }, 5000); // Refresh every 5 seconds.
  }, 1);

  setTimeout(function() {
    setInterval(function() {
      go(HUM);
    }, 5000); // Refresh every 5 seconds.
  }, 1000);

  setTimeout(function() {
    setInterval(function() {
      go(PRESS);
    }, 5000); // Refresh every 5 seconds.
  }, 2000);

  setTimeout(function() {
    setInterval(function() {
      go(TEMP);
    }, 5000); // Refresh every 5 seconds.
  }, 3000);
});

var SWITCH_FEED      = 'onoff';
var PRESSURE_FEED    = 'atm-press';
var TEMPERATURE_FEED = 'air-temperature';
var HUMIDITY_FEED    = 'humidity';

var getData = function(urlStr) {
  var deferred = $.Deferred(),  // a jQuery deferred
      url = urlStr;
      xhr = new XMLHttpRequest(),
      TIMEOUT = 10000;

  xhr.open('GET', url, true);
  var key = qsK !== undefined ? qsK : $("#a-key").val();
  xhr.setRequestHeader("X-AIO-Key", key);

  xhr.send();

  var requestTimer = setTimeout(function() {
    xhr.abort();
    deferred.reject();
  }, TIMEOUT);

  xhr.onload = function() {
    clearTimeout(requestTimer);
    if (xhr.status === 200) {
      deferred.resolve(xhr.response);
    } else {
      deferred.reject();
    }
  };
  return deferred.promise();
};

var setSwitch = function(onOff) {
  var deferred = $.Deferred(),  // a jQuery deferred
      url = 'https://io.adafruit.com/api/feeds/' + SWITCH_FEED + '/data',
      xhr = new XMLHttpRequest(),
      TIMEOUT = 10000;

  xhr.open('POST', url, true);
  var key = qsK !== undefined ? qsK : $("#a-key").val();
  xhr.setRequestHeader("X-AIO-Key", key);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.send(JSON.stringify({ "value": onOff }));

  var requestTimer = setTimeout(function() {
    xhr.abort();
    deferred.reject();
  }, TIMEOUT);

  xhr.onload = function() {
    clearTimeout(requestTimer);
    if (xhr.status === 201) {
//    console.log("Returned status ", xhr.status);
      deferred.resolve(xhr.response);
    } else {
//    console.log("Returned status ", xhr.status);
      deferred.reject();
    }
  };
  return deferred.promise();
};

var go = function(type) {
  var key = qsK !== undefined ? qsK : $("#a-key").val();

  if (key.trim().length > 0) {
    $("#mess").text('');
    $("#data").css('display', 'inline');

    setTimeout(function() {
      $('body').css('cursor', 'progress');
    }, 1);

    // Produce data, the promise
    if (type === SWITCH) {
      var fetchSwitch = getData('https://io.adafruit.com/api/feeds/' + SWITCH_FEED);
      fetchSwitch.done(function(value) {
    //  console.log("Switch :" + value); // Raw data
        // Display it...
        var status = JSON.parse(value).last_value;
        $("#last-value").text(new Date() + ':  ' + status);
        $("#switch-status").val(status).change(); // .change() mandatory to update the widget!
        setTimeout(function() {
          $('body').css('cursor', 'auto');
        }, 1);
      });
      fetchSwitch.fail(function(error) {
        $("#errors").text('Switch request failed (timeout?), try again later.\n' + (error !== undefined ? error : ''));
      });
    }

    if (type === HUM) {
      apb1.start();
      var fetchHumidity = getData('https://io.adafruit.com/api/feeds/' + HUMIDITY_FEED);
      fetchHumidity.done(function(value) {
    //  console.log("Done :" + value); // Raw data
        // Display it...
        var humidity = JSON.parse(value).last_value;
        setHumidity(parseFloat(humidity));
        apb1.stop();
        setTimeout(function() {
          $('body').css('cursor', 'auto');
        }, 1);
      });
      fetchHumidity.fail(function(error) {
        $("#errors").text('Humidity request failed (timeout?), try again later.\n' + (error !== undefined ? error : ''));
      });
    }

    if (type === PRESS) {
      apb2.start();
      var fetchPressure = getData('https://io.adafruit.com/api/feeds/' + PRESSURE_FEED);
      fetchPressure.done(function(value) {
    //  console.log("Done :" + value); // Raw data
        // Display it...
        var pressure = JSON.parse(value).last_value;
        setPressure(parseFloat(pressure));
        apb2.stop();
        setTimeout(function() {
          $('body').css('cursor', 'auto');
        }, 1);
      });
      fetchPressure.fail(function(error) {
        $("#errors").text('Pressure request failed (timeout?), try again later.\n' + (error !== undefined ? error : ''));
      });
    }

    if (type === TEMP) {
      apb3.start();
      var fetchTemperature = getData('https://io.adafruit.com/api/feeds/' + TEMPERATURE_FEED);
      fetchTemperature.done(function(value) {
    //  console.log("Done :" + value); // Raw data
        // Display it...
        var temperature = JSON.parse(value).last_value;
        setTemperature(parseFloat(temperature));
        apb3.stop();
        setTimeout(function() {
          $('body').css('cursor', 'auto');
        }, 1);
      });
      fetchTemperature.fail(function(error) {
        $("#errors").text('Temperature request failed (timeout?), try again later.\n' + (error !== undefined ? error : ''));
      });
    }
  } else {
    $("#mess").text('Please enter your Adafruit-IO key in the field above');
    $("#data").css('display', 'none');
  }
};

var setSwitchValue = function(onOff) {
  var setData = setSwitch(onOff);
  setData.done(function(value) {
    // console.log("Done:", value);
  });
  setData.fail(function(error) {
    $("#mess").text("Failed to set the value..." + (error !== undefined ? error : ''));
  });
};

var displayScale = 0.75;

var displayHum, displayPRMSL, displayTemp;
var apb1, apb2, apb3;

window.onload = function() {
  displayHum   = new AnalogDisplay('humCanvas',   100 * displayScale,  100, 10, 1, true, 40);
  displayPRMSL = new AnalogDisplay('prmslCanvas', 100 * displayScale, 1045, 10, 1, true, 50, 985, 0);
  displayTemp  = new Thermometer('tempCanvas', 200);

  apb1  = new AtomicProgressBar('apbCanvas-01', 200, 20, { gradientFrom: 'lightgray', gradientTo: 'black' }, 'cyan');
  apb2  = new AtomicProgressBar('apbCanvas-02', 200, 20, { gradientFrom: 'lightgray', gradientTo: 'black' }, 'cyan');
  apb3  = new AtomicProgressBar('apbCanvas-03', 100, 20, { gradientFrom: 'lightgray', gradientTo: 'black' }, 'cyan');
};

var ANIMATE = true;

var setHumidity = function(hum) {
  if (ANIMATE) {
    displayHum.animate(hum);
  } else {
    displayHum.setValue(hum);
  }
};

var setPressure = function(press) {
  if (ANIMATE) {
    displayPRMSL.animate(press);
  } else {
    displayPRMSL.setValue(press);
  }
};

var setTemperature = function(temp) {
  if (ANIMATE) {
    displayTemp.animate(temp);
  } else {
    displayTemp.setValue(temp);
  }
};
