let i = 0;
let max = 10;   // Nb loops
let delay = 1000; // ms between loops
let completed = false;
let workerID, watcherID;

let performLoop = (clientChannel) => {
    console.log('... Loop # ' + i);
    if (++i < max) {
        workerID = setTimeout(function () {
            performLoop(clientChannel);
        }, delay);  // There is a wait here, just to waste time.
    } else {
        completed = true;
        clientChannel("End of loop, clearing the watcher.");
        clearTimeout(watcherID);
    }
};

let workAndWatch = (worker, timeout, cb) => {
    console.log("Starting Worker");
    // The worker
    setTimeout(function () {
        worker(cb);
    }, 0);
    console.log("Starting Watcher");
    // The watcher
    watcherID = setTimeout(() => {
        if (!completed) {
            cb("Killing the lazy worker.");
            clearTimeout(workerID);
        }
    }, timeout);
    console.log("Watcher & worker started.");
};

let callback = (mess) => {
    console.log(mess);
};

workAndWatch(performLoop, 10000, callback);
console.log(">>> End of Script");
