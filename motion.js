var CAM_OUTPUT_FOLDER = "cam_output";
var MAX_WIDTH = 2592;
var MAX_HEIGHT = 1944;

var RaspiCam = require("raspicam");
var moment = require("moment");
var fs = require("fs");
var fse = require("fs-extra");
var gm = require("gm");
var schedule = require('node-schedule');

var prevFilename;
var cameraOpts = {
	mode: "timelapse",	
	timelapse: 3000,
	timeout: 0,
	output: __dirname + "/" + CAM_OUTPUT_FOLDER + "/image_%06d.png",
	width: 259,
	height: 194,
	quality: 50,
	encoding: "png",
	exposure: "auto",
	awb: "auto",
	metering: "matrix",
	nopreview: true
};

var detect = function() {
	var camera = new RaspiCam(cameraOpts);
	camera.on("read", function(err, timestamp, filename) {
		console.log(filename, prevFilename);
		if (err) {
			console.err(err);
			return;
		}
		if (prevFilename && filename.indexOf("~") === -1) {
			var tolerance = 1.5;
			console.log("comparing...");
			var root = __dirname + "/" + CAM_OUTPUT_FOLDER;
			var file1 = root + "/" + prevFilename;
			var file2 = root + "/" + filename;
			gm.compare(file1, file2, tolerance, function(err, isEqual, equality, raw) {
				if (!isEqual) {
					console.log("movement! " + raw);
					fse.copySync(file2, __dirname + "/photo_queue/" + moment().format("YYYY-MM-DD_HH:mm:ss") + ".png");
					console.log("copied " + filename + " to queue");
				}
			});
		}
		if (filename.indexOf("~") === -1) {
			prevFilename = filename;
		}
	});
	camera.start();
};

module.exports = {
	detect: detect
};

detect();
