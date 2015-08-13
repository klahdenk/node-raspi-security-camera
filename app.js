var PHOTO_QUEUE_DIR = "photo_queue";

var chokidar = require("chokidar");
var fs = require("fs");
var _ = require("lodash");

var flickr = require("./flickr");
var motion = require("./motion");

// check if there are files in queue on startup and upload
var files = fs.readdirSync(__dirname + "/" + PHOTO_QUEUE_DIR);
if (files.length > 0) {
	var paths = _.map(files, function(file) {
		return __dirname + "/" + PHOTO_QUEUE_DIR + "/" + file;
	});
	flickr.uploadPhotos(paths);	
}

// Watch for files added to upload queue
var watcher = chokidar.watch(__dirname + "/" + PHOTO_QUEUE_DIR);
watcher.on("add", function(path) {
	flickr.uploadPhotos([path]);
});

// Detect motion
motion.detect();