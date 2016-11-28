/*
 * @author Olivier Le Diouris
 */
var spAnalogDisplayColorConfigWhite = {
    bgColor:           'white',
    digitColor:        'black',
    withGradient:      true,
    displayBackgroundGradient: { from: 'LightGrey', to: 'white' },
    withDisplayShadow: true,
    shadowColor:       'rgba(0, 0, 0, 0.75)',
    outlineColor:      'DarkGrey',
    majorTickColor:    'black',
    minorTickColor:    'black',
    valueColor:        'grey',
    valueOutlineColor: 'black',
    valueNbDecimal:    1,
    handColor:         'red', // 'rgba(0, 0, 100, 0.25)',
    handOutlineColor:  'black',
    withHandShadow:    true,
    knobColor:         'DarkGrey',
    knobOutlineColor:  'black',
    font:              'Arial' /* 'Source Code Pro' */
};

var spAnalogDisplayColorConfigBlack = {
    bgColor:           'black',
    digitColor:        'white', // 'cyan',
    withGradient:      true,
    displayBackgroundGradient: { from: 'DarkGrey', to: 'black' },
    shadowColor:       'black',
    outlineColor:      'DarkGrey',
    majorTickColor:    'white',
    minorTickColor:    'white',
    valueColor:        'white',
    valueOutlineColor: 'black',
    valueNbDecimal:    1,
    handColor:         'rgba(255, 0, 0, 0.4)', // 'rgba(0, 0, 100, 0.25)',
    handOutlineColor:  'red', // 'blue',
    withHandShadow:    true,
    knobColor:         '#8ED6FF', // Kind of blue
    knobOutlineColor:  'blue',
    font:              'Arial'
};
var analogDisplayColorConfig = spAnalogDisplayColorConfigBlack; // analogDisplayColorConfigBlack; // White is the default

