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
	timelapse: 500,
	timeout: 0,
	output: __dirname + "/" + CAM_OUTPUT_FOLDER + "/image_%06d.jpg",
	width: 150,
	height: 100,
	quality: 30,
	encoding: "jpg",
	exposure: "auto",
	awb: "auto",
	metering: "matrix",
	nopreview: true
};

var detect = function() {
	var root = __dirname + "/" + CAM_OUTPUT_FOLDER;
	var camera = new RaspiCam(cameraOpts);
	camera.on("read", function(err, timestamp, filename) {
		console.log(filename, prevFilename);
		if (err) {
			console.err(err);
			return;
		}
		if (prevFilename && filename.indexOf("~") === -1) {
			var tolerance = 0.1;
			console.log("comparing...");
			var file1 = root + "/" + prevFilename;
			var file2 = root + "/" + filename;
			gm.compare(file1, file2, tolerance, function(err, isEqual, equality, raw) {
				if (!isEqual) {
					console.log("movement! " + raw);
					fse.copySync(file2, __dirname + "/photo_queue/" + moment().format("YYYY-MM-DD_HH:mm:ss") + ".jpg");
					console.log("copied " + filename + " to queue");
				}
			});
		}
		if (filename.indexOf("~") === -1) {
			if (prevFilename && fs.existsSync(root + "/" + prevFilename)) {
				fs.unlinkSync(root + "/" + prevFilename);				
			}
			prevFilename = filename;
		}
	});
	camera.start();
};

module.exports = {
	detect: detect
};

detect();
