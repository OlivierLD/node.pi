"use strict";

let MHat =  require('./MotorHAT.js');
let utils = require('./utils/utils.js');

let mh = new MHat.MotorHAT();
let motor = mh.getMotor(MHat.Motor.M1);

motor.run(MHat.ServoCommand.RELEASE);
