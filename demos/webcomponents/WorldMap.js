const worldMapVerbose = false;
const WORLD_MAP_TAG_NAME = 'world-map';

const mapProjections = {
	anaximandre: {
		type: "ANAXIMANDRE"
	},
	mercator: {
		type: "MERCATOR"
	},
	globe: {
		type: "GLOBE"
	}
};
const tropicLat = 23.43698;

const worldMapDefaultColorConfig = {
	canvasBackground: "rgba(0, 0, 100, 1.0)", // TODO Remove this?
	defaultPlotPointColor: "red",
	travelColor: "gray",
	arrowBodyColor: 'rgba(255, 255, 255, 0.5)',
	globeBackground: "black",
	globeGradient: {
		from: "navy",
		to: "blue",
	},
	gridColor: 'rgba(0, 255, 255, 0.3)',
	tropicColor: 'LightGray',
	chartColor: 'cyan',
	chartLineWidth: 1,
	userPosColor: 'red',
	sunColor: 'yellow',
	sunArrowColor: 'rgba(255, 255, 0, 0.5)',
	moonColor: 'white',
	moonArrowColor: 'rgba(255, 255, 255, 0.5)',
	ariesColor: 'LightGray',
	venusColor: "orange",
	marsColor: "red",
	jupiterColor: "LightPink",
	saturnColor: "LightYellow",
	starsColor: "white",
	nightColor: 'rgba(192, 192, 192, 0.3)',
	displayPositionColor: 'white'
};

/* The map data */
import fullWorldMap from "./world.map/worldmap.data.js";
// import fullWorldMap from "./world.map/worldmap.data"; // minifyJs does NOT like the .js extension

// TODO Callbacks (before and after drawing)

/* global HTMLElement */
class WorldMap extends HTMLElement {

	static get observedAttributes() {
		return [
			"width",                  // Integer. Canvas width
			"height",                 // Integer. Canvas height

			"east",                   // Float. East longitude of the map (Default 180 for globe)
			"west",                   // Float. West longitude of the map (Default -180 for globe)
			"north",                  // Float. North latitude of the map (Default 90 for globe)
			"south",                  // Float. South latitude of the map (Default -90 for globe)

			"projection",             // ANAXIMANDRE|MERCATOR|GLOBE. Default GLOBE

			"transparent-globe",      // Boolean, default false

			"with-grid",              // Boolean. Default true
			"with-sun",               // Boolean. Default true
			"with-moon",              // Boolean. Default true
			"with-sunlight",          // Boolean. Default false
			"with-moonlight",         // Boolean. Default false
			"with-wandering-bodies",  // Boolean. Default false
			"with-stars",             // Boolean. Default false
			"with-tropics",           // Boolean. Default false

			"position-label"          // String
		];
	}

	dummyDump() {
		let minLat = 100, maxLat = -100, minLng = 200, maxLng = -200;

		for (let key in fullWorldMap) {
			console.log("Key [%s]", key);
			let top = fullWorldMap[key];
			for (let sectionK in top) {
				console.log(">> Key [%s]", sectionK);
				let section = top[sectionK];
				for (let key3 in section) {
					console.log(">> >> Key [%s], type %s", key3, typeof(section[key3]));
					if (section[key3].point !== undefined) {
						console.log("An array of %d points", section[key3].point.length);
						for (let p=0; p<section[key3].point.length; p++) {
							minLat = Math.min(minLat, parseFloat(section[key3].point[p].Lat));
							maxLat = Math.max(maxLat, parseFloat(section[key3].point[p].Lat));
							minLng = Math.min(minLng, parseFloat(section[key3].point[p].Lng));
							maxLng = Math.max(maxLng, parseFloat(section[key3].point[p].Lng));
						}
					}
				}
			}
		}
		console.log('Done. Lat in [%f, %f], Lng in [%f, %f]', minLat, maxLat, minLng, maxLng);
	}

	constructor() {
		super();
		this._shadowRoot = this.attachShadow({mode: 'open'}); // 'open' means it is accessible from external JavaScript.
		// create and append a <canvas>
		this.canvas = document.createElement("canvas");
		this.shadowRoot.appendChild(this.canvas);

		// For tests of the import
		// this.dummyDump();

		// Default values
		this._width       = 500;
		this._height      = 500;

		this._east        =  180;
		this._west        = -180;
		this._north       =   90;
		this._south       =  -90;

		this._projection  = mapProjections.globe;
		this._transparent_globe = false;

		this._with_grid             = true;
		this._with_sun              = true;
		this._with_moon             = true;
		this._with_sunlight         = false;
		this._with_moonlight        = false;
		this._with_wandering_bodies = false;
		this._with_stars            = false;
		this._with_tropics          = false;

		this._position_label        = "";

		this.globeViewRightLeftRotation = -tropicLat; // Tilt
		this.globeViewForeAftRotation = 0; // Observer's latitude
		this.globeViewLngOffset = 0;       // Observer's longitude

		this.userPosition = {};
		this.astronomicalData = {};
		this.defaultRadiusRatio = 0.6;

		this.vGrid = 5;
		this.hGrid = 5;

		this.globeViewOffset_X = 0;
		this.globeViewOffset_Y = 0;
		this.globeView_ratio   = 1;

		this._previousClassName = "";
		this.worldmapColorConfig = worldMapDefaultColorConfig;

		this.doBefore = undefined; // Callback, before drawing. Takes 'this' and the context as parameter.
		this.doAfter = undefined;  // Callback, after drawing. Takes 'this' and the context as parameter.

		if (worldMapVerbose) {
			console.log("Done with the Constructor");
		}
	}

	// Called whenever the custom element is inserted into the DOM.
	connectedCallback() {
		if (worldMapVerbose) {
			console.log("connectedCallback invoked");
		}
	}

	// Called whenever the custom element is removed from the DOM.
	disconnectedCallback() {
		if (worldMapVerbose) {
			console.log("disconnectedCallback invoked");
		}
	}

	// Called whenever an attribute is added, removed or updated.
	// Only attributes listed in the observedAttributes property are affected.
	attributeChangedCallback(attrName, oldVal, newVal) {
		if (worldMapVerbose) {
			console.log("attributeChangedCallback invoked on " + attrName + " from " + oldVal + " to " + newVal);
		}
		switch (attrName) {
			case "width":
				this._width = parseInt(newVal);
				break;
			case "height":
				this._height = parseInt(newVal);
				break;
			case "east":
				this._east = parseFloat(newVal);
				break;
			case "west":
				this._west = parseFloat(newVal);
				break;
			case "north":
				this._north = parseFloat(newVal);
				break;
			case "south":
				this._south = parseFloat(newVal);
				break;
			case "projection":
				switch (newVal) {
					case 'ANAXIMANDRE':
						this._projection  = mapProjections.anaximandre;
						break;
					case 'MERCATOR':
						this._projection  = mapProjections.mercator;
						break;
					case 'GLOBE':
					default:
						this._projection  = mapProjections.globe;
						break;
				}
				break;
			case "transparent-globe":
				this._transparent_globe = ('true' === newVal);
				break;
			case "with-grid":
				this._with_grid = ('true' === newVal);
				break;
			case "with-sun":
				this._with_sun = ('true' === newVal);
				break;
			case "with-moon":
				this._with_moon = ('true' === newVal);
				break;
			case "with-sunlight":
				this._with_sunlight = ('true' === newVal);
				break;
			case "with-moonlight":
				this._with_moonlight = ('true' === newVal);
				break;
			case "with-wandering-bodies":
				this._with_wandering_bodies = ('true' === newVal);
				break;
			case "with-stars":
				this._with_stars = ('true' === newVal);
				break;
			case "with-tropics":
				this._with_tropics = ('true' === newVal);
				break;
			case "position-label":
				this._position_label = newVal;
				break;
			default:
				break;
		}
		this.repaint();
	}

	// Called whenever the custom element has been moved into a new document.
	adoptedCallback() {
		if (worldMapVerbose) {
			console.log("adoptedCallback invoked");
		}
	}

