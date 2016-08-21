"use strict";

var flag = false;

var checkFlag = function() {
  if (flag === false) {
     setTimeout(checkFlag, 10); /* this checks the flag every 100 milliseconds*/
  } else {
    console.log("Done!!");
  }
};

console.log("Will check flag for 5s.")
checkFlag();

setTimeout(function() {
  flag = true;
  console.log("Flag is set");
},
5000);

var sleep = function(milliseconds) {
  var start = new Date().getTime();
//for (var i=0; i<1e7; i++) {
  while (true) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
};

console.log('Waiting 2s...');
sleep(2000);
console.log('Let it work (2s expired)...');
