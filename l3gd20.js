"use strict";

/*
 * Doc is at https://www.npmjs.com/package/i2c-bus
 */

var utils = require('./utils/utils.js');
var EndianReaders = require('./utils/endianreaders.js').EndianReaders;
var BitOps = require('./utils/BitOps.js').BitOps;
var L3GD20Dictionaries = require('./utils/L3GD20Dictionaries.js').L3GD20Dictionaries;
var i2c   = require('i2c-bus');

var L3GD20_ADDRESS = 0x6B;

var L3GD20_REG_R_WHO_AM_I            = 0x0f; // Device identification register
var L3GD20_REG_RW_CTRL_REG1          = 0x20; // Control register 1
var L3GD20_REG_RW_CTRL_REG2          = 0x21; // Control register 2
var L3GD20_REG_RW_CTRL_REG3          = 0x22; // Control register 3
var L3GD20_REG_RW_CTRL_REG4          = 0x23; // Control register 4
var L3GD20_REG_RW_CTRL_REG5          = 0x24; // Control register 5
var L3GD20_REG_RW_REFERENCE          = 0x25; // Reference value for interrupt generation
var L3GD20_REG_R_OUT_TEMP            = 0x26; // Output temperature
var L3GD20_REG_R_STATUS_REG          = 0x27; // Status register
var L3GD20_REG_R_OUT_X_L             = 0x28; // X-axis angular data rate LSB
var L3GD20_REG_R_OUT_X_H             = 0x29; // X-axis angular data rate MSB
var L3GD20_REG_R_OUT_Y_L             = 0x2a; // Y-axis angular data rate LSB
var L3GD20_REG_R_OUT_Y_H             = 0x2b; // Y-axis angular data rate MSB
var L3GD20_REG_R_OUT_Z_L             = 0x2c; // Z-axis angular data rate LSB
var L3GD20_REG_R_OUT_Z_H             = 0x2d; // Z-axis angular data rate MSB
var L3GD20_REG_RW_FIFO_CTRL_REG      = 0x2e; // Fifo control register
var L3GD20_REG_R_FIFO_SRC_REG        = 0x2f; // Fifo src register
var L3GD20_REG_RW_INT1_CFG_REG       = 0x30; // Interrupt 1 configuration register
var L3GD20_REG_R_INT1_SRC_REG        = 0x31; // Interrupt source register
var L3GD20_REG_RW_INT1_THS_XH        = 0x32; // Interrupt 1 threshold level X MSB register
var L3GD20_REG_RW_INT1_THS_XL        = 0x33; // Interrupt 1 threshold level X LSB register
var L3GD20_REG_RW_INT1_THS_YH        = 0x34; // Interrupt 1 threshold level Y MSB register
var L3GD20_REG_RW_INT1_THS_YL        = 0x35; // Interrupt 1 threshold level Y LSB register
var L3GD20_REG_RW_INT1_THS_ZH        = 0x36; // Interrupt 1 threshold level Z MSB register
var L3GD20_REG_RW_INT1_THS_ZL        = 0x37; // Interrupt 1 threshold level Z LSB register
var L3GD20_REG_RW_INT1_DURATION      = 0x38; // Interrupt 1 duration register
  