	set width(val) {
		this.setAttribute("width", val);
	}
	set height(val) {
		this.setAttribute("height", val);
	}
	set east(val) {
		this.setAttribute("east", val);
	}
	set west(val) {
		this.setAttribute("west", val);
	}
	set north(val) {
		this.setAttribute("north", val);
	}
	set south(val) {
		this.setAttribute("south", val);
	}
	set projection(val) {
		this.setAttribute("projection", val);
	}
	set transparentGlobe(val) {
		this.setAttribute("transparent-globe", val);
	}
	set withGrid(val) {
		this.setAttribute("with-grid", val);
	}
	set withSun(val) {
		this.setAttribute("with-sun", val);
	}
	set withMoon(val) {
		this.setAttribute("with-moon", val);
	}
	set withSunlight(val) {
		this.setAttribute("with-sunlight", val);
	}
	set withMoonlight(val) {
		this.setAttribute("with-moonlight", val);
	}
	set withWanderingBodies(val) {
		this.setAttribute("with-wandering-bodies", val);
	}
	set withStars(val) {
		this.setAttribute("with-stars", val);
	}
	set withTropics(val) {
		this.setAttribute("with-tropics", val);
	}
	set positionLabel(val) {
		this.setAttribute("position-label", val);
	}

	set shadowRoot(val) {
		this._shadowRoot = val;
	}

	get width() {
		return this._width;
	}
	get height() {
		return this._height;
	}
	get north() {
		return this._north;
	}
	get south() {
		return this._south;
	}
	get east() {
		return this._east;
	}
	get west() {
		return this._west;
	}
	get projection() {
		return this._projection;
	}
	get transparentGlobe() {
		return this._transparent_globe;
	}
	get withGrid() {
		return this._with_grid;
	}
	get withSun() {
		return this._with_sun;
	}
	get withMoon() {
		return this._with_moon;
	}
	get withSunlight() {
		return this._with_sunlight;
	}
	get withMoonlight() {
		return this._with_moonlight;
	}
	get withWanderingBodies() {
		return this._with_wandering_bodies;
	}
	get withStars() {
		return this._with_stars;
	}
	get withTropics() {
		return this._with_tropics;
	}
	get positionLabel() {
		return this._position_label;
	}

	get shadowRoot() {
		return this._shadowRoot;
	}

	/*
	 * Component methods
	 */
	toRadians(deg) {
		return deg * (Math.PI / 180);
	}

	toDegrees(rad) {
		return rad * (180 / Math.PI);
	}

	setDoBefore(func) {
		this.doBefore = func;
	}
	setDoAfter(func) {
		this.doAfter = func;
	}

	setUserPosition(pos) {
		this.userPosition = pos;
		this.globeViewLngOffset = pos.longitude;
		this.globeViewForeAftRotation = pos.latitude;
	}

	setUserLatitude(val) {
		this.globeViewForeAftRotation = val;
		this.userPosition.latitude = val;
	}

	/**
	 * Angles in degrees
	 * @param data like { D: declination, GHA: hourAngle }
	 */
	setSunPosition(data) {
		this.astronomicalData.sun = data;
	}

	/**
	 * Angles in degrees
	 * @param data like { D: declination, GHA: hourAngle }
	 */
	setMoonPosition(data) {
		this.astronomicalData.moon = data;
	}

	/**
	 * Can be obtained from a resource like "/astro/positions-in-the-sky?at=2018-02-26T00:49:06&fromL=37.7489&fromG=-122.507"
	 *
	 * Angles in degrees
	 * @param data like described above
	 */
	setAstronomicalData(data) {
		this.astronomicalData = data;
//	console.log("Received", data);
		try {
			let at = new Date(data.epoch);
//		console.log("At", at.format("Y-M-d H:i:s"));
		} catch (err) {
			console.log(err);
		}
		if (data.sun !== undefined) {
			// set .setGlobeViewRightLeftRotation(-(sunD * Math.sin(Math.toRadians(lhaSun))));
			if (this.userPosition !== {}) {
				let lhaSun = data.sun.gha + this.userPosition.longitude;
				while (lhaSun > 360) { lhaSun -= 360; }
				while (lhaSun < 0) { lhaSun += 360; }
				this.globeViewRightLeftRotation = -(data.sun.decl * Math.sin(this.toRadians(lhaSun)));
//			console.log("Tilt is now", globeViewRightLeftRotation);
			}
		}
	}

	/**
	 * Used to draw a globe
	 * alpha, then beta
	 *
	 * @param lat in radians
	 * @param lng in radians
	 * @return x, y, z. Cartesian coordinates.
	 */
	rotateBothWays(lat, lng) {
		let x = Math.cos(lat) * Math.sin(lng);
		let y = Math.sin(lat);
		let z = Math.cos(lat) * Math.cos(lng);

		let alfa = this.toRadians(this.globeViewRightLeftRotation); // in plan (x, y), z unchanged, earth inclination on its axis
		let beta = this.toRadians(this.globeViewForeAftRotation);   // in plan (y, z), x unchanged, latitude of the eye
		/*
		 * x is the x of the screen
		 * y is the y of the screen
		 * z goes through the screen
		 *
		 *                      |  cos a -sin a  0 |  a > 0 : counter-clockwise
		 * Rotation plan x, y:  |  sin a  cos a  0 |
		 *                      |    0     0     1 |
		 *
		 *                      | 1    0      0    |  b > 0 : towards user
		 * Rotation plan y, z:  | 0  cos b  -sin b |
		 *                      | 0  sin b   cos b |
		 *
		 *  | x |   | cos a -sin a  0 |   | 1   0      0    |   | x |   |  cos a  (-sin a * cos b) (sin a * sin b) |
		 *  | y | * | sin a  cos a  0 | * | 0  cos b -sin b | = | y | * |  sin a  (cos a * cos b) (-cos a * sin b) |
		 *  | z |   |  0      0     1 |   | 0  sin b  cos b |   | z |   |   0          sin b           cos b       |
		 */

		// All in once
		let _x = (x * Math.cos(alfa)) - (y * Math.sin(alfa) * Math.cos(beta)) + (z * Math.sin(alfa) * Math.sin(beta));
		let _y = (x * Math.sin(alfa)) + (y * Math.cos(alfa) * Math.cos(beta)) - (z * Math.cos(alfa) * Math.sin(beta));
		let _z = (y * Math.sin(beta)) + (z * Math.cos(beta));

		return {x: _x, y: _y, z: _z};
	}

	setZoomRatio(zr) {
		this.defaultRadiusRatio = Math.min(zr, 1);
	}
	getZoomRatio() {
		return this.defaultRadiusRatio;
	}
	resetZoomRatio() {
		this.defaultRadiusRatio = 0.6;
	}

	/**
	 *
	 * rotate.x Canvas abscissa
	 * rotate.y Canvas ordinate
	 * rotate.z -: behind the canvas, +: in front of the canvas
	 *
	 * @param lat in radians
	 * @param lng in radians
	 * @returns {boolean}
	 */
	isBehind(lat, lng) {
		let rotated = this.rotateBothWays(lat, lng);
		return (rotated.z < 0.0);
	}

	adjustBoundaries() {
		if (Math.sign(this.east) !== Math.sign(this.west) && Math.sign(this.east) === -1) {
			this.west -= 360;
		}
	}

	findInList(array, member, value) {
		for (let idx=0; idx<array.length; idx++) {
			if (array[idx][member] !== undefined && array[idx][member] === value) {
				return array[idx];
			}
		}
		return null;
	}

	drawEcliptic(context, ariesGHA, obl) {
		let longitude = (ariesGHA < 180) ? -ariesGHA : 360 - ariesGHA;
		longitude += 90; // Extremum
		while (longitude > 360) {
			longitude -= 360;
		}
		let aries = { lat: this.toRadians(obl), lng: this.toRadians(longitude) };
		let eclCenter = this.deadReckoning(aries, 90 * 60, 0); // "Center" of the Ecliptic

		context.fillStyle = this.worldmapColorConfig.tropicColor;
		for (let hdg=0; hdg<360; hdg++) {
			let pt = this.deadReckoning(eclCenter, 90 * 60, hdg);
			let pp = this.getPanelPoint(this.toDegrees(pt.lat), this.toDegrees(pt.lng));

			let thisPointIsBehind = this.isBehind(pt.lat, pt.lng - this.toRadians(this.globeViewLngOffset));

			if (this.transparentGlobe || !thisPointIsBehind) {
				context.fillRect(pp.x, pp.y, 1, 1);
			}
		}
	}

