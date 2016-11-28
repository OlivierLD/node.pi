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
 // console.log('onmessage:' + message);
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
      nmeaID.innerHTML = '<b>' + json.data.lastID + '</b>';
      generateSatelliteData(json.data.satellites);
      if (json.data.cog !== undefined) {
        rose.setValue(Math.round(json.data.cog));
      }
      if (json.data.sog !== undefined) {
        displayBSP.setValue(json.data.sog);
      }
    } else {
      displayMessage('Hmm..., I\'ve never seen JSON like this: ' + json);
    }
  };

  var generateSatelliteData = function(sd) {
    var html = "<table cellspacing='10'>";
    html += "<tr><th>PRN</th><th>Alt.</th><th>Z</th><th>snr</th></tr>";
    if (sd !== undefined) {
      // Send to plotter here.
      satellitesPlotter.setSatellites(sd);

      for (var sat=0; sat<sd.length; sat++) {
        html += "<tr>" +
                "<td align='center' bgcolor='black' style='color: " + getSNRColor(sd[sat].snr) + ";'>" + sd[sat].prn +
            "</td><td align='right'>" + sd[sat].elevation +
            "&deg;</td><td align='right'>" + sd[sat].azimuth +
            "&deg;</td><td align='right'>" + sd[sat].snr + "</td></tr>";
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
        c = 'green';
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
  var messList = statusFld.innerHTML;
  messList = (((messList !== undefined && messList.length) > 0 ? messList + '<br>' : '') + mess);
  statusFld.innerHTML = messList;
  statusFld.scrollTop = statusFld.scrollHeight; // Scroll down
};

var resetStatus = function() {
  statusFld.innerHTML = "";
};

var setConnectionStatus = function(ok) {
  var title = document.getElementById("title");
  if (title !== undefined) {
    title.style.color = (ok === true ? 'green' : 'red');
  }
};