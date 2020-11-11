"use strict";

let display = (val) => {
  console.log(">>> Value is " + val);
};

let firstFunction = () => {

    let external = 0;

    let nestedOne = () => {
      // Increment external by 1
      external += 1;
    };

    let nestedTwo = (callback) => {
      // Increment external by 10
      external += 10;
      if (callback !== undefined) {
        callback(external);
      }
    };

    console.log("Starting...");
    setTimeout(() => {
        console.log("First part on its way");
        nestedOne();
        console.log("After one:" + external);
        setTimeout(() => {
            console.log("Second part on its way");
            nestedTwo(display);
            console.log("After two:" + external);
        }, 2000);
    }, 1000);

    console.log(">>> End of script");
};

firstFunction();
