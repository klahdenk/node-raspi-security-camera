var PHOTO_QUEUE_DIR = "photo_queue";

var chokidar = require("chokidar");
var fs = require("fs");
var cp = require("child_process");
var _ = require("lodash");

var flickr = require("./flickr");
var motion = require("./motion");

// Watch for files added to upload queue
var watcher = chokidar.watch(__dirname + "/" + PHOTO_QUEUE_DIR, {
	persistent: true,
	usePolling: true
});
watcher.on("add", function(path) {
	console.log("new file in upload queue, uploading: ", path);
	flickr.uploadPhotos([path]);
});
watcher.on("all", function(event, path) {
	console.log("event: ", event);
	console.log("path: ", path);
});

motion.detect();
