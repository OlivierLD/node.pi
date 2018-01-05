var Promise = function () {
	var UNFULFILLED = "unfulfilled";
	var REJECTED = "rejected";
	var RESOLVED = "resolved";

	var state = {promisestate: UNFULFILLED};
	var onSuccess;
	var onFailure;

	this.then = function (onResolved, onRejected) {
		console.log(state);
		onSuccess = onResolved;
		onFailure = onRejected;
	};

	this.resolve = function (value) {
		state = {promisestate: RESOLVED};
		console.log(state);
		onSuccess(value);
	};

	this.reject = function (error) {
		state = {promisestate: REJECTED};
		console.log(state);
		onFailure(error);
	};
};

var AsyncTask = function (sometime) {
	var i = 0;    // Loop counter
	var max = 5;    // Max nb loops
	var delay = 1000; // ms between loops
	var completed = false;
	var workerID, watcherID;

	var instance = this;
	this.performLoop = function (promise) {
		console.log('... Loop # ' + (i + 1));
		if (++i < max) {
			workerID = setTimeout(function () {
				instance.performLoop(promise);
			}, delay);  // There is a wait here, just to waste time.
		}
		else {
			completed = true;  // Sucessful completion
			clearTimeout(watcherID);
			promise.resolve("End of loop (worker completed), clearing the watcher.");
		}
	};

	var timeout = sometime;
	// The promise
	this.workAndWatch = function (worker) {
		var promise = new Promise();
		console.log("Starting Worker");
		// The worker
		setTimeout(function () {
			worker(promise);
		}, 0);
		console.log("Starting Watcher");
		// The watcher
		watcherID = setTimeout(function () {
			if (!completed) // Failure to complete in time.
			{
				clearTimeout(workerID);
				promise.reject("Timeout expired, but job is not completed. Killing the lazy worker.");
			}
		}, timeout);
		console.log("Watcher & worker started.");
		return promise;
	};
};

var handleError = function (error) {
	console.log("Error:" + error);
};

var resolution = function (data) {
	console.log("Success:" + data);
};

console.log("Get ready...");
var timeout = 60000;
var asyncTask = new AsyncTask(timeout);
console.log("Timeout set to " + timeout + " ms");
console.log("--------------------------");
asyncTask.workAndWatch(asyncTask.performLoop).then(resolution, handleError);
console.log("EndOfScript.");

