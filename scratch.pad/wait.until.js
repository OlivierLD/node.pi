"use strict";

var flag = false;

var checkFlag = function() {
  if (flag === false) {
     setTimeout(checkFlag, 100); /* this checks the flag every 100 milliseconds*/
  } else {
    console.log("Done!!");
  }
};

checkFlag();

setTimeout(function() {
  flag = true;
},
5000);

console.log('Let it work...');
