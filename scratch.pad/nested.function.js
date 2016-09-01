"use strict";

var display = function(val) {
  console.log(">>> Value is " + val);
};

var firstFunction = function() {

    var external = 0;

    var nestedOne = function() {
      // Increment external by 1
      external += 1;
    };

    var nestedTwo = function(callback) {
      // Increment external by 10
      external += 10;
      if (callback !== undefined) {
        callback(external);
      }
    };

    console.log("Starting...");
    setTimeout(function() {
        console.log("First part on its way");
        nestedOne();
        console.log("After one:" + external);
        setTimeout(function() {
            console.log("Second part on its way");
            nestedTwo(display);
            console.log("After two:" + external);
        }, 2000);
    }, 1000);

    console.log(">>> End of script");
};

firstFunction();
