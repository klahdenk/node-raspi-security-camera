var CAM_OUPUT_FOLDER = "cam_output";
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
	timelapse: 300,
	output: __dirname + "/" + CAM_OUPUT_FOLDER,
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
	camera.on("read", function(err, filename) {
		if (err) {
			console.err(err);
		}
		if (prevFilename) {
			var tolerance = 1.5;
			gm.compare(prevFilename, filename, tolerance, function(err, isEqual, equality) {
				if (isEqual) {
					fs.createReadStream(filename).pipe(fs.createWriteStream("photo_queue/" + moment().format("YYYY-MM-DD_HH:mm:ss") + ".jpg"));
				}
			});
		}
		prevFilename = filename;
	});
	camera.start();
};

module.exports = {
	detect: detect
};