	/**
	 * Get the direction
	 *
	 * @param x horizontal displacement
	 * @param y vertical displacement
	 * @return the angle, in degrees
	 */
	getDir(x, y) {
		let dir = 0.0;
		if (y !== 0) {
			dir = this.toDegrees(Math.atan(x / y));
		}
		if (x <= 0 || y <= 0) {
			if (x > 0 && y < 0) {
				dir += 180;
			} else if (x < 0 && y > 0) {
				dir += 360;
			} else if (x < 0 && y < 0) {
				dir += 180;
			} else if (x === 0) {
				if (y > 0) {
					dir = 0.0;
				} else {
					dir = 180;
				}
			} else if (y === 0) {
				if (x > 0) {
					dir = 90;
				} else {
					dir = 270;
				}
			}
		}
		while (dir >= 360) { dir -= 360; }
		return dir;
	}

	decToSex(val, ns_ew) {
		let absVal = Math.abs(val);
		let intValue = Math.floor(absVal);
		let dec = absVal - intValue;
		let i = intValue;
		dec *= 60;
//    var s = i + "°" + dec.toFixed(2) + "'";
//    var s = i + String.fromCharCode(176) + dec.toFixed(2) + "'";
		let s = "";
		if (ns_ew !== undefined) {
			if (val < 0) {
				s += (ns_ew === 'NS' ? 'S' : 'W');
			} else {
				s += (ns_ew === 'NS' ? 'N' : 'E');
			}
			s += " ";
		} else {
			if (val < 0) {
				s += '-'
			}
		}
		s += i + "°" + dec.toFixed(2) + "'";

		return s;
	}

	/**
	 *
	 * @param from GeoPoint, L & G in Radians
	 * @param dist distance in nm
	 * @param route route in degrees
	 * @return DR Position, L & G in Radians
	 */
	deadReckoning(from, dist, route) {
		let radianDistance = this.toRadians(dist / 60);
		let finalLat = (Math.asin((Math.sin(from.lat) * Math.cos(radianDistance)) +
				(Math.cos(from.lat) * Math.sin(radianDistance) * Math.cos(this.toRadians(route)))));
		let finalLng = from.lng + Math.atan2(Math.sin(this.toRadians(route)) * Math.sin(radianDistance) * Math.cos(from.lat),
				Math.cos(radianDistance) - Math.sin(from.lat) * Math.sin(finalLat));
		return ({lat: finalLat, lng: finalLng});
	}

	drawNight(context, from, user, gha) {
		const NINETY_DEGREES = 90 * 60; // in nm

		let firstVisible = -1;
		const VISIBLE = 1;
		const INVISIBLE = 2;
		let visibility = 0;

		// context.lineWidth = 1;
		context.fillStyle = this.worldmapColorConfig.nightColor;

		// find first visible point of the night limb
		for (let i=0; i<360; i++) {
			let night = this.deadReckoning(from, NINETY_DEGREES, i);
			let visible = this.isBehind(night.lat, night.lng - this.toRadians(this.globeViewLngOffset)) ? INVISIBLE : VISIBLE;
			if (visible === VISIBLE && visibility === INVISIBLE) { // Just became visible
				firstVisible = i;
				break;
			}
			visibility = visible;
		}

		context.beginPath();
		// Night limb
		let firstPt, lastPt;
		for (let dir=firstVisible; dir<firstVisible+360; dir++) {
			let dr = this.deadReckoning(from, NINETY_DEGREES, dir);
			let borderPt = this.getPanelPoint(this.toDegrees(dr.lat), this.toDegrees(dr.lng));
			if (dir === firstVisible) {
				context.moveTo(borderPt.x, borderPt.y);
				firstPt = borderPt;
			} else {
				if (!this.isBehind(dr.lat, dr.lng - this.toRadians(this.globeViewLngOffset))) {
					lastPt = borderPt;
					context.lineTo(borderPt.x, borderPt.y);
				}
			}
		}
		// Earth limb
		let center = { x: this.width / 2, y: this.height / 2};
		let startAngle = this.getDir(lastPt.x - center.x, center.y - lastPt.y);
		let arrivalAngle = this.getDir(firstPt.x - center.x, center.y - firstPt.y);

		let lhaSun = gha + user.longitude;
		while (lhaSun < 0) { lhaSun += 360; }
		while (lhaSun > 360) { lhaSun -= 360; }

		let clockwise = true;  // From the bottom
		if (lhaSun < 90 || lhaSun > 270) {  // Observer in the light
			clockwise = (lhaSun > 270);
		} else {                            // Observer in the dark
			clockwise = (lhaSun > 180);
		}
		if ((startAngle > 270 || startAngle < 90) && arrivalAngle > 90 && arrivalAngle < 270) {
			clockwise = !clockwise;
		}

		let inc = 1; // Clockwise
		let firstBoundary, lastBoundary;

		if (clockwise) {
			firstBoundary = Math.floor(startAngle);
			lastBoundary = Math.ceil(arrivalAngle);
			while (lastBoundary < firstBoundary) {
				lastBoundary += 360;
			}
		} else {
			inc = -1;
			firstBoundary = Math.ceil(startAngle);
			lastBoundary = Math.floor(arrivalAngle);
			while (lastBoundary > firstBoundary) {
				firstBoundary += 360;
			}
		}

		let userPos = { lat: this.toRadians(user.latitude), lng: this.toRadians(user.longitude) };
		for (let i=firstBoundary; (inc>0 && i<=lastBoundary) || (inc<0 && i>=lastBoundary); i+=inc) {
			let limb = this.deadReckoning(userPos, NINETY_DEGREES, i);
			let limbPt = this.getPanelPoint(this.toDegrees(limb.lat), this.toDegrees(limb.lng));
			context.lineTo(limbPt.x, limbPt.y);
		}
		context.closePath();
		context.fill();
	}

	/**
	 * For the Globe projection
	 *
	 * @param lat in degrees
	 * @param lng in degrees
	 */
	getPanelPoint(lat, lng) {
		let pt = {};
		this.adjustBoundaries();
		if (this.north !== this.south && this.east !== this.west) {
			let gAmpl = this.east - this.west;
			while (gAmpl < 0) {
				gAmpl += 360;
			}
			let graph2chartRatio = this.width / gAmpl;
			var _lng = lng;
			if (Math.abs(this.west) > 180 && Math.sign(_lng) !== Math.sign(this.west) && Math.sign(this.lng) > 0) {
				_lng -= 360;
			}
			if (gAmpl > 180 && _lng < 0 && this.west > 0) {
				_lng += 360;
			}
			if (gAmpl > 180 && _lng >= 0 && this.west > 0 && _lng < this.east) {
				_lng += (this.west + (gAmpl - this.east));
			}
			let rotated = this.rotateBothWays(this.toRadians(lat), this.toRadians(_lng - this.globeViewLngOffset));
			let x = Math.round(this.globeView_ratio * rotated.x);
			x += this.globeViewOffset_X;
			let y = Math.round(this.globeView_ratio * rotated.y);
			y = this.globeViewOffset_Y - y;
			pt = {x: x, y: y};
		}
		return pt;
	}

	/**
	 *
	 * @param ha in degrees
	 * @returns {number}
	 */
	haToLongitude(ha) {
		var lng = - ha;
		if (lng < -180) {
			lng += 360;
		}
		return lng;
	}

	plotPoint(context, pt, color) {
		this.plot(context, pt, color);
	}

	plot(context, pt, color) {
		context.beginPath();
		context.fillStyle = color;
		context.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
		context.stroke();
		context.fill();
		context.closePath();
	}

	fillCircle(context, pt, radius, color) {
		context.beginPath();
		context.fillStyle = color;
		context.arc(pt.x, pt.y, radius, 0, radius * Math.PI);
//	context.stroke();
		context.fill();
		context.closePath();
	}

