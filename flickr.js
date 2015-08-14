var fs = require("fs");
var _ = require("lodash");
var moment = require("moment");
var futures = require("futures");
var joins = require("join");

var Flickr = require("flickrapi");
var FlickrOptions = {
    permissions: "delete",
};
_.extend(FlickrOptions, JSON.parse(fs.readFileSync("keys/flickr_api_keys.json")));
_.extend(FlickrOptions, JSON.parse(fs.readFileSync("keys/flickr_access_token.json")));

var fileArray = [];
var uploading = false;

var connect = function() {
	var future = futures.future.create();
	Flickr.authenticate(FlickrOptions, function(error, flickr) {
		if (error) {
			console.error("Authentication error: ", error);
			future.deliver(error, undefined);
		}
		else {
			future.deliver(undefined, flickr);			
		}
	});
	return future;
};

var uploadPhotos = function(files) {
	uploading = true;
	var join = joins.create();
	connect().when(function(error, flickr) {
		console.log("Flickr", flickr);
		if (error) {
			future.deliver(error, undefined);
		}
		_.each(files, function(file) {
			var context = {
				photos: [{
		      		title: moment().format("YYYY-MM-DD"),
		      		tags: [],
		      		photo: file,
		      		is_public: 0,
		      		is_friend: 0,
		      		is_family: 0
				}]
			};
			var future = futures.future.create(context);
			console.log("Uploading files: ", files);
		  	Flickr.upload(context, FlickrOptions, function(err, result) {
				console.log("Uploaded...");
		    	if(err) {
		      		console.error(err);
		      		future.deliver(err, undefined);
		    	}
		    	else {
			    	_.each(files, function(file) {
						console.log("Deleting: ", file);
			    		fs.unlinkSync(file);	    		
			    	});
			    	future.deliver(undefined, result);
		    	}
		  	});
			join.add(future);
		});
	});
	return join;
};	

var enqueue = function(files) {
	fileArray = fileArray.concat(files);
	purge();
}

var purge = function() {
	if (!uploading) {		
		var filesToUpload = fileArray.splice(0, 5);
		uploadPhotos(filesToUpload).when(function(err, data) {
			uploading = false;			
			console.log("Done uploading!");
		});
	}
};
module.exports = {
	enqueue: enqueue,
	purge: purge
};
