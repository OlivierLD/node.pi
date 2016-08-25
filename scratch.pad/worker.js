var i = 0;
var max   = 10;   // Nb loops
var delay = 1000; // ms between loops
var completed = false;
var workerID, watcherID;

var performLoop = function(clientChannel)
{
    console.log('... Loop # ' + i);
    if (++i < max)
    {
        workerID = setTimeout(function()
        {
            performLoop(clientChannel);
        }, delay);  // There is a wait here, just to waste time.
    }
    else
    {
        completed = true;
        clientChannel("End of loop, clearing the watcher.");
        clearTimeout(watcherID);
    }
};

var workAndWatch = function(worker, timeout, cb)
{
    console.log("Starting Worker");
    // The worker
    setTimeout(function()
    {
        worker(cb);
    }, 0);
    console.log("Starting Watcher");
    // The watcher
    watcherID = setTimeout(function()
    {
        if (!completed)
        {
            cb("Killing the lazy worker.");
            clearTimeout(workerID);
        }
    }, timeout);
    console.log("Watcher & worker started.");
};
var callback = function(mess)
{
    console.log(mess);
};
workAndWatch(performLoop, 10000, callback);
console.log(">>> End of Script");