	/* TODO userPos from this.userPosition? */
	positionBody(context, userPos, color, name, decl, gha, drawCircle, isStar) {
		isStar = isStar || false;
		context.save();
		let lng = this.haToLongitude(gha);
		let body = this.getPanelPoint(decl, lng);
		let thisPointIsBehind = this.isBehind(this.toRadians(decl), this.toRadians(lng - this.globeViewLngOffset));
		if (!thisPointIsBehind || this.transparentGlobe) {
			// Draw Body
			this.plot(context, body, color);
			context.fillStyle = color;
			if (!isStar) { // Body name, on the ground
				context.fillText(name, Math.round(body.x) + 3, Math.round(body.y) - 3);
			}
			// Arrow, to the body
			context.setLineDash([2]);
			context.strokeStyle = this.worldmapColorConfig.arrowBodyColor;
			context.beginPath();
			context.moveTo(userPos.x, userPos.y);
			context.lineTo(body.x, body.y);
			context.stroke();
			context.closePath();
			context.setLineDash([0]); // Reset
			context.strokeStyle = color;
			let deltaX = body.x - userPos.x;
			let deltaY = body.y - userPos.y;
			context.beginPath();
			context.moveTo(body.x, body.y);
			context.lineTo(body.x + deltaX, body.y + deltaY);
			context.stroke();
			if (isStar) { // Body name, in the sky
				context.font = "10px Arial";
				let metrics = context.measureText(name);
				let len = metrics.width;
				context.fillText(name, Math.round(body.x + deltaX) - (len / 2), Math.round(body.y + deltaY));
			}
			context.closePath();
			if (drawCircle === undefined && drawCircle !== false) {
				this.fillCircle(context, { x: body.x + deltaX, y: body.y + deltaY}, 3, color);
			}
		}
		context.restore();
	}

	getColorConfig(cssClassNames) {
		let colorConfig = worldMapDefaultColorConfig;
		let classes = cssClassNames.split(" ");
		for (let cls=0; cls<classes.length; cls++) {
			let cssClassName = classes[cls];
			for (let s=0; s<document.styleSheets.length; s++) {
				// console.log("Walking though ", document.styleSheets[s]);
				for (let r=0; document.styleSheets[s].cssRules !== null && r<document.styleSheets[s].cssRules.length; r++) {
					let selector = document.styleSheets[s].cssRules[r].selectorText;
					//			console.log(">>> ", selector);
					if (selector !== undefined && (selector === '.' + cssClassName || (selector.indexOf('.' + cssClassName) > -1 && selector.indexOf(WORLD_MAP_TAG_NAME) > -1))) { // Cases like "tag-name .className"
						//				console.log("  >>> Found it! [%s]", selector);
						let cssText = document.styleSheets[s].cssRules[r].style.cssText;
						let cssTextElems = cssText.split(";");
						cssTextElems.forEach(function (elem) {
							if (elem.trim().length > 0) {
								let keyValPair = elem.split(":");
								let key = keyValPair[0].trim();
								let value = keyValPair[1].trim();
								switch (key) {
									case '--canvas-background':
										colorConfig.canvasBackground = value;
										break;
									case '--default-plot-point-color':
										colorConfig.defaultPlotPointColor = value;
										break;
									case '--travel-color':
										colorConfig.travelColor = value;
										break;
									case '--arrow-body-color':
										colorConfig.arrowBodyColor = value;
										break;
									case '--globe-background':
										colorConfig.globeBackground = value;
										break;
									case '--globe-gradient-from':
										colorConfig.globeGradient.from = value;
										break;
									case '--globe-gradient-to':
										colorConfig.globeGradient.to = value;
										break;
									case '--grid-color':
										colorConfig.gridColor = value;
										break;
									case '--tropic-color':
										colorConfig.tropicColor = value;
										break;
									case '--chart-line-width':
										colorConfig.chartLineWidth = value;
										break;
									case '--chart-color':
										colorConfig.chartColor = value;
										break;
									case '--user-pos-color':
										colorConfig.userPosColor = value;
										break;
									case '--sun-color':
										colorConfig.sunColor = value;
										break;
									case '--sun-arrow-color':
										colorConfig.sunArrowColor = value;
										break;
									case '--moon-arrow-color':
										colorConfig.moonArrowColor = value;
										break;
									case '--aries-color':
										colorConfig.ariesColor = value;
										break;
									case '--venus-color':
										colorConfig.venusColor = value;
										break;
									case '--mars-color':
										colorConfig.marsColor = value;
										break;
									case '--jupiter-cColor':
										colorConfig.jupiterColor = value;
										break;
									case '--saturn-color':
										colorConfig.saturnColor = value;
										break;
									case '--stars-color':
										colorConfig.starsColor = value;
										break;
									case '--night-color':
										colorConfig.nightColor = value;
										break;
									case '--display-position-color':
										colorConfig.displayPositionColor = value;
										break;
									default:
										break;
								}
							}
						});
					}
				}
			}
		}
		return colorConfig;
	}

	repaint() {
		this.drawWorldMap();
	}

