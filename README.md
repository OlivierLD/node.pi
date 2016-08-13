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
 Usage: node /home/pi/node.pi/testMcp3008.js [debug]
 Ctrl+C to stop
 Reading MCP3008: CLK: 18 MISO: 23 MOSI: 24 CS: 25
 Val:599
 Val:600
 Val:601
 Val:601
 Val:600
 Val:600
 Val:815
 Val:967
 Val:972
```
The pin numbers are always something, depending on the framework you are using (PI4J, WiringPI, onoff, etc).
The wiring corresponding to the code is that one:
![MCP3008 wiring](./mcp3008.png "Wiring")

### I2C BME280 (Pressure, Humidity, Temperature, Altitude)
The source is in `bme280.js`.
To run a test script:
```
 $> sudo node testBme280.js
 Init...
 Temperature : 22.21°C
 Humidity    : 61.11 %
 Pressure    : 1017.17 hPa
 --------------------------------
 Temperature : 22.21°C
 Humidity    : 61.11 %
 Pressure    : 1017.15 hPa
 --------------------------------
 Temperature : 22.21°C
 Humidity    : 61.10 %
 Pressure    : 1017.17 hPa
 --------------------------------
```
_Note_: The `BME280` provides `I2C` and `SPI` accesses. Here we use `I2C`. Make sure you connect the BME280's `SCK` to the Raspberry's `SCL` (like pin #5),
and the BME280's `SDI` to the Raspberry's `SDA` (like pin #3).

### Read GPS data, through a Serial port
See the code in `NMEAReader.js` and `NMEAParser.js`.
To run a test script:
```
 $> sudo node testGPS.js
  To stop: Ctrl-C, or enter "quit" + [return] her ein the console
  Usage: node /home/pi/node.pi/testGPS.js [raw]|fmt
  Serial /dev/ttyUSB0 br 4800
  Port open
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPRMC,013948.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*78
  $GPRMC,013948.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*78
  $GPRMC,013948.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*78
  $GPGGA,013949.158,3744.9324,N,12230.4161,W,1,06,1.5,-21.4,M,,,,0000*07
  $GPGGA,013949.158,3744.9324,N,12230.4161,W,1,06,1.5,-21.4,M,,,,0000*07
  $GPGGA,013949.158,3744.9324,N,12230.4161,W,1,06,1.5,-21.4,M,,,,0000*07
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPRMC,013949.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*79
  $GPRMC,013949.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*79
  $GPRMC,013949.158,A,3744.9324,N,12230.4161,W,000.0,102.9,130816,,,A*79
  $GPGGA,013950.158,3744.9325,N,12230.4161,W,1,06,1.5,-21.5,M,,,,0000*0F
  $GPGGA,013950.158,3744.9325,N,12230.4161,W,1,06,1.5,-21.5,M,,,,0000*0F
  $GPGGA,013950.158,3744.9325,N,12230.4161,W,1,06,1.5,-21.5,M,,,,0000*0F
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSA,A,3,20,21,15,13,10,29,,,,,,,2.3,1.5,1.8*33
  $GPGSV,3,1,12,20,24,056,34,21,64,070,33,15,33,055,35,13,08,036,16*74
  $GPGSV,3,1,12,20,24,056,34,21,64,070,33,15,33,055,35,13,08,036,16*74
```
or
```
 $> sudo node testGPS.js fmt
 To stop: Ctrl-C, or enter "quit" + [return] her ein the console
 Usage: node /home/pi/node.pi/testGPS.js [raw]|fmt
 Serial /dev/ttyUSB0 br 4800
 Port open
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:45 GMT+0000 (UTC)
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:45 GMT+0000 (UTC)
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:45 GMT+0000 (UTC)
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:46 GMT+0000 (UTC)
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:46 GMT+0000 (UTC)
 Position: { lat: 37.748895, lon: -122.506955 }
 Time: Sat Aug 13 2016 01:45:46 GMT+0000 (UTC)
```

### To come...
 * FONA
 * Servo HAT
 * Sense HAT
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