var L3GD20_MASK_CTRL_REG1_Xen        = 0x01; // X enable
var L3GD20_MASK_CTRL_REG1_Yen        = 0x02; // Y enable
var L3GD20_MASK_CTRL_REG1_Zen        = 0x04; // Z enable
var L3GD20_MASK_CTRL_REG1_PD         = 0x08; // Power-down
var L3GD20_MASK_CTRL_REG1_BW         = 0x30; // Bandwidth
var L3GD20_MASK_CTRL_REG1_DR         = 0xc0; // Output data rate
var L3GD20_MASK_CTRL_REG2_HPCF       = 0x0f; // High pass filter cutoff frequency
var L3GD20_MASK_CTRL_REG2_HPM        = 0x30; // High pass filter mode selection
var L3GD20_MASK_CTRL_REG3_I2_EMPTY   = 0x01; // FIFO empty interrupt on DRDY/INT2
var L3GD20_MASK_CTRL_REG3_I2_ORUN    = 0x02; // FIFO overrun interrupt on DRDY/INT2
var L3GD20_MASK_CTRL_REG3_I2_WTM     = 0x04; // FIFO watermark interrupt on DRDY/INT2
var L3GD20_MASK_CTRL_REG3_I2_DRDY    = 0x08; // Date-ready on DRDY/INT2
var L3GD20_MASK_CTRL_REG3_PP_OD      = 0x10; // Push-pull / Open-drain
var L3GD20_MASK_CTRL_REG3_H_LACTIVE  = 0x20; // Interrupt active configuration on INT1
var L3GD20_MASK_CTRL_REG3_I1_BOOT    = 0x40; // Boot status available on INT1
var L3GD20_MASK_CTRL_REG3_I1_Int1    = 0x80; // Interrupt enabled on INT1
var L3GD20_MASK_CTRL_REG4_SIM        = 0x01; // SPI Serial interface selection
var L3GD20_MASK_CTRL_REG4_FS         = 0x30; // Full scale selection
var L3GD20_MASK_CTRL_REG4_BLE        = 0x40; // Big/little endian selection
var L3GD20_MASK_CTRL_REG4_BDU        = 0x80; // Block data update
var L3GD20_MASK_CTRL_REG5_OUT_SEL    = 0x03; // Out selection configuration
var L3GD20_MASK_CTRL_REG5_INT_SEL    = 0xc0; // INT1 selection configuration
var L3GD20_MASK_CTRL_REG5_HPEN       = 0x10; // High-pass filter enable
var L3GD20_MASK_CTRL_REG5_FIFO_EN    = 0x40; // Fifo enable
var L3GD20_MASK_CTRL_REG5_BOOT       = 0x80; // Reboot memory content
var L3GD20_MASK_STATUS_REG_ZYXOR     = 0x80; // Z, Y, X axis overrun
var L3GD20_MASK_STATUS_REG_ZOR       = 0x40; // Z axis overrun
var L3GD20_MASK_STATUS_REG_YOR       = 0x20; // Y axis overrun
var L3GD20_MASK_STATUS_REG_XOR       = 0x10; // X axis overrun
var L3GD20_MASK_STATUS_REG_ZYXDA     = 0x08; // Z, Y, X data available
var L3GD20_MASK_STATUS_REG_ZDA       = 0x04; // Z data available
var L3GD20_MASK_STATUS_REG_YDA       = 0x02; // Y data available
var L3GD20_MASK_STATUS_REG_XDA       = 0x01; // X data available
var L3GD20_MASK_FIFO_CTRL_REG_FM     = 0xe0; // Fifo mode selection
var L3GD20_MASK_FIFO_CTRL_REG_WTM    = 0x1f; // Fifo treshold - watermark level
var L3GD20_MASK_FIFO_SRC_REG_FSS     = 0x1f; // Fifo stored data level
var L3GD20_MASK_FIFO_SRC_REG_EMPTY   = 0x20; // Fifo empty bit
var L3GD20_MASK_FIFO_SRC_REG_OVRN    = 0x40; // Overrun status
var L3GD20_MASK_FIFO_SRC_REG_WTM     = 0x80; // Watermark status
var L3GD20_MASK_INT1_CFG_ANDOR       = 0x80; // And/Or configuration of interrupt events 
var L3GD20_MASK_INT1_CFG_LIR         = 0x40; // Latch interrupt request
var L3GD20_MASK_INT1_CFG_ZHIE        = 0x20; // Enable interrupt generation on Z high
var L3GD20_MASK_INT1_CFG_ZLIE        = 0x10; // Enable interrupt generation on Z low
var L3GD20_MASK_INT1_CFG_YHIE        = 0x08; // Enable interrupt generation on Y high
var L3GD20_MASK_INT1_CFG_YLIE        = 0x04; // Enable interrupt generation on Y low
var L3GD20_MASK_INT1_CFG_XHIE        = 0x02; // Enable interrupt generation on X high
var L3GD20_MASK_INT1_CFG_XLIE        = 0x01; // Enable interrupt generation on X low
var L3GD20_MASK_INT1_SRC_IA          = 0x40; // Int1 active
var L3GD20_MASK_INT1_SRC_ZH          = 0x20; // Int1 source Z high
var L3GD20_MASK_INT1_SRC_ZL          = 0x10; // Int1 source Z low
var L3GD20_MASK_INT1_SRC_YH          = 0x08; // Int1 source Y high
var L3GD20_MASK_INT1_SRC_YL          = 0x04; // Int1 source Y low
var L3GD20_MASK_INT1_SRC_XH          = 0x02; // Int1 source X high
var L3GD20_MASK_INT1_SRC_XL          = 0x01; // Int1 source X low  
var L3GD20_MASK_INT1_THS_H           = 0x7f; // MSB
var L3GD20_MASK_INT1_THS_L           = 0xff; // LSB
var L3GD20_MASK_INT1_DURATION_WAIT   = 0x80; // Wait number of samples or not
var L3GD20_MASK_INT1_DURATION_D      = 0x7f; // Duration of int1 to be recognized