	drawGlobe(context) {
		let minX = Number.MAX_VALUE;
		let maxX = -Number.MAX_VALUE;
		let minY = Number.MAX_VALUE;
		let maxY = -Number.MAX_VALUE;

		let w = this.width;
		let h = this.height;

		let gOrig = Math.ceil(this.west);
		let gProgress = gOrig;

		if (gProgress % this.vGrid !== 0) {
			gProgress = ((gProgress / this.vGrid) + 1) * this.vGrid;
		}
		let go = true;

		let __south = -90;
		let __north = 90;

		// Find min and max
		while (go) {
			for (let _lat = __south; _lat <= __north; _lat += 5) {
				let rotated = this.rotateBothWays(this.toRadians(_lat), this.toRadians(gProgress));

				let dx = rotated.x;
				let dy = rotated.y;
//    console.log("dx:" + dx + ", dy:" + dy);
				if (dx < minX) {
					minX = dx;
				}
				if (dx > maxX) {
					maxX = dx;
				}
				if (dy < minY) {
					minY = dy;
				}
				if (dy > maxY) {
					maxY = dy;
				}
			}
			gProgress += this.vGrid;
			if (gProgress > this.east) {
				go = false;
			}
		}

		gOrig = Math.ceil(__south);
		let lProgress = gOrig;
		if (lProgress % this.hGrid !== 0) {
			lProgress = ((lProgress / this.hGrid) + 1) * this.hGrid;
		}
		go = true;
		while (go) {
			let rotated = this.rotateBothWays(this.toRadians(lProgress), this.toRadians(this.west));
			let dx = rotated.x;
			let dy = rotated.y;
//  console.log("dx:" + dx + ", dy:" + dy);
			minX = Math.min(minX, dx);
			maxX = Math.max(maxX, dx);
			minY = Math.min(minY, dy);
			maxY = Math.max(maxY, dy);
			rotated = this.rotateBothWays(this.toRadians(lProgress), this.toRadians(this.east));
			dx = rotated.x;
			dy = rotated.y;
//  console.log("dx:" + dx + ", dy:" + dy);
			minX = Math.min(minX, dx);
			maxX = Math.max(maxX, dx);
			minY = Math.min(minY, dy);
			maxY = Math.max(maxY, dy);
			lProgress += this.hGrid;

//	console.log("MinX, MaxX, MinY, MaxY ", minX, maxX, minY, maxY);
			if (lProgress > __north) {
				go = false;
			}
		}
//console.log("MinX:" + minX + ", MaxX:" + maxX + ", MinY:" + minY + ", MaxY:" + maxY);
		let opWidth = Math.abs(maxX - minX);
		let opHeight = Math.abs(maxY - minY);
		this.globeView_ratio = Math.min(w / opWidth, h / opHeight) * this.defaultRadiusRatio; // 0.9, not to take all the space...

		// Black background.
		context.fillStyle = this.worldmapColorConfig.globeBackground;
		context.fillRect(0, 0, this.width, this.height);

		// Before (callback)
		if (this.doBefore !== undefined) {
			this.doBefore(this, context);
		}

		// Circle
		let radius = Math.min(w / 2, h / 2) * this.defaultRadiusRatio;
		let grd = context.createRadialGradient(this.width / 2, this.height / 2, radius, 90, 60, radius);
		grd.addColorStop(0, this.worldmapColorConfig.globeGradient.from);
		grd.addColorStop(1, this.worldmapColorConfig.globeGradient.to);

		context.fillStyle = grd; // "rgba(0, 0, 100, 1.0)"; // Dark blue

		context.arc(this.width / 2, this.height / 2, radius, 0, 2 * Math.PI);
		context.fill();

		this.globeViewOffset_X = Math.abs((this.globeView_ratio * opWidth) - w) / 2 - (this.globeView_ratio * minX);
		this.globeViewOffset_Y = Math.abs((this.globeView_ratio * opHeight) - h) / 2 - (this.globeView_ratio * minY);

		let gstep = 10; //Math.abs(_east - _west) / 60;
		let lstep = 10;  //Math.abs(_north - _south) / 10;

		context.lineWidth = 1;
		context.strokeStyle = this.worldmapColorConfig.gridColor; // 'cyan';

		if (this.withGrid) {
			context.save();
			// Meridians
			for (let i = Math.min(this.east, this.west); i < Math.max(this.east, this.west); i += gstep) {
				let previous = null;
				context.beginPath();
				for (let j = Math.min(this.south, this.north) + (lstep / 5); j < Math.max(this.south, this.north); j += (lstep / 5)) {
					let p = this.getPanelPoint(j, i);

					let thisPointIsBehind = this.isBehind(this.toRadians(j), this.toRadians(i - this.globeViewLngOffset));

					if (!this.transparentGlobe && thisPointIsBehind) {
						previous = null;
					} else {
						if (previous !== null) {
							if (Math.abs(previous.x - p.x) < (this.width / 2) && Math.abs(previous.y - p.y) < (this.height / 2)) {
								context.lineTo(p.x, p.y);
							}
						} else {
							context.moveTo(p.x, p.y);
						}
						previous = p;
					}
				}
				context.stroke();
				context.closePath();
			}

			// Parallels
			for (let j = Math.min(this.south, this.north) + lstep; j < Math.max(this.south, this.north); j += lstep) {
				let previous = null;
				context.beginPath();
				for (let i = Math.min(this.east, this.west); i <= Math.max(this.east, this.west); i += gstep) {
					let p = this.getPanelPoint(j, i);
					let thisPointIsBehind = this.isBehind(this.toRadians(j), this.toRadians(i - this.globeViewLngOffset));

					if (!this.transparentGlobe && thisPointIsBehind) {
						previous = null;
					} else {
						if (previous !== null) {
							if (Math.abs(previous.x - p.x) < (this.width / 2) && Math.abs(previous.y - p.y) < (this.height / 2)) {
								context.lineTo(p.x, p.y);
							}
						} else {
							context.moveTo(p.x, p.y);
						}
						previous = p;
					}
				}
				context.stroke();
				context.closePath();
			}
			context.restore();
		}

		if (this.withTropics) {
			// Cancer
			context.fillStyle = this.worldmapColorConfig.tropicColor;
			for (let lng = 0; lng < 360; lng++) {
				let p = this.getPanelPoint(tropicLat, lng);
				let thisPointIsBehind = this.isBehind(this.toRadians(tropicLat), this.toRadians(lng - this.globeViewLngOffset));

				if (this.transparentGlobe || !thisPointIsBehind) {
					context.fillRect(p.x, p.y, 1, 1);
				}
			}
			// Capricorn
			for (let lng = 0; lng < 360; lng++) {
				let p = this.getPanelPoint(-tropicLat, lng);
				let thisPointIsBehind = this.isBehind(this.toRadians(-tropicLat), this.toRadians(lng - this.globeViewLngOffset));

				if (this.transparentGlobe || !thisPointIsBehind) {
					context.fillRect(p.x, p.y, 1, 1);
				}
			}
			// North Polar Circle
			for (let lng = 0; lng < 360; lng++) {
				let p = this.getPanelPoint(90 - tropicLat, lng);
				let thisPointIsBehind = this.isBehind(this.toRadians(90 - tropicLat), this.toRadians(lng - this.globeViewLngOffset));

				if (this.transparentGlobe || !thisPointIsBehind) {
					context.fillRect(p.x, p.y, 1, 1);
				}
			}
			// South Polar Circle
			for (let lng = 0; lng < 360; lng++) {
				let p = this.getPanelPoint(tropicLat - 90, lng);
				let thisPointIsBehind = this.isBehind(this.toRadians(tropicLat - 90), this.toRadians(lng - this.globeViewLngOffset));

				if (this.transparentGlobe || !thisPointIsBehind) {
					context.fillRect(p.x, p.y, 1, 1);
				}
			}
		}

		// Chart
		context.save();
		if (fullWorldMap === undefined) {
			console.log("You must load [WorldMapData.js] to display a chart.");
		} else {
			try {
				let worldTop = fullWorldMap.top;
				let section = worldTop.section; // We assume top has been found.

//      console.log("Found " + section.length + " section(s).")
				for (let i = 0; i < section.length; i++) {
					let point = section[i].point;
					if (point !== undefined) {
						let firstPt = null;
						let previousPt = null;
						context.beginPath();
						for (let p = 0; p < point.length; p++) {
							let lat = parseFloat(point[p].Lat);
							let lng = parseFloat(point[p].Lng);
							if (lng < -180) {
								lng += 360;
							}
							if (lng > 180) {
								lng -= 360;
							}

							let thisPointIsBehind = this.isBehind(this.toRadians(lat), this.toRadians(lng - this.globeViewLngOffset));
							let drawIt = true;
							if (!this.transparentGlobe && thisPointIsBehind) {
								drawIt = false;
								previousPt = null; // Something better, maybe ?
							}
							let pt = this.getPanelPoint(lat, lng);
							if (previousPt === null) { // p === 0) {
								context.moveTo(pt.x, pt.y);
								firstPt = pt;
								previousPt = pt;
							} else {
								if (Math.abs(previousPt.x - pt.x) < (this.width / 2) && Math.abs(previousPt.y - pt.y) < (this.height / 2)) {
									context.lineTo(pt.x, pt.y);
									previousPt = pt;
								}
							}
						}
					}
					// if (false && firstPt !== null && previousPt !== null) {
					// 	context.lineTo(firstPt.x, firstPt.y); // close the loop
					// }
					context.lineWidth = this.worldmapColorConfig.chartLineWidth;
					context.strokeStyle = this.worldmapColorConfig.chartColor;
					context.stroke();
					context.closePath();
				}
			} catch (ex) {
				console.log("Oops:" + ex);
			}
		}
		context.restore();

		// User position
		if (this.userPosition !== {}) {
			let userPos = this.getPanelPoint(this.userPosition.latitude, this.userPosition.longitude);
			this.plot(context, userPos, this.worldmapColorConfig.userPosColor);
			context.fillStyle = this.worldmapColorConfig.userPosColor;
			context.fillText(this.positionLabel, Math.round(userPos.x) + 3, Math.round(userPos.y) - 3);

			// Celestial bodies?
			if (this.astronomicalData !== {}) {
				if (this.astronomicalData.sun !== undefined) {
					let sunLng = this.haToLongitude(this.astronomicalData.sun.gha);
					context.save();
					if (this.withSun) {
						let sun = this.getPanelPoint(this.astronomicalData.sun.decl, sunLng);
						let thisPointIsBehind = this.isBehind(this.toRadians(this.astronomicalData.sun.decl), this.toRadians(sunLng - this.globeViewLngOffset));
						if (!thisPointIsBehind || this.transparentGlobe) {
							// Draw Sun
							this.plot(context, sun, this.worldmapColorConfig.sunColor);
							context.fillStyle = this.worldmapColorConfig.sunColor;
							context.fillText("Sun", Math.round(sun.x) + 3, Math.round(sun.y) - 3);
							// Arrow, to the sun
							context.setLineDash([2]);
							context.strokeStyle = this.worldmapColorConfig.sunArrowColor;
							context.beginPath();
							context.moveTo(userPos.x, userPos.y);
							context.lineTo(sun.x, sun.y);
							context.stroke();
							context.closePath();
							context.setLineDash([0]); // Reset
							context.strokeStyle = this.worldmapColorConfig.sunColor;
							let deltaX = sun.x - userPos.x;
							let deltaY = sun.y - userPos.y;
							context.beginPath();
							context.moveTo(sun.x, sun.y);
							context.lineTo(sun.x + deltaX, sun.y + deltaY);
							context.stroke();
							context.closePath();
							// if (false) {
							// 	var img = document.getElementById("sun-png"); // 13x13
							// 	var direction = getDir(deltaX, -deltaY);
							// 	var imgXOffset = 7 * Math.sin(toRadians(direction));
							// 	var imgYOffset = 7 * Math.cos(toRadians(direction));
							// 	context.drawImage(img, sun.x + deltaX + Math.ceil(imgXOffset), sun.y + deltaY - Math.ceil(imgYOffset));
							// } else {
							this.fillCircle(context, {x: sun.x + deltaX, y: sun.y + deltaY}, 6, this.worldmapColorConfig.sunColor);
							// }
						}
						// Route to sun?
						// context.lineWidth = 1;
						// context.strokeStyle = "yellow";
						// drawRhumbline(canvas, context, userPosition, { lat: astronomicalData.sun.decl, lng: sunLng })
					}
					// Sunlight
					if (this.withSunlight) {
						let from = {lat: this.toRadians(this.astronomicalData.sun.decl), lng: this.toRadians(sunLng)};
						this.drawNight(context, from, this.userPosition, this.astronomicalData.sun.gha);
					}
					context.restore();
				}
				if (this.astronomicalData.moon !== undefined) {
					let moonLng = this.haToLongitude(this.astronomicalData.moon.gha);
					context.save();
					if (this.withMoon) {
						let moon = this.getPanelPoint(this.astronomicalData.moon.decl, moonLng);
						let thisPointIsBehind = this.isBehind(this.toRadians(this.astronomicalData.moon.decl), this.toRadians(moonLng - this.globeViewLngOffset));
						if (!thisPointIsBehind || this.transparentGlobe) {
							// Draw Moon
							this.plot(context, moon, this.worldmapColorConfig.moonColor);
							context.fillStyle = this.worldmapColorConfig.moonColor;
							context.fillText("Moon", Math.round(moon.x) + 3, Math.round(moon.y) - 3);
							// Arrow, to the moon
							context.setLineDash([2]);
							context.strokeStyle = this.worldmapColorConfig.moonArrowColor;
							context.beginPath();
							context.moveTo(userPos.x, userPos.y);
							context.lineTo(moon.x, moon.y);
							context.stroke();
							context.closePath();
							context.setLineDash([0]); // Reset
							context.strokeStyle = this.worldmapColorConfig.moonColor;
							var deltaX = moon.x - userPos.x;
							var deltaY = moon.y - userPos.y;
							context.beginPath();
							context.moveTo(moon.x, moon.y);
							context.lineTo(moon.x + deltaX, moon.y + deltaY);
							context.stroke();
							context.closePath();
							// if (false) {
							// 	var img = document.getElementById("moon-png");
							// 	var direction = getDir(deltaX, -deltaY);
							// 	var imgXOffset = 7 * Math.sin(toRadians(direction));
							// 	var imgYOffset = 7 * Math.cos(toRadians(direction));
							// 	context.drawImage(img, moon.x + deltaX + Math.ceil(imgXOffset), moon.y + deltaY - Math.ceil(imgYOffset));
							// } else {
							this.fillCircle(context, {x: moon.x + deltaX, y: moon.y + deltaY}, 5, this.worldmapColorConfig.moonColor);
							// }
						}
					}
					// Moonlight
					if (this.withMoonlight) {
						let from = {lat: this.toRadians(this.astronomicalData.moon.decl), lng: this.toRadians(moonLng)};
						this.drawNight(context, from, this.userPosition, this.astronomicalData.moon.gha);
					}
					context.restore();
				}
				if (this.astronomicalData.wanderingBodies !== undefined && this.withWanderingBodies) {
					// 1 - Ecliptic
					let aries = this.findInList(this.astronomicalData.wanderingBodies, "name", "aries");
					if (aries !== null) {
						this.drawEcliptic(context, aries.gha, this.astronomicalData.eclipticObliquity);
						this.positionBody(context, userPos, this.worldmapColorConfig.ariesColor, "Aries", 0, aries.gha, false);
						this.positionBody(context, userPos, this.worldmapColorConfig.ariesColor, "Anti-Aries", 0, aries.gha + 180, false); // Libra?
					}
					// 2 - Other planets
					var venus = this.findInList(this.astronomicalData.wanderingBodies, "name", "venus");
					var mars = this.findInList(this.astronomicalData.wanderingBodies, "name", "mars");
					var jupiter = this.findInList(this.astronomicalData.wanderingBodies, "name", "jupiter");
					var saturn = this.findInList(this.astronomicalData.wanderingBodies, "name", "saturn");
					if (venus !== null) {
						this.positionBody(context, userPos, this.worldmapColorConfig.venusColor, "Venus", venus.decl, venus.gha);
					}
					if (mars !== null) {
						this.positionBody(context, userPos, this.worldmapColorConfig.marsColor, "Mars", mars.decl, mars.gha);
					}
					if (jupiter !== null) {
						this.positionBody(context, userPos, this.worldmapColorConfig.jupiterColor, "Jupiter", jupiter.decl, jupiter.gha);
					}
					if (saturn !== null) {
						this.positionBody(context, userPos, this.worldmapColorConfig.saturnColor, "Saturn", saturn.decl, saturn.gha);
					}
				}

				if (this.astronomicalData.stars !== undefined && this.withStars) {
					let instance = this;
					this.astronomicalData.stars.forEach(function (star, idx) {
						instance.positionBody(context, userPos, instance.worldmapColorConfig.starsColor, star.name, star.decl, star.gha, false, true);
					});
				}
			}
		}
		// After (callback)
		if (this.doAfter !== undefined) {
			this.doAfter(this, context);
		}
	}

