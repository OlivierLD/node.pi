## Some nodes, for `Node-Red`.

To install Node-Red, see [here](https://nodered.org/docs/getting-started/installation).

### How to install your nodes...
A node definition is made out of 2 files, and `html` one for the parameters entry, and a `js` one for the actual code.

I dropped those in the directory `/usr/local/lib/node_modules/node-red/nodes/`.

If a node requires an external library (like `n-readlines`), the `npm install` command
needs to be run from `/usr/local/lib/node_modules/node-red` (or wherever node-red is installed, like `/usr/lib/node_modules/node-red` on the last (March 2017) Pixel image:
```bash
 $> [sudo] npm install n-readlines
```

### How to use your own libraries in a function
In case you want to call your own code from a Node-RED function, like in
```javascript
 var parser = context.global.NMEAParser;
 if (parser !== undefined) {
     var nmeaSentence = "$GPGSA,A,3,07,17,30,11,28,13,01,19,,,,,2.3,1.4,1.9*3D";
     var id = parser.validate(nmeaSentence); // Validation!
     console.log("Sentence ID:", id);
     nmeaSentence = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";
     id = parser.validate(nmeaSentence); // Validation!
     console.log("Sentence ID:", id);
     var rmc = parser.parseRMC(nmeaSentence);
     console.log("RMC:", rmc);

 } else {
     console.log("no NMEAParser was found.");
 }
```

the `context.global.NMEAParser` is defined in the file
`$HOME/.node-red/settings.js`:
```json
functionGlobalContext: {
        os:require('os'),
        here:__dirname,
        NMEAParser:require('./NMEAParser.js')
    }
```
and the code of `NMEAParser.js` has to be present in the `$HOME/.node-red` directory as well.

#### `log-replay` Node
This node allows you to replay the data logged into a text file. In this case, NMEA Data.
This is not as trivial is it sounds... Synchronous reads are always a bit tricky in JavaScript.

This uses the `n-readlines` NodeJS library, installed as mentioned above.

---
