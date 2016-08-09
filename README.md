## Sample scripts for nodejs on the Raspberry PI
This project is gathering scripts based on several `nodejs` modules: [`serialport`](https://www.npmjs.com/package/serialport), [`onoff`](https://www.npmjs.com/package/onoff) and [`i2c-bus`](https://www.npmjs.com/package/i2c-bus)

This goal is to provide a JavaScript access to sensors, PCBs and accessories hooked up on a Raspberry PI, 
like the code of [this project](https://github.com/OlivierLD/raspberry-pi4j-samples/) is doing for Java and other JVM-aware languages.

### First installation
We assume you have already installed `nodejs` and `npm` on the Raspberry PI.
After cloning this repository on the RaspberryPI, run the following command from the root directory 
of the project (the one containing `package.json`):
```
 $> npm install
```
This will install the required nodejs modules.

### MCP3008. Analog to Digital Converter
The source is in `mcp3008.js`.
To run a test script:
```
 $> node testMcp3008.js
```
The pin numbers are always something, depending on the framework you are using (PI4J, WiringPI, onoff, etc).
The wiring corresponding to the code is that one:
![MCP3008 wiring](./mcp3008.png "Wiring")

### I2C BME280 (Pressure, Humidity, Temperature, Altitude)
The source is in `mbe280.js`.
To run a test script:
```
 $> sudo node testMbe280.js
```
_Note_: The `BME280` provides `I2C` and `SPI` accesses. Here we use `I2C`. Make sure you connect the BME280's `SCK` to the Raspberry's `SCL` (like pin #5),
and the BME280's `SDI` to the Raspberry's `SDA` (like pin #3).

### To come...
 * FONA
 * Servo HAT
 * Read GPS Data
 * ... and more

### To debug a nodejs application:

To do once:
```
$> [sudo] npm install -g node-inspector
```
Then
```
$> node-debug testUtils.js
Node Inspector v0.12.8
Visit http://127.0.0.1:8080/?port=5858 to start debugging.
Debugging `testUtils.js`

Debugger listening on port 5858
```

Then open Chrome, and load the URL above.
Switch to the "Sources" tab, set your breakpoints, and begin debugging!