	getIncLat(lat) {
		let il = Math.log(Math.tan((Math.PI / 4) + (this.toRadians(lat) / 2)));
		return this.toDegrees(il);
	}

	getInvIncLat(il) {
		let ret = this.toRadians(il);
		ret = Math.exp(ret);
		ret = Math.atan(ret);
		ret -= (Math.PI / 4); // 0.78539816339744828D;
		ret *= 2;
		ret = this.toDegrees(ret);
		return ret;
	}

	calculateEastG(nLat, sLat, wLong, canvasW, canvasH) {
		var deltaIncLat =  this.getIncLat(nLat) - this.getIncLat(sLat);

		let graphicRatio = canvasW / canvasH;
		let deltaG = Math.min(deltaIncLat * graphicRatio, 359);
		let eLong = wLong + deltaG;

		while (eLong > 180) {
			eLong -= 360;
		}
		return eLong;
	}

	/**
	 * For Anaximandre and Mercator
	 *
	 * @param lat
	 * @param lng
	 * @param label
	 * @param color
	 */
	plotPosToCanvas(context, lat, lng, label, color) {

		let pt = this.posToCanvas(lat, lng);
		this.plotPoint(context, pt, (color !== undefined ? color : this.worldmapColorConfig.defaultPlotPointColor));
		if (label !== undefined) {
			try {
				// BG
				let metrics = context.measureText(label);
				let xLabel = Math.round(pt.x) + 3;
				let yLabel = Math.round(pt.y) - 3;

				// context.fillStyle = 'yellow'; // worldmapColorConfig.canvasBackground;
				// context.fillRect( xLabel, yLabel - 14, metrics.width, 14);
				// Text
				context.fillStyle = (color !== undefined ? color : this.worldmapColorConfig.defaultPlotPointColor);
				context.fillText(label, xLabel, yLabel);
			} catch (err) { // Firefox has some glitches here
				if (console.log !== undefined) {
					if (err.message !== undefined && err.name !== undefined) {
						console.log(err.message + " " + err.name);
					} else {
						console.log(err);
					}
				}
			}
		}
	}

