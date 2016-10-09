"use strict";

var PWM = require('./PWM.js').PWM;
var utils = require('./utils/utils.js');

var Style = {
  SINGLE: 1,
  DOUBLE: 2,
  INTERLEAVE: 3,
  MICROSTEP: 4
};

var Motor = {
  M1: 1,
  M2: 2,
  M3: 3,
  M4: 4
};

var ServoCommand = {
  FORWARD: 1,
  BACKWARD: 2,
  BRAKE: 3,
  RELEASE: 4
};

var HAT_ADDR     = 0x60;
var DEFAULT_FREQ = 1600;

var verbose = true;

var MotorHAT = function(addr, freq) {
  if (addr === undefined) {
    addr = HAT_ADDR;
  }

  var i2c1;
  var motors = [];
  var steppers = [];

  this.init = function() {
    i2c1 = i2c.openSync(1); // Will require a closeSync
    // ...
  };
  this.shutdown = function() {
    i2c1.closeSync();
  };

  this.AdafruitDCMotor = function(controller, motor) {
    var mh = controller;
    this.motorNum = motor;
    var pwm = 0, in1 = 0, in2 = 0;
    var PWMpin = 0, IN1pin = 0, IN2pin = 0;

    if (motor === Motor.M1) {
      pwm = 8;
      in2 = 9;
      in1 = 10;
    } else if (motor === Motor.M2) {
      pwm = 13;
      in2 = 12;
      in1 = 11;
    } else if (motor === Motor.M3) {
      pwm = 2;
      in2 = 3;
      in1 = 4;
    } else if (motor === Motor.M4) {
      pwm = 7;
      in2 = 6;
      in1 = 5;
    } else {
      throw ({ err: "Bad MotorHAT Motor # " + motor });
    }

    PWMpin = pwm;
    IN1pin = in1;
    IN2pin = in2;

    if (verbose) {
        console.log("DCMotor:" + motor +
                   " PWM pin:" + PWMpin +
                  ", IN1 pin:" + IN1pin +
                  ", IN2 pin:" + IN2pin);
    }

    this.run = function(command) {
      if (this.mh === null) {
        return;
      }
      if (command === ServoCommand.FORWARD) {
        mh.setPin(this.IN2pin, 0);
        mh.setPin(this.IN1pin, 1);
      } else if (command === ServoCommand.BACKWARD) {
        mh.setPin(this.IN1pin, 0);
        mh.setPin(this.IN2pin, 1);
      } else if (command === ServoCommand.RELEASE) {
        mh.setPin(this.IN1pin, 0);
        mh.setPin(this.IN2pin, 0);
      }
    };

    this.setSpeed = function(speed) {
      if (speed < 0) {
        speed = 0;
      }
      if (speed > 255) {
        speed = 255;
      }
      mh.pwm.setPWM(this.PWMpin, 0, (speed*16));
    };
  };

  this.AdafruitStepperMotor = function(controller, num, steps) {
    var PORT_M1_M2 = 1; // Port #1
    var PORT_M3_M4 = 2; // Port #2

    var mc;
    var MICROSTEPS = 8;
    var MICROSTEP_CURVE = [0, 50, 98, 142, 180, 212, 236, 250, 255];

    var DEFAULT_NB_STEPS = 200; // between 35 & 200

    var PWMA = 8;
    var AIN2 = 9;
    var AIN1 = 10;
    var PWMB = 13;
    var BIN2 = 12;
    var BIN1 = 11;

    var revSteps;
    var motorNum;
    var secPerStep = 0.1;
    var steppingCounter = 0;
    var currentStep = 0;

    // MICROSTEPS = 16
    // a sinusoidal curve NOT LINEAR!
    // MICROSTEP_CURVE = [0, 25, 50, 74, 98, 120, 141, 162, 180, 197, 212, 225, 236, 244, 250, 253, 255]

    mc = controller;
    revSteps = (steps === undefined ? DEFAULT_NB_STEPS : steps);
    motorNum = num;
    secPerStep = 0.1;
    steppingCounter = 0;
    currentStep = 0;

    if ((num - 1) === 0) {
      PWMA =  8;
      AIN2 =  9;
      AIN1 = 10;
      PWMB = 13;
      BIN2 = 12;
      BIN1 = 11;
    } else if ((num - 1) === 1) {
      PWMA = 2;
      AIN2 = 3;
      AIN1 = 4;
      PWMB = 7;
      BIN2 = 6;
      BIN1 = 5;
    } else {
      throw({ err: "MotorHAT Stepper must be between 1 and 2 inclusive" });
    }

    this.setSpeed = function(rpm) {
      secPerStep = 60.0 / (this.revSteps * rpm);
      steppingCounter = 0;
    };

    this.oneStep = function(dir, style) {
      var pwmA = 255,
          pwmB = 255;

      // first determine what sort of stepping procedure we're up to
      if (style === Style.SINGLE) {
        if ((this.currentStep /(this.MICROSTEPS/2)) % 2 === 1) {
          // we're at an odd step, weird
          if (dir === ServoCommand.FORWARD) {
            this.currentStep += this.MICROSTEPS / 2;
          } else {
            this.currentStep -= this.MICROSTEPS / 2;
          }
        }
      } else {
        // go to next even step
        if (dir === ServoCommand.FORWARD) {
          this.currentStep += this.MICROSTEPS;
        } else {
          this.currentStep -= this.MICROSTEPS;
        }
      }
      if (style === Style.DOUBLE) {
        if (this.currentStep /(this.MICROSTEPS/2) % 2 == 0) {
          // we're at an even step, weird
          if (dir == ServoCommand.FORWARD)
            this.currentStep += this.MICROSTEPS/2;
          else
            this.currentStep -= this.MICROSTEPS/2;
        } else {
          // go to next odd step
          if (dir == ServoCommand.FORWARD)
            this.currentStep += this.MICROSTEPS;
          else
            this.currentStep -= this.MICROSTEPS;
        }
      }
      if (style === Style.INTERLEAVE) {
        if (dir == ServoCommand.FORWARD)
          this.currentStep += this.MICROSTEPS/2;
        else
          this.currentStep -= this.MICROSTEPS/2;
      }
      if (style === Style.MICROSTEP) {
        if (dir == ServoCommand.FORWARD)
          this.currentStep += 1;
        else
          this.currentStep -= 1;
      }
      // go to next 'step' and wrap around
      this.currentStep += this.MICROSTEPS * 4;
      this.currentStep %= this.MICROSTEPS * 4;

      pwmA = 0;
      pwmB = 0;
      if (this.currentStep >= 0 && this.currentStep < this.MICROSTEPS) {
        pwmA = this.MICROSTEP_CURVE[this.MICROSTEPS - this.currentStep];
        pwmB = this.MICROSTEP_CURVE[this.currentStep];
      } else if (this.currentStep >= this.MICROSTEPS && this.currentStep < this.MICROSTEPS*2) {
        pwmA = this.MICROSTEP_CURVE[this.currentStep - this.MICROSTEPS];
        pwmB = this.MICROSTEP_CURVE[this.MICROSTEPS*2 - this.currentStep];
      } else if (this.currentStep >= this.MICROSTEPS*2 && this.currentStep < this.MICROSTEPS*3) {
        pwmA = this.MICROSTEP_CURVE[this.MICROSTEPS*3 - this.currentStep];
        pwmB = this.MICROSTEP_CURVE[this.currentStep - this.MICROSTEPS*2];
      } else if (this.currentStep >= this.MICROSTEPS*3 && this.currentStep < this.MICROSTEPS*4) {
        pwmA = this.MICROSTEP_CURVE[this.currentStep - this.MICROSTEPS*3];
        pwmB = this.MICROSTEP_CURVE[this.MICROSTEPS*4 - this.currentStep];
      }

      // go to next 'step' and wrap around
      this.currentStep += this.MICROSTEPS * 4;
      this.currentStep %= this.MICROSTEPS * 4;

      // only really used for microstepping, otherwise always on!
      this.mc.pwm.setPWM(this.PWMA, 0, (pwmA*16));
      this.mc.pwm.setPWM(this.PWMB, 0, (pwmB*16));

      // set up coil energizing!
      var coils = [0, 0, 0, 0];

      if (style === Style.MICROSTEP) {
        if (this.currentStep >= 0 && this.currentStep < this.MICROSTEPS)
          coils = [1, 1, 0, 0];
        else if (this.currentStep >= this.MICROSTEPS && this.currentStep < this.MICROSTEPS*2)
          coils = [0, 1, 1, 0];
        else if (this.currentStep >= this.MICROSTEPS*2 && this.currentStep < this.MICROSTEPS*3)
          coils = [0, 0, 1, 1];
        else if (this.currentStep >= this.MICROSTEPS*3 && this.currentStep < this.MICROSTEPS*4)
          coils = [1, 0, 0, 1];
      } else {
        var step2coils = [[1, 0, 0, 0],
                          [1, 1, 0, 0],
                          [0, 1, 0, 0],
                          [0, 1, 1, 0],
                          [0, 0, 1, 0],
                          [0, 0, 1, 1],
                          [0, 0, 0, 1],
                          [1, 0, 0, 1]];
        coils = step2coils[this.currentStep / (this.MICROSTEPS / 2)];
      }
      // print "coils state = " + str(coils)
      this.mc.setPin(this.AIN2, coils[0]);
      this.mc.setPin(this.BIN1, coils[1]);
      this.mc.setPin(this.AIN1, coils[2]);
      this.mc.setPin(this.BIN2, coils[3]);

      return this.currentStep;
    };

    this.step = function(steps, direction, stepStyle) {
      var sPerS = this.secPerStep;
      var latestStep = 0;

      if (stepStyle === Style.INTERLEAVE) {
        sPerS = sPerS / 2.0;
      }
      if (stepStyle == Style.MICROSTEP) {
        sPerS /= this.MICROSTEPS;
        steps *= this.MICROSTEPS;
      }
      console.log(sPerS + " sec per step");

      for (var s=0; s<steps; s++) {
        latestStep = this.oneStep(direction, stepStyle);
        utils.sleep((sPerS * 1000));
      }
      if (stepStyle === Style.MICROSTEP) {
        // this is an edge case, if we are in between full steps, lets just keep going
        // so we end on a full step
        while (latestStep != 0 && latestStep != this.MICROSTEPS) {
          latestStep = this.oneStep(direction, stepStyle);
          utils.sleep((sPerS * 1000));
        }
      }
    };
  };

  if (freq === undefined) {
    freq = DEFAULT_FREQ;
  }

  for (var motor in Motor) {
    motors.push(new this.AdafruitDCMotor(this, Motor[motor]));
  }
  steppers.push(new this.AdafruitStepperMotor(this, 1));
  steppers.push(new this.AdafruitStepperMotor(this, 2));
  if (verbose) {
    console.log("MotorHat: Creating PWM", utils.hexFmt(addr, 2));
  }
  var pwm = new PWM(addr);
  pwm.init();
  try {
    pwm.setPWMFreq(freq);
  } catch (ioe) {
    console.log(ioe);
  }

  this.setPin = function(pin, value) {
    if (pin < 0 || pin > 15) {
      throw ({ err: "PWM pin must be between 0 and 15 inclusive : " + pin });
    }
    if (value != 0 && value != 1) {
      throw ({ err: "Pin value must be 0 or 1! " + value });
    }
    if (value === 0) {
      pwm.setPWM(pin, 0, 4096);
    }
    if (value === 1) {
      pwm.setPWM(pin, 4096, 0);
    }
  };

  this.getStepper = function(num) {
    if (num < 1 || num > 2) {
      throw ({ err: "MotorHAT Stepper must be between 1 and 2 inclusive" });
    }
    return steppers[num-1];
  };

  this.getMotor = function(mn) {
    if (verbose) {
      console.log("getMotor required:", mn);
    }
    var motor = null;
    for (var m in motors) {
      console.log(">>> Comparing ", motors[m].motorNum, " and ", mn);
      if (motors[m].motorNum === mn) {
        motor = motors[m];
        if (verbose) {
          console.log("getMotor (DC):" + mn);
        }
        break;
      }
    }
    return motor;
  };
};

exports.Style = Style;
exports.Motor = Motor;
exports.ServoCommand = ServoCommand;
exports.MotorHAT = MotorHAT;
