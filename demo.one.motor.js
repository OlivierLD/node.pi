"use strict";

var MHat = require('./MotorHAT.js');
var utils = require('./utils/utils.js');

var mh = new MHat();
var motor = mh.getMotor(MHat.Motor.M1);

motor.run(MHat.ServoCommand.RELEASE);