var gain = 1.0;

// For calibration purposes
var meanX = 0.0;
var maxX  = 0.0;
var minX  = 0.0;
var meanY = 0.0;
var maxY  = 0.0;
var minY  = 0.0;
var meanZ = 0.0;
var maxZ  = 0.0;
var minZ  = 0.0;
  
var L3GD20 = function(addr) {
  addr |= L3GD20_ADDRESS;

  var i2c1;

  this.open = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
  };
  this.shutdown = function() {
    i2c1.closeSync();
  };

  var writeToRegister = function(register, mask, value) {
    var current = EndianReaders.readU8(i2c1, addr, register);
    var newValue = BitOps.setValueUnderMask(value, current, mask);
    if (global.verbose === true) {
      console.log("(Write) I2C: Device " + utils.hexFmt(addr, 2) +
                             " writing " + utils.hexFmt(newValue, 2) +
                              " to reg " + utils.hexFmt(register, 2));
    }
    i2c1.writeByteSync(addr, register, newValue);
  };

  var readFromRegister = function(register, mask) {
    var current = EndianReaders.readU8(i2c1, addr, register);
    return BitOps.getValueUnderMask(current, mask);
  };

  var readFromRegisterWithDictionaryMatch = function(register, mask, dictionary) {
    var current = readFromRegister(register, mask);
    for (var idx in dictionary) {
      if (dictionary[idx].val === current) {
        return dictionary[idx].key;
      }
    }
    return null;
  };

  var getKey = function(map, key) {
    var k;
    for (var idx in map) {
   // console.log("Comparing " + key + " and ", map[idx]);
      if (map[idx].key === key) {
        k = key;
        break;
      }
    }
    return k;
  };

  var getVal = function(map, key) {
    var val;
    for (var idx in map) {
      if (map[idx].key === key) {
        val = map[idx].val;
        break;
      }
    }
    return val;
  };

  var writeToRegisterWithDictionaryCheck = function(register, mask, value, dictionary, dictName) {
    if (getKey(dictionary, value) === undefined) {
      throw { err: "Key [" + value + "] not in range of " + dictName };
    }
    if (global.verbose === true) {
      console.log("writeToRegisterWithDictionaryCheck in " + dictName +
                                                  ": reg " + utils.hexFmt(register, 2) +
                                                  ", key " + value +
                                                ", value " + utils.hexFmt( getVal(dictionary, value), 2));
      console.log("Map " + dictName + ":", dictionary);
      console.log("dictionary[value]:", getVal(dictionary, value));
    }
    writeToRegister(register, mask,  getVal(dictionary, value));
  };

  /*
   * To be called after configuration, before measuring
   */
  this.init = function() {
    var fullScaleValue = getFullScaleValue();
    if (fullScaleValue === L3GD20Dictionaries._250_DPS)
      gain = 0.00875;
    else if (fullScaleValue === L3GD20Dictionaries._500_DPS)
      gain = 0.0175;
    else if (fullScaleValue === L3GD20Dictionaries._2000_DPS)
      gain = 0.07;
  };

  this.calibrateX = function() {
    console.log("Calibrating X, please do not move the sensor...");
    var buff = []
    for (var i=0; i<20; i++) {
      while (getAxisDataAvailableValue()[0] === 0) {
        waitfor(1);
      }
      buff.push(getRawOutXValue());
    }
    meanX = getMean(buff);
    maxX  = getMax(buff);
    minX  = getMin(buff);
  };

  this.calibrateY = function() {
    console.log("Calibrating Y, please do not move the sensor...");
    var buff = [];
    for (var i=0; i<20; i++) {
      while (getAxisDataAvailableValue()[1] === 0) {
        waitfor(1);
      }
      buff.push(getRawOutYValue());
    }
    meanY = getMean(buff);
    maxY  = getMax(buff);
    minY  = getMin(buff);
  };

  this.calibrateZ = function() {
    console.log("Calibrating Z, please do not move the sensor...");
    var buff = [];
    for (var i=0; i<20; i++) {
      while (getAxisDataAvailableValue()[2] === 0) {
        waitfor(1);
      }
      buff.push(getRawOutZValue());
    }
    meanZ = getMean(buff);
    maxZ  = getMax(buff);
    minZ  = getMin(buff);
  };

  this.calibrate = function() {
    this.calibrateX();
    this.calibrateY();
    this.calibrateZ();
  };

  var getMax = function(da) {
    var max = da[0];
    for (var d in da) {
      max = Math.max(max, da[d]);
    }
    return max;
  };

  var getMin = function(da)
  {
    var min = da[0];
    for (var d in da) {
      min = Math.min(min, da[d]);
    }
    return min;
  };

  var getMean = function(da) {
    var mean = 0;
    for (var d in da) {
      mean += da[d];
    }
    return mean / da.length;
  };

  var getAxisOverrunValue = function() {
    var zor = 0;
    var yor = 0;
    var xor = 0;
    if (readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_ZYXOR) === 0x01) {
      zor = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_ZOR);
      yor = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_YOR);
      xor = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_XOR);
    }
    return [ xor, yor, zor ];
  };

  var getAxisDataAvailableValue = function() {
    var zda = 0;
    var yda = 0;
    var xda = 0;
    var rfr = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_ZYXDA);
    if (rfr === 0x01) {
      zda = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_ZDA);
      yda = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_YDA);
      xda = readFromRegister(L3GD20_REG_R_STATUS_REG, L3GD20_MASK_STATUS_REG_XDA);
    } else {
      if (global.verbose === true) { console.log("ReadFromReg:" + utils.hexFmt(rfr, 2)); }
    }
    return [ xda, yda, zda ];
  };

  var getRawOutXValue = function() {
    var l = readFromRegister(L3GD20_REG_R_OUT_X_L, 0xff);
    var h_u2 = readFromRegister(L3GD20_REG_R_OUT_X_H, 0xff);
    var h = BitOps.twosComplementToByte(h_u2);
    var value = 0;
    if (h < 0) {
      value = (h * 256 - l);
    } else if (h >= 0) {
      value = (h * 256 + l);
    }
    return value * gain;
  };

  var getRawOutYValue = function() {
    var l = readFromRegister(L3GD20_REG_R_OUT_Y_L, 0xff);
    var h_u2 = readFromRegister(L3GD20_REG_R_OUT_Y_H, 0xff);
    var h = BitOps.twosComplementToByte(h_u2);
    var value = 0;
    if (h < 0) {
      value = (h * 256 - l);
    } else if (h >= 0) {
      value = (h * 256 + l);
    }
    return value * gain;
  };

  var getRawOutZValue = function() {
    var l = readFromRegister(L3GD20_REG_R_OUT_Z_L, 0xff);
    var h_u2 = readFromRegister(L3GD20_REG_R_OUT_Z_H, 0xff);
    var h = BitOps.twosComplementToByte(h_u2);
    var value = 0;
    if (h < 0) {
      value = (h * 256 - l);
    } else if (h >= 0) {
      value = (h * 256 + l);
    }
    return value * gain;
  };

  var getRawOutValues = function() {
    return [ getRawOutXValue(), getRawOutYValue(), getRawOutZValue() ];
  };

  var getCalOutXValue = function() {
    var calX = 0;
    var x = getRawOutXValue();
    if (x >= minX && x <= maxX) {
      calX = 0;
    } else {
      calX = x - meanX;
    }
    return calX;
  };

  var getCalOutYValue = function() {
    var calY = 0;
    var y = getRawOutYValue();
    if (y >= minY && y <= maxY) {
      calY = 0;
    } else {
      calY = y - meanY;
    }
    return calY;
  };

 var getCalOutZValue = function() {
    var calZ = 0;
    var z = getRawOutZValue();
    if (z >= minZ && z <= maxZ) {
      calZ = 0;
    } else {
      calZ = z - meanZ;
    }
    return calZ;
  };

  this.getCalOutValue = function() {
    return [ getCalOutXValue(), getCalOutYValue(), getCalOutZValue() ];
  };

  /*
   * All getters and setters
   */
  var getFullScaleValue = function() {
    return readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_CTRL_REG4, L3GD20_MASK_CTRL_REG4_FS, L3GD20Dictionaries.FullScaleMap);
  };

  this.setFullScaleValue = function(value) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_CTRL_REG4, L3GD20_MASK_CTRL_REG4_FS, value, L3GD20Dictionaries.FullScaleMap, "FullScaleMap") ;
  };

  var returnConfiguration = function() {
    return "To be implemented...";
  };

  var getDeviceId = function() {
    return readFromRegister(L3GD20_REG_R_WHO_AM_I, 0xff);
  };

  this.setAxisXEnabled = function(enabled) {
    if (global.verbose === true) {
      console.log("setAxisXEnabled: enabled " + enabled +
                  " (" + (enabled === true) + "), setting to " +
                  (enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE));
    }
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_CTRL_REG1,
                                       L3GD20_MASK_CTRL_REG1_Xen,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  this.isAxisXEnabled = function() {
    var enabled = readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_Xen, L3GD20Dictionaries.EnabledMap);
    return enabled === L3GD20Dictionaries.TRUE;
  };

  this.setAxisYEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_CTRL_REG1,
                                       L3GD20_MASK_CTRL_REG1_Yen,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  this.isAxisYEnabled = function() {
    var enabled = readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_Yen, L3GD20Dictionaries.EnabledMap);
    return enabled === L3GD20Dictionaries.TRUE;
  };

  this.setAxisZEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_CTRL_REG1,
                                       L3GD20_MASK_CTRL_REG1_Zen,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  this.isAxisZEnabled = function() {
    var enabled = readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_Zen, L3GD20Dictionaries.EnabledMap);
    return enabled === L3GD20Dictionaries.TRUE;
  };

  this.setPowerMode = function(mode) {
    var key = getKey(L3GD20Dictionaries.PowerModeMap, mode);

    if (key === undefined) {
      throw { err: "Value [" + mode + "] not accepted for PowerMode" };
    }
    if (mode === L3GD20Dictionaries.POWER_DOWN) {
      writeToRegister(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_PD, 0);
    } else if (mode === L3GD20Dictionaries.SLEEP) {
      writeToRegister(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_PD |
                                               L3GD20_MASK_CTRL_REG1_Zen |
                                               L3GD20_MASK_CTRL_REG1_Yen |
                                               L3GD20_MASK_CTRL_REG1_Xen, 8);
    } else if (mode === L3GD20Dictionaries.NORMAL) {
      writeToRegister(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_PD, 1);
    }
  };

  var getPowerMode = function() {
    var powermode = readFromRegister(L3GD20_REG_RW_CTRL_REG1,
                                     L3GD20_MASK_CTRL_REG1_PD |
                                     L3GD20_MASK_CTRL_REG1_Xen |
                                     L3GD20_MASK_CTRL_REG1_Yen |
                                     L3GD20_MASK_CTRL_REG1_Zen);
    var dictval = -1;
    if (!BitOps.checkBit(powermode, 3)) {
      dictval = 0;
    } else if (powermode == 0x8) { // 0b1000) { // L3GD20_MASK_CTRL_REG1_PD, Power Down
      dictval = 1;
    } else if (BitOps.checkBit(powermode, 3)) {
      dictval = 2;
    }
    var key = "Unknown";
    for (var s in L3GD20Dictionaries.PowerModeMap) {
      if (L3GD20Dictionaries.PowerModeMap[s] === dictval) {
        key = s;
        break;
      }
    }
    return key;
  };

  var setFifoModeValue = function(value) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_FIFO_CTRL_REG,
                                       L3GD20_MASK_FIFO_CTRL_REG_FM,
                                       value,
                                       L3GD20Dictionaries.FifoModeMap,
                                       "FifoModeMap") ;
  };

  var getFifoModeValue = function() {
    return readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_FIFO_CTRL_REG, L3GD20_MASK_FIFO_CTRL_REG_FM, L3GD20Dictionaries.FifoModeMap);
  };

  var setDataRateAndBandwidth = function(datarate, bandwidth) {
    var bwMap;
    for (var idx in L3GD20Dictionaries.DataRateBandWidthMap) {
      if (L3GD20Dictionaries.DataRateBandWidthMap[idx].dr === datarate) {
        bwMap = L3GD20Dictionaries.DataRateBandWidthMap[idx].bw;
        break;
      }
    }
    if (bwMap === undefined) {
      throw { err: "Data rate:[" + datarate + "] not in range of data rate values."};
    }
    var bits;
    for (var idx in bwMap) {
      if (bwMap[idx].key === bandwidth) {
        bits = bwMap[idx].val;
      }
    }
    if (bits === undefined) {
      throw { err: "Bandwidth: [" + bandwidth + "] cannot be assigned to data rate: [" + datarate + "]" };
    }
    writeToRegister(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_DR | L3GD20_MASK_CTRL_REG1_BW, bits);
  };

  var getDataRateAndBandwidth = function() {
    var dr;
    var bw;
    var current = readFromRegister(L3GD20_REG_RW_CTRL_REG1, L3GD20_MASK_CTRL_REG1_DR | L3GD20_MASK_CTRL_REG1_BW);
    for (var drIdx in L3GD20Dictionaries.DataRateBandWidthMap) {
      var drKey = L3GD20Dictionaries.DataRateBandWidthMap[drIdx].dr;
      var drMap = L3GD20Dictionaries.DataRateBandWidthMap[drKey].bw;
      for (var bwIdx in drMap) {
        if (drMap[bwIdx].val === current) {
          dr = drKey;
          bw = drMap[bwIdx].key;
          return [ dr, bw ];
        }
      }
    }
    return [ dr, bw ];
  };

  var setFifoThresholdValue = function(value) {
    writeToRegister(L3GD20_REG_RW_FIFO_CTRL_REG, L3GD20_MASK_FIFO_CTRL_REG_WTM, value);
  };

  var getFifoThresholdValue = function() {
    return readFromRegister(L3GD20_REG_RW_FIFO_CTRL_REG, L3GD20_MASK_FIFO_CTRL_REG_WTM);
  };

  var getFifoStoredDataLevelValue = function() {
    return readFromRegister(L3GD20_REG_R_FIFO_SRC_REG, L3GD20_MASK_FIFO_SRC_REG_FSS);
  };

  var isFifoEmpty = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_FIFO_SRC_REG,
                                                                           L3GD20_MASK_FIFO_SRC_REG_EMPTY,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var isFifoFull = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_FIFO_SRC_REG,
                                                                           L3GD20_MASK_FIFO_SRC_REG_OVRN,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var isFifoGreaterOrEqualThanWatermark = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_FIFO_SRC_REG,
                                                                           L3GD20_MASK_FIFO_SRC_REG_WTM,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1CombinationValue = function(value) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_ANDOR,
                                       value,
                                       L3GD20Dictionaries.AndOrMap,
                                       "AndOrMap");
  };

  var getInt1CombinationValue = function() {
    return readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                               L3GD20_MASK_INT1_CFG_ANDOR,
                                               L3GD20Dictionaries.AndOrMap);
  };

  var setInt1LatchRequestEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_LIR,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1LatchRequestEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                           L3GD20_MASK_INT1_CFG_LIR,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnZHighEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_ZHIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnZHighEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                           L3GD20_MASK_INT1_CFG_ZHIE,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnZLowEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_ZLIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnZLowEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                           L3GD20_MASK_INT1_CFG_ZLIE,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnYHighEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_YHIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnYHighEnabled = function() {
    L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                    L3GD20_MASK_INT1_CFG_YHIE,
                                                                    L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnYLowEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_YLIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnYLowEnabled = function(){
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                           L3GD20_MASK_INT1_CFG_YLIE,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnXHighEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_XHIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnXHighEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                           L3GD20_MASK_INT1_CFG_XHIE,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1GenerationOnXLowEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_CFG_REG,
                                       L3GD20_MASK_INT1_CFG_XLIE,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1GenerationOnXLowEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_CFG_REG,
                                                                                   L3GD20_MASK_INT1_CFG_XLIE,
                                                                                   L3GD20Dictionaries.EnabledMap);
  }

  var isInt1Active = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_IA,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasZHighEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_ZH,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasZLowEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_ZL,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasYHighEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_YH,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasYLowEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_YL,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasXHighEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_XH,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var hasXLowEventOccured = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_R_INT1_SRC_REG,
                                                                           L3GD20_MASK_INT1_SRC_XL,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1ThresholdXValue = function(value) {
    writeToRegister(L3GD20_REG_RW_INT1_THS_XH, L3GD20_MASK_INT1_THS_H, (value & 0x7f00) >> 8);
    writeToRegister(L3GD20_REG_RW_INT1_THS_XL, L3GD20_MASK_INT1_THS_L, value & 0x00ff);
  };

  var setInt1ThresholdYValue = function(value) {
    writeToRegister(L3GD20_REG_RW_INT1_THS_YH, L3GD20_MASK_INT1_THS_H, (value & 0x7f00) >> 8);
    writeToRegister(L3GD20_REG_RW_INT1_THS_YL, L3GD20_MASK_INT1_THS_L, value & 0x00ff);
  };

  var setInt1ThresholdZValue = function(value) {
    writeToRegister(L3GD20_REG_RW_INT1_THS_ZH, L3GD20_MASK_INT1_THS_H, (value & 0x7f00) >> 8);
    writeToRegister(L3GD20_REG_RW_INT1_THS_ZL, L3GD20_MASK_INT1_THS_L, value & 0x00ff);
  };

  var getInt1Threshold_Values = function() {
    var xh = readFromRegister(L3GD20_REG_RW_INT1_THS_XH, L3GD20_MASK_INT1_THS_H);
    var xl = readFromRegister(L3GD20_REG_RW_INT1_THS_XL, L3GD20_MASK_INT1_THS_L);
    var yh = readFromRegister(L3GD20_REG_RW_INT1_THS_YH, L3GD20_MASK_INT1_THS_H);
    var yl = readFromRegister(L3GD20_REG_RW_INT1_THS_YL, L3GD20_MASK_INT1_THS_L);
    var zh = readFromRegister(L3GD20_REG_RW_INT1_THS_ZH, L3GD20_MASK_INT1_THS_H);
    var zl = readFromRegister(L3GD20_REG_RW_INT1_THS_ZL, L3GD20_MASK_INT1_THS_L);
    return [ xh * 256 + xl, yh * 256 + yl, zh * 256 + zl ];
  };

  var setInt1DurationWaitEnabled = function(enabled) {
    writeToRegisterWithDictionaryCheck(L3GD20_REG_RW_INT1_DURATION,
                                       L3GD20_MASK_INT1_DURATION_WAIT,
                                       enabled === true ? L3GD20Dictionaries.TRUE : L3GD20Dictionaries.FALSE,
                                       L3GD20Dictionaries.EnabledMap,
                                       "EnabledMap");
  };

  var isInt1DurationWaitEnabled = function() {
    return L3GD20Dictionaries.TRUE === readFromRegisterWithDictionaryMatch(L3GD20_REG_RW_INT1_DURATION,
                                                                           L3GD20_MASK_INT1_DURATION_WAIT,
                                                                           L3GD20Dictionaries.EnabledMap);
  };

  var setInt1DurationValue = function(value) {
    writeToRegister(L3GD20_REG_RW_INT1_DURATION, L3GD20_MASK_INT1_DURATION_D, value);
  };

  var getInt1DurationValue = function() {
    return readFromRegister(L3GD20_REG_RW_INT1_DURATION, L3GD20_MASK_INT1_DURATION_D);
  };

  var waitfor = function(howMuch) {
    setTimeout(function() {}, howMuch);
    return;
  };
};

exports.L3GD20 = L3GD20; // Made public.
