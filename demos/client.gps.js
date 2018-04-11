"use strict";

var connection;

(function () {
  var ws = window.WebSocket || window.MozWebSocket;
  if (!ws) {
    displayMessage('Sorry, but your browser does not support WebSockets.');
    return;
  }

  // open connection
  var rootUri = "ws://" + (document.location.hostname === "" ? "localhost" : document.location.hostname) + ":" +
                          (document.location.port === "" ? "8080" : document.location.port);
  console.log(rootUri);
  connection = new WebSocket(rootUri); // 'ws://localhost:9876');

  connection.onopen = function () {
    displayMessage('Connected.')
  };

  connection.onerror = function (error) {
    // just in there were some problems with connection...
    displayMessage('Sorry, but there is some problem with your connection or the server is down.');
  };

  // most important part - incoming messages
  connection.onmessage = function (message) {
    console.log('onmessage:', message);
    // try to parse JSON message.
    try {
      var json = JSON.parse(message.data);
    } catch (e) {
      displayMessage('This doesn\'t look like a valid JSON: ' + message.data);
      return;
    }

    if (json.type === 'message') {
//    displayMessage("GPS Data: " + JSON.stringify(json.data));
//    displayMessage(json.data.date + ", Satellites:" + json.data.nbSat);
      plotPositionOnChart({ lat: json.data.latitude, lng: json.data.longitude });
      document.getElementById("fixdate").innerHTML = json.data.date;
   // nmeaID.innerHTML = '<b>' + json.data.lastID + '</b>';
	    document.getElementById("nmea-id").innerHTML = '<b>' + json.data.lastID + '</b>';
      generateSatelliteData(json.data.satellites);
	    try {
		    if (json.data.cog !== undefined && rose !== undefined) {
			    rose.setValue(Math.round(json.data.cog));
		    }
	    } catch (err) {
	    }
	    try {
		    if (json.data.sog !== undefined && displayBSP !== undefined) {
			    displayBSP.setValue(json.data.sog);
		    }
	    } catch (err) {
	    }
    } else {
      displayMessage('Hmm..., I\'ve never seen JSON like this: ' + json);
    }
  };

	const fakeGpsSatelliteData = [{
			"svID":1,
			"elevation":26,
			"azimuth":316,
			"snr":0
		}, {
			"svID":3,
			"elevation":4,
			"azimuth":284,
			"snr":0
		}, {
			"svID":8,
			"elevation":27,
			"azimuth":251,
			"snr":6
		}, {
			"svID":10,
			"elevation":43,
			"azimuth":75,
			"snr":0
		}, {
			"svID":11,
			"elevation":32,
			"azimuth":303,
			"snr":0
		}, {
			"svID":14,
			"elevation":84,
			"azimuth":250,
			"snr":0
		}, {
			"svID":18,
			"elevation":16,
			"azimuth":92,
			"snr":0
		}, {
			"svID":22,
			"elevation":22,
			"azimuth":291,
			"snr":0
		}, {
			"svID":24,
			"elevation":1,
			"azimuth":33,
			"snr":0
		}, {
			"svID":27,
			"elevation":16,
			"azimuth":212,
			"snr":6
		}, {
			"svID":31,
			"elevation":31,
			"azimuth":157,
			"snr":0
		}, {
			"svID":32,
			"elevation":69,
			"azimuth":37,
			"snr":0
		}];

	var generateSatelliteData = function(sd) {

  	// For tests
  	if (sd === undefined) {
  		sd = fakeGpsSatelliteData;
	  }

    var html = "<table cellspacing='10'>";
    html += "<tr><th>PRN</th><th>Alt.</th><th>Z</th><th>snr</th></tr>";
    if (sd !== undefined) {
	    try {
		    // Send to plotter here.
		    if (satellitesPlotter !== undefined) {
			    satellitesPlotter.setSatellites(sd);
		    }
	    } catch (Oops) {
	    }
	    try {
		    if (globe !== undefined) {
			    if (gpsSatelliteData !== undefined) {
				    gpsSatelliteData = sd;
				    globe.repaint();
			    }
		    }
	    } catch (Oops) {
	    }
			satData = document.getElementById("satData");
	    if (satData !== undefined) {
		    for (var sat = 0; sat < sd.length; sat++) {
		    	if (sd[sat].prn !== null && sd[sat].elevation !== null && sd[sat].azimuth !== null && sd[sat].snr !== null) {
				    html += "<tr>" +
						    "<td align='center' bgcolor='black' style='color: " + getSNRColor(sd[sat].snr) + ";'>" + (sd[sat].prn === null ? "-" : sd[sat].prn)  +
						    "</td><td align='right'>" + (sd[sat].elevation === null ? "-" : sd[sat].elevation) +
						    "&deg;</td><td align='right'>" + (sd[sat].azimuth === null ? "-" : sd[sat].azimuth) +
						    "&deg;</td><td align='right'>" + (sd[sat].snr === null ? "-" : sd[sat].snr) + "</td></tr>";
			    }
		    }
	    }
    }
	  html += "</table>";
		satData.innerHTML = html;
  };

  var getSNRColor = function(snr) {
    var c = 'lightGray';
    if (snr !== undefined && snr !== null) {
      if (snr > 0) {
        c = 'red';
      }
      if (snr > 10) {
        c = 'orange';
      }
      if (snr > 20) {
        c = 'yellow';
      }
      if (snr > 30) {
        c = 'lightGreen';
      }
      if (snr > 40) {
        c = 'white';
      }
    }
    return c;
  };

  /**
   * This method is optional. If the server wasn't able to respond to the
   * in 3 seconds then show some error message to notify the user that
   * something is wrong.
   */
  setInterval(function() {
    setConnectionStatus(connection.readyState === 1);
    // if (connection.readyState !== 1) {
    //   displayMessage('Unable to communicate with the WebSocket server. Try again.');
    // }
  }, 3000); // Ping
})();

var displayMessage = function(mess) {
	statusFld = document.getElementById("status");
  if (statusFld !== undefined) {
	  var messList = statusFld.innerHTML;
	  messList = (((messList !== undefined && messList.length) > 0 ? messList + '<br>' : '') + mess);
	  statusFld.innerHTML = messList;
	  statusFld.scrollTop = statusFld.scrollHeight; // Scroll down
  } else {
  	alert(mess);
  }
};

var resetStatus = function() {
  statusFld.innerHTML = "";
};

var setConnectionStatus = function(ok) {
  var title = document.getElementById("title");
  if (title !== undefined) {
    title.style.color = (ok === true ? 'green' : 'red');
    title.title = (ok === true ? 'Connection OK' : 'Connection not established');
  }
};
