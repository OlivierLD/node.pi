## Some nodes, for `Node-Red`.

### How to install your nodes...
A node definition is made out of 2 files, and `html` one for the parameters entry, and a `js` one for the actual code.

I dropped those in the directory `/usr/local/lib/node_modules/node-red/nodes/`.

If a node requires an external library (like `n-readlines`), the `npm install` command
needs to be run from `/usr/local/lib/node_modules/node-red`:
```bash
 $> [sudo] npm install n-readlines
```

### How to use your own libraries in a function
In case you want to call your own code from a Node-Red function, like in
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
and the code of `NMEAPaser.js` has to be present in this directory as well.