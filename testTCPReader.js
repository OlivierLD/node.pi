"use strict";

/**
 * Quick sample, showing how to receive data from a TCP port
 */
var net = require('net');

var client = new net.Socket();
client.connect(7001, '127.0.0.1', function() {
    console.log('Connected');
});

client.on('data', function(data) {
    console.log(/* 'Received on TCP: ' + */ '' + data );
});

client.on('close', function() {
    console.log('Connection closed');
    client.destroy(); // kill client
});

var exit = function() {
    console.log("\nBye.");
    client.destroy();
    process.stdin.pause();
};

process.on('SIGINT', exit); // Ctrl C
