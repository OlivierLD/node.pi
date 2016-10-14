/**
 *  An un-determinate progress bar
 * @author Olivier Le Diouris
 */
"use strict";

function AtomicProgressBar(cName, w, h) {
    this. width = w;
    this.height = h;

    if (this.width === undefined)
        this.width = 100;
    if (this.height === undefined)
        this.height = 20;
    var canvasName = cName;

    var running = false;
    var intervalID;

    var instance = this;

//try { console.log('in the Thermometer constructor for ' + cName + " (" + dSize + ")"); } catch (e) {}

    (function () {
        draw(canvasName);
    })(); // Invoked automatically

    this.startStop = function () {
        running = !running;
        if (running)
            this.animate();
        else {
            window.clearInterval(intervalID);
            draw(canvasName);
        }
    };

    this.animate = function () {
        intervalID = window.setInterval(function () {
            buzz();
        }, 50);
    };

    var buzz = function () {
        var bars = [];
        for (var i = 0; i < 50; i++) {
            var val = (instance.width * Math.random()).toFixed(0);
            bars.push(val);
        }
        draw(canvasName, bars);
    };

    function draw(displayCanvasName, bars) {

        var canvas = document.getElementById(displayCanvasName);
        var context = canvas.getContext('2d');

        // Cleanup
        //context.fillStyle = "#ffffff";
        context.fillStyle = 'back';
        //context.fillStyle = "transparent";
        context.fillRect(0, 0, canvas.width, canvas.height);
        //context.fillStyle = 'rgba(255, 255, 255, 0.0)';
        //context.fillRect(0, 0, canvas.width, canvas.height);

        if (bars !== undefined) {
            context.beginPath();
            for (var i = 0; i < bars.length; i++) {
                var x = bars[i];
                context.moveTo(x, 0);
                context.lineTo(x, instance.height);
            }
            context.lineWidth = 1;
            context.strokeStyle = 'lightgreen';
            context.stroke();
            context.closePath();
        }
    };
};
