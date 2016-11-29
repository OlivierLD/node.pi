"use strict";

process.title = 'node-tcp';

/**
 * Quick sample, showing how to receive data from a TCP port
 */
var net = require('net');

var client = new net.Socket();
var server = '192.168.1.1'; // 'localhost', '127.0.0.1'
client.connect(7001, server, function() {
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
