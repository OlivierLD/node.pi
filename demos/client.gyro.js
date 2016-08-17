"use strict";

var connection;

(function () {
  var ws = window.WebSocket || window.MozWebSocket;

  // if browser doesn't support WebSocket, just show some notification and exit
//  if (!window.WebSocket) 

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

  connection.onmessage = function (message) {
    console.log('onmessage:', message.data);
    var mess = JSON.parse(message.data);
    document.getElementById('X').innerHTML = mess.x;
    document.getElementById('Y').innerHTML = mess.y;
    document.getElementById('Z').innerHTML = mess.z;
    sendToCube(mess.x, mess.y, mess.z);
  };

  /**
   * This method is optional. If the server wasn't able to respond to the
   * in 3 seconds then show some error message to notify the user that
   * something is wrong.
   */
  setInterval(function() {
    if (connection.readyState !== 1) {
      displayMessage('Unable to communicate with the WebSocket server. Try again.');
    }
  }, 3000); // Ping

})();

var sendMessage = function(msg) {
  console.log("Sending:" + msg);
  if (!msg) {
    return;
  }
  // send the message as an ordinary text
  connection.send(msg);
};
 
var displayMessage = function(mess) {
  try {
    console.log(mess);
  } catch (err) {
    console.log(mess);
  }
};

var resetStatus = function() {
  statusFld.innerHTML = "";
};