function SatellitesPlotter(cName,                     // Canvas Name
                           dSize) {                   // Display radius
    var scale = dSize / 100;

    var canvasName = cName;
    var displaySize = dSize;

    var withBorder = true;
    var instance = this;

    var satellites = [];

    (function(){ drawDisplay(canvasName, displaySize); })(); // Invoked automatically

    this.setBorder = function(b) {
        withBorder = b;
    };

    this.repaint = function() {
        drawDisplay(canvasName, displaySize);
    };

    this.setDisplaySize = function(ds) {
        scale = ds / 100;
        displaySize = ds;
        drawDisplay(canvasName, displaySize);
    };

    function getStyleRuleValue(style, selector, sheet) {
        var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
        for (var i = 0, l = sheets.length; i < l; i++) {
            var sheet = sheets[i];
            if (!sheet.cssRules) { continue; }
            for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
                var rule = sheet.cssRules[j];
                if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
                    return rule.style[style];
                }
            }
        }
        return null;
    };

    function drawDisplay(displayCanvasName, displayRadius) {
        
        var schemeColor = getStyleRuleValue('color', '.display-scheme');
        if (schemeColor === 'black')
            analogDisplayColorConfig = analogDisplayColorConfigBlack;
        else if (schemeColor === 'white')
            analogDisplayColorConfig = analogDisplayColorConfigWhite;

        var canvas = document.getElementById(displayCanvasName);
        var center = { x: canvas.width / 2,
                       y: (canvas.height / 2) - 10 };

        var context = canvas.getContext('2d');

        var radius = displayRadius;

        // Cleanup
        //context.fillStyle = "#ffffff";
        context.fillStyle = analogDisplayColorConfig.bgColor;
        //context.fillStyle = "transparent";
        context.fillRect(0, 0, canvas.width, canvas.height);
        //context.fillStyle = 'rgba(255, 255, 255, 0.0)';
        //context.fillRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        if (withBorder === true) {
            context.arc(center.x, radius + 10, radius, 0, (2 * Math.PI), false);
            context.lineWidth = 5;
        }

        if (analogDisplayColorConfig.withGradient) {
            var grd = context.createLinearGradient(0, 5, 0, radius);
            grd.addColorStop(0, analogDisplayColorConfig.displayBackgroundGradient.from);// 0  Beginning
            grd.addColorStop(1, analogDisplayColorConfig.displayBackgroundGradient.to);  // 1  End
            context.fillStyle = grd;
        } else {
            context.fillStyle = analogDisplayColorConfig.displayBackgroundGradient.to;
        }

        if (analogDisplayColorConfig.withDisplayShadow) {
            context.shadowOffsetX = 3;
            context.shadowOffsetY = 3;
            context.shadowBlur  = 3;
            context.shadowColor = analogDisplayColorConfig.shadowColor;
        }
        context.lineJoin    = "round";
        context.fill();
        context.strokeStyle = analogDisplayColorConfig.outlineColor;
        context.stroke();
        context.closePath();

        // Axis: N-S, E-W, NE-SW, NW-SE
        context.lineWidth = 1;
        context.setLineDash([3, 3]); // 3px dash, 3px space
        context.beginPath();
        // N-S
        context.moveTo(center.x, center.y - radius); // N
        context.lineTo(center.x, center.y + radius); // S
        // E-W
        context.moveTo(center.x - radius, center.y); // W
        context.lineTo(center.x + radius, center.y); // E
        // NW-SE
        context.moveTo(center.x - (radius * Math.sin(Math.PI / 4)), center.y - (radius * Math.sin(Math.PI / 4))); // NW
        context.lineTo(center.x + (radius * Math.sin(Math.PI / 4)), center.y + (radius * Math.sin(Math.PI / 4))); // SE
        // NE-SW
        context.moveTo(center.x - (radius * Math.sin(Math.PI / 4)), center.y + (radius * Math.sin(Math.PI / 4))); // NE
        context.lineTo(center.x + (radius * Math.sin(Math.PI / 4)), center.y - (radius * Math.sin(Math.PI / 4))); // SW

        // Altitude circles 30, 60.
        context.moveTo(center.x + (radius / 3), center.y); // 0 degrees is actually E
        context.arc(center.x, center.y, radius / 3, 0, 2 * Math.PI, false); // 60 degrees
        context.arc(center.x, center.y, 2 * radius / 3, 0, 2 * Math.PI, false); // 30 degrees

        context.stroke();
        context.closePath();

        context.setLineDash([0]); // 3px dash, 3px space

        // For dev & demo
        var demoSat = [
            { prn: '29', el: 70, z: 104, snr: 33 },
            { prn: '05', el: 21, z:  45, snr: 29 },
            { prn: '20', el: 74, z:  70, snr: 28 },
            { prn: '13', el: 22, z:  87, snr: 30 },
            { prn: '15', el: 29, z: 122, snr: 22 },
            { prn: '04', el: 17, z:  65, snr: 32 },
            { prn: '18', el: 41, z: 213, snr: 39 },
            { prn: '21', el: 57, z: 299, snr: null },
            { prn: '26', el: 33, z: 295, snr: null },
            { prn: '25', el: 22, z: 190, snr: null },
            { prn: '16', el: 17, z: 320, snr: null },
            { prn: '10', el:  7, z: 217, snr: null } ];

        satellites = demoSat;

        // Plot satellites.
        var SAT_RADIUS = 6;
        if (satellites !== undefined && satellites.length > 0) {
            for (var i=0; i<demoSat.length; i++) {
                context.beginPath();

                context.fillStyle = getSNRColor(satellites[i].snr);
//              var satCircleRadius = radius * (Math.cos(toRadians(demoSat[i].el)));
                var satCircleRadius = radius * ((90 - satellites[i].el) / 90);
                var centerSat = { x: center.x + (satCircleRadius * Math.sin(toRadians(satellites[i].z))),
                    y: center.y  - (satCircleRadius * Math.cos(toRadians(satellites[i].z))) };
                context.arc(centerSat.x, centerSat.y, SAT_RADIUS, 0, 2 * Math.PI, false);

                var text = satellites[i].prn;
                context.font = "bold " + Math.round(scale * 12) + "px " + analogDisplayColorConfig.font; // "bold 40px Arial"
                var metrics = context.measureText(text);
                var len = metrics.width;

                context.fill();
                context.stroke();
                context.fillText(text, centerSat.x - (len / 2), centerSat.y - SAT_RADIUS - 2);

                context.closePath();
            }
        }
    };

    this.setSatellites = function(sat) {
        satellites = sat;
        drawDisplay(canvasName, displaySize);
    };
};

var toDegrees = function(rad) {
    return rad * (180 / Math.PI);
};

var toRadians = function(deg) {
    return deg * (Math.PI / 180);
};

var getSNRColor = function(snr) {
    var c = 'lightGray';
    if (snr !== undefined && snr !== null) {
        if (snr > 0) {
            c = 'red';
        }
        if (snr > 10) {
            c = 'orange';
        }
        if (snr > 20) {
            c = 'yellow';
        }
        if (snr > 30) {
            c = 'lightGreen';
        }
        if (snr > 40) {
            c = 'green';
        }
    }
    return c;
};
