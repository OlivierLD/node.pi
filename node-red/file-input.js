module.exports = function (RED) {
    function FileInputNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var filename = config.path;
        var freq = config.freq; // Default 1

        var fs = require('fs'),
            lineByLine = require('n-readlines');

        var nbLines = 0;

        var reader = new lineByLine(filename);

        function readNext() {
            var ok = true;
            var line = reader.next();
            if (line !== undefined && line !== null) {
//              console.log(">>> Read " + line);
                var str = Buffer.from(line);
                node.send({ 'payload': str.toString() });
            } else {
                ok = false;
            }
            if (ok === true) {
                setTimeout(readNext, freq * 1000);
            }
        };
        readNext();

        console.log("Done reading");

        this.on('close', function() {
            // close the file here
        });
    }

    RED.nodes.registerType("file-input", FileInputNode);
}
