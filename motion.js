var CAM_OUTPUT_FOLDER = "cam_output";
var MAX_WIDTH = 2592;
var MAX_HEIGHT = 1944;

var RaspiCam = require("raspicam");
var moment = require("moment");
var fs = require("fs");
var gm = require("gm");
var schedule = require('node-schedule');

var prevFilename;
var cameraOpts = {
	mode: "timelapse",	
	timelapse: 3000,
	output: __dirname + "/" + CAM_OUTPUT_FOLDER + "/image_%06d.png",
	width: MAX_WIDTH,
	height: MAX_HEIGHT,
	quality: 100,
	encoding: "png",
	exposure: "auto",
	awb: "auto",
	metering: "matrix"
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
			var tolerance = 15;
			console.log("comparing...");
			gm.compare(prevFilename, filename, tolerance, function(err, isEqual, equality) {
				if (!isEqual) {
					console.log("movement!");
					fs.createReadStream(__dirname + "/" + CAM_OUTPUT_FOLDER + "/" + filename).pipe(fs.createWriteStream(__dirname + "/photo_queue/" + moment().format("YYYY-MM-DD_HH:mm:ss") + ".jpg"));
				}
			});
		}
		if (filename.indexOf("~") === -1) {
			fs.unlink(prevFilename, function() {
				console.log("removed files");
			});
			prevFilename = filename;
		}
	});
	camera.start();
};

module.exports = {
	detect: detect
};