	posToCanvas(lat, lng) { // Anaximandre and Mercator

		this._east = this.calculateEastG(this._north, this._south, this._west, this.width, this.height);
		this.adjustBoundaries();

		let x, y;

		let gAmpl = this._east - this._west;
		while (gAmpl < 0) {
			gAmpl += 360;
		}
		let graph2chartRatio = this.width / gAmpl;
		let _lng = lng;
		if (Math.abs(this._west) > 180 && Math.sign(_lng) !== Math.sign(this._west) && Math.sign(_lng) > 0) {
			_lng -= 360;
		}
		if (gAmpl > 180 && _lng < 0 && this._west > 0) {
			_lng += 360;
		}
		if (gAmpl > 180 && _lng >= 0 && this._west > 0 && _lng < this._east) {
			_lng += (this._west + (gAmpl - this._east));
		}

		let incSouth = 0, incLat = 0;

		switch (this.projection) {
			case undefined:
			case mapProjections.anaximandre:
				//	x = (180 + lng) * (canvas.width / 360);
				x = ((_lng - this._west) * graph2chartRatio);
				incSouth = this._south;
				incLat = lat;
				//	y = canvas.height - ((lat + 90) * canvas.height / 180);
				y = this.height - ((incLat - incSouth) * (this.height / (this._north - this._south)));
				break;
			case mapProjections.mercator:
				// Requires _north, _south, _east, _west
				x = ((_lng - this._west) * graph2chartRatio);
				incSouth = this.getIncLat(Math.max(this._south, -80));
				incLat = this.getIncLat(lat);
				y = this.height - ((incLat - incSouth) * graph2chartRatio);
				break;
		}

		return {"x": x, "y": y};
	}

	drawFlatGrid(context) {
		context.lineWidth = 1;
		context.strokeStyle = this.worldmapColorConfig.gridColor; // 'cyan';

		let gstep = 10; //Math.abs(_east - _west) / 60;
		let lstep = 10;  //Math.abs(_north - _south) / 10;

		// Parallels
		for (let lat=-80; lat<=80; lat+=lstep) {
			let y = this.posToCanvas(lat, 0).y;
			context.beginPath();

			context.moveTo(0, y);
			context.lineTo(this.width, y);

			context.stroke();
			context.closePath();
		}
		// Meridians
		for (let lng=-180; lng<180; lng+=gstep) {
			let x = this.posToCanvas(0, lng).x;
			context.beginPath();

			context.moveTo(x, 0);
			context.lineTo(x, this.height);

			context.stroke();
			context.closePath();
		}
	}

	drawFlatTropics(context) {
		context.lineWidth = 1;
		context.strokeStyle = this.worldmapColorConfig.tropicColor;
		// Cancer
		let y = this.posToCanvas(tropicLat, 0).y;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(this.width, y);
		context.stroke();
		context.closePath();
		// Capricorn
		y = this.posToCanvas(-tropicLat, 0).y;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(this.width, y);
		context.stroke();
		context.closePath();
		// North polar circle
		y = this.posToCanvas(90-tropicLat, 0).y;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(this.width, y);
		context.stroke();
		context.closePath();
		// South polar circle
		y = this.posToCanvas(-90+tropicLat, 0).y;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(this.width, y);
		context.stroke();
		context.closePath();
	}

	toRealLng(lng) {
		let g = lng;
		while (g > 180) {
			g -= 360;
		}
		while (g < -180) {
			g += 360;
		}
		return g;
	}

	drawFlatNight(context, from, user, gha) {
		const NINETY_DEGREES = 90 * 60; // in nm

		// context.lineWidth = 1;
		context.fillStyle = this.worldmapColorConfig.nightColor;

		let nightRim = [];
		// Calculate the night rim
		for (let i=0; i<360; i++) {
			let night = this.deadReckoning(from, NINETY_DEGREES, i);
			nightRim.push(night);
		}

		// Night limb
		// Find the first point (west) of the rim
		let first = 0;
		for (let x=0; x<nightRim.length; x++) {
			let lng = this.toRealLng(this.toDegrees(nightRim[x].lng));
//		console.log("Night lng: " + lng);
			if (lng > this._west) {
				first = Math.max(0, x - 1);
				break;
			}
		}
		context.beginPath();
		let pt = this.posToCanvas(this.toDegrees(nightRim[first].lat), this.toRealLng(this.toDegrees(nightRim[first].lng)));
		context.moveTo(-10 /*pt.x*/, pt.y); // left++

		let go = true;

//	console.log("_west ", _west, "first", first);

		for (let idx=first; idx<360 && go === true; idx++) {
			pt = this.posToCanvas(this.toDegrees(nightRim[idx].lat), this.toRealLng(this.toDegrees(nightRim[idx].lng)));
			context.lineTo(pt.x, pt.y);

			// DEBUG
			// if (idx % 20 === 0) {
			// 	context.fillStyle = 'cyan';
			// 	context.fillText(idx, pt.x, pt.y);
			// }

			//  if (toRealLng(toDegrees(nightRim[idx].lng)) > _east) {
			// 	 go = false;
			//  }
		}
		if (go) {
			for (let idx=0; idx<360 && go === true; idx++) {
				if (this.toRealLng(this.toDegrees(nightRim[idx].lng)) > this._east) {
					go = false;
				} else {
					pt = this.posToCanvas(this.toDegrees(nightRim[idx].lat), this.toRealLng(this.toDegrees(nightRim[idx].lng)));
					context.lineTo(pt.x, pt.y);
					// DEBUG
					// if (idx % 20 === 0) {
					// 	context.fillStyle = 'red';
					// 	context.fillText(idx, pt.x, pt.y);
					// }
				}
			}
		}
		context.lineTo(this.width + 10, pt.y); // right most

		// DEBUG
		// context.fillStyle = 'red';
		// context.fillText('Last', pt.x - 10, pt.y);

		if (from.lat > 0) { // N Decl, night is south
			context.lineTo(this.width, this.height); // bottom right
			context.lineTo(0, this.height);            // bottom left
		} else {            // S Decl, night is north
			context.lineTo(this.width, 0);             // top right
			context.lineTo(0, 0);                        // top left
		}
//	context.lineTo(firstPt.x, firstPt.y);
		context.fillStyle = this.worldmapColorConfig.nightColor;
		context.closePath();
		context.fill();
	}

	drawFlatCelestialOptions(context) {
		if (this.astronomicalData !== {}) {
			if (this.astronomicalData.sun !== undefined && this.withSun) { // TODO Separate sun and sunlight
				context.save();
				let sunLng = this.haToLongitude(this.astronomicalData.sun.gha);
				this.plotPosToCanvas(context, this.astronomicalData.sun.decl, sunLng, "Sun", this.worldmapColorConfig.sunColor);

				if (this.withSunlight) {
					let from = {lat: this.toRadians(this.astronomicalData.sun.decl), lng: this.toRadians(sunLng)};
					this.drawFlatNight(context, from, this.userPosition, this.astronomicalData.sun.gha);
				}
				context.restore();
			}
			if (this.astronomicalData.moon !== undefined && this.withMoon) { // TODO Separate moon and moonlight
				context.save();
				let moonLng = this.haToLongitude(this.astronomicalData.moon.gha);
				this.plotPosToCanvas(context, this.astronomicalData.moon.decl, moonLng, "Moon", this.worldmapColorConfig.moonColor);
				if (this.withMoonlight) {
					let from = {lat: this.toRadians(this.astronomicalData.moon.decl), lng: this.toRadians(moonLng)};
					this.drawFlatNight(context, from, this.userPosition, this.astronomicalData.moon.gha);
				}
				context.restore();
			}
			if (this.astronomicalData.wanderingBodies !== undefined && this.withWanderingBodies) {
				// 1 - Ecliptic
				let aries = this.findInList(this.astronomicalData.wanderingBodies, "name", "aries");
				if (aries !== null) {
					// 1 - Draw Ecliptic
					let longitude = (aries.gha < 180) ? -aries.gha : 360 - aries.gha;
					longitude += 90; // Extremum
					while (longitude > 360) {
						longitude -= 360;
					}
					let ariesRad = { lat: this.toRadians(this.astronomicalData.eclipticObliquity), lng: this.toRadians(longitude) };
					let eclCenter = this.deadReckoning(ariesRad, 90 * 60, 0); // "Center" of the Ecliptic

					context.fillStyle = this.worldmapColorConfig.tropicColor;
					for (let hdg=0; hdg<360; hdg++) {
						let pt = this.deadReckoning(eclCenter, 90 * 60, hdg);
						let pp = this.posToCanvas(this.toDegrees(pt.lat), this.toRealLng(this.toDegrees(pt.lng)));
						context.fillRect(pp.x, pp.y, 1, 1);
					}

					this.plotPosToCanvas(context, 0, this.haToLongitude(aries.gha), "Aries", this.worldmapColorConfig.ariesColor);
					this.plotPosToCanvas(context, 0, this.haToLongitude(aries.gha + 180), "Anti-Aries", this.worldmapColorConfig.ariesColor);
				}
				// 2 - Other planets
				let venus = this.findInList(this.astronomicalData.wanderingBodies, "name", "venus");
				let mars = this.findInList(this.astronomicalData.wanderingBodies, "name", "mars");
				let jupiter = this.findInList(this.astronomicalData.wanderingBodies, "name", "jupiter");
				let saturn = this.findInList(this.astronomicalData.wanderingBodies, "name", "saturn");
				if (venus !== null) {
					this.plotPosToCanvas(context, venus.decl, this.haToLongitude(venus.gha), "Venus", this.worldmapColorConfig.venusColor);
				}
				if (mars !== null) {
					this.plotPosToCanvas(context, mars.decl, this.haToLongitude(mars.gha), "Mars", this.worldmapColorConfig.marsColor);
				}
				if (jupiter !== null) {
					this.plotPosToCanvas(context, jupiter.decl, this.haToLongitude(jupiter.gha), "Jupiter", this.worldmapColorConfig.jupiterColor);
				}
				if (saturn !== null) {
					this.plotPosToCanvas(context, saturn.decl, this.haToLongitude(saturn.gha), "Saturn", this.worldmapColorConfig.saturnColor);
				}
			}

			if (this.astronomicalData.stars !== undefined && this.withStars) {
				let instance = this;
				this.astronomicalData.stars.forEach(function(star, idx) {
					instance.plotPosToCanvas(context, star.decl, instance.haToLongitude(star.gha), star.name, instance.worldmapColorConfig.starsColor);
				});
			}
		}
	}

	drawMercatorChart(context) {

		let grd = context.createLinearGradient(0, 5, 0, this.height);
		grd.addColorStop(0, this.worldmapColorConfig.globeGradient.from);
		grd.addColorStop(1, this.worldmapColorConfig.globeGradient.to);

		context.fillStyle = grd; // "rgba(0, 0, 100, 1.0)"; // Dark blue
		context.fillRect(0, 0, this.width, this.height);

		if (this.withGrid) {
			this.drawFlatGrid(context);
		}

		if (this.withTropics) {
			this.drawFlatTropics(context);
		}

		let worldTop = fullWorldMap.top;
		let section = worldTop.section; // We assume top has been found.

//    console.log("Found " + section.length + " section(s).")
		for (let i = 0; i < section.length; i++) {
			var point = section[i].point;
			let firstPt = null;
			let previousPt = null;
			if (point !== undefined) {
				context.beginPath();
				for (let p = 0; p < point.length; p++) {
					let lat = parseFloat(point[p].Lat);
					let lng = parseFloat(point[p].Lng);
					if (lng < -180) {
						lng += 360;
					}
					if (lng > 180) {
						lng -= 360;
					}
					let pt = this.posToCanvas(lat, lng);
					if (p === 0) {
						context.moveTo(pt.x, pt.y);
						firstPt = pt;
						previousPt = pt;
					} else {
						if (Math.abs(previousPt.x - pt.x) < (this.width / 2) && Math.abs(previousPt.y - pt.y) < (this.height / 2)) {
							context.lineTo(pt.x, pt.y);
							previousPt = pt;
						} else { // Too far apart
							firstPt = pt;
							context.moveTo(pt.x, pt.y);
							previousPt = pt;
						}
					}
				}
			}
			if (firstPt !== null && Math.abs(previousPt.x - firstPt.x) < (this.width / 20) && Math.abs(previousPt.y - firstPt.y) < (this.height / 20)) {
				context.lineTo(firstPt.x, firstPt.y); // close the loop
			}
			context.lineWidth = this.worldmapColorConfig.chartLineWidth;
			context.strokeStyle = this.worldmapColorConfig.chartColor; // 'black';
			context.stroke();
			// context.fillStyle = "goldenrod";
			// context.fill();
			context.closePath();
		}
		// User position
		if (this.userPosition !== {}) {
			this.plotPosToCanvas(context, this.userPosition.latitude, this.userPosition.longitude, this.positionLabel, this.worldmapColorConfig.userPosColor);
		}

		this.drawFlatCelestialOptions(context);
	}

	drawAnaximandreChart(context) {
		// Square projection, Anaximandre.
		let grd = context.createLinearGradient(0, 5, 0, this.height);
		grd.addColorStop(0, this.worldmapColorConfig.globeGradient.from);
		grd.addColorStop(1, this.worldmapColorConfig.globeGradient.to);

		context.fillStyle = grd; // "rgba(0, 0, 100, 1.0)"; // Dark blue
		context.fillRect(0, 0, this.width, this.height);

		if (this.withGrid) {
			this.drawFlatGrid(context);
		}

		if (this.withTropics) {
			this.drawFlatTropics(context);
		}
		let worldTop = fullWorldMap.top;
		let section = worldTop.section; // We assume top has been found.

//    console.log("Found " + section.length + " section(s).")
		for (let i = 0; i < section.length; i++) {
			let point = section[i].point;
			let firstPt = null;
			let previousPt = null;
			if (point !== undefined) {
				context.beginPath();
				for (let p = 0; p < point.length; p++) {
					let lat = parseFloat(point[p].Lat);
					let lng = parseFloat(point[p].Lng);
					if (lng < -180) {
						lng += 360;
					}
					if (lng > 180) {
						lng -= 360;
					}
					let pt = this.posToCanvas(lat, lng);
					if (p === 0) {
						context.moveTo(pt.x, pt.y);
						firstPt = pt;
						previousPt = pt;
					} else {
						if (Math.abs(previousPt.x - pt.x) < (this.width / 2) && Math.abs(previousPt.y - pt.y) < (this.height / 2)) {
							context.lineTo(pt.x, pt.y);
							previousPt = pt;
						}
					}
				}
			}
			if (firstPt !== null) {
				context.lineTo(firstPt.x, firstPt.y); // close the loop
			}
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
			context.fillStyle = "goldenrod";
			context.fill();
			context.closePath();
		}
		// User position
		if (this.userPosition !== {}) {
			this.plotPosToCanvas(context, this.userPosition.latitude, this.userPosition.longitude, this.positionLabel, this.worldmapColorConfig.userPosColor);
		}
		this.drawFlatCelestialOptions(context);
	};

	drawWorldMap() {

		let currentStyle = this.className;
		if (this._previousClassName !== currentStyle || true) {
			// Reload
			//	console.log("Reloading CSS");
			try {
				this.worldmapColorConfig = this.getColorConfig(currentStyle);
			} catch (err) {
				// Absorb?
				console.log(err);
			}
			this._previousClassName = currentStyle;
		}

		let context = this.canvas.getContext('2d');

		if (this.width === 0 || this.height === 0) { // Not visible
			return;
		}
		// Set the canvas size from its container.
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		if (this.projection === mapProjections.anaximandre) {
			this.drawAnaximandreChart(context);
		} else if (this.projection === mapProjections.mercator) {
			this.drawMercatorChart(context);
		} else { // Default is globe
			this.drawGlobe(context);
		}

		// Print position
		if (this.userPosition.latitude !== undefined && this.userPosition.longitude !== undefined) {
			let strLat = this.decToSex(this.userPosition.latitude, "NS");
			let strLng = this.decToSex(this.userPosition.longitude, "EW");
			context.fillStyle = this.worldmapColorConfig.displayPositionColor;
			context.font = "bold 16px Arial"; // "bold 40px Arial"
			context.fillText(strLat, 10, 18);
			context.fillText(strLng, 10, 38);
		}

		if (this.astronomicalData !== undefined && this.astronomicalData.deltaT !== undefined) {
			context.fillStyle = this.worldmapColorConfig.displayPositionColor;
			context.font = "12px Arial"; // "bold 40px Arial"
			let deltaT = "\u0394T=" + this.astronomicalData.deltaT + " s";
			context.fillText(deltaT, 10, this.height - 5);
		}
	}
}

// Associate the tag and the class
window.customElements.define(WORLD_MAP_TAG_NAME, WorldMap);
