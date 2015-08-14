var fs = require("fs");
var _ = require("lodash");
var moment = require("moment");
var futures = require("futures");
var joins = futures.join;

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
		join.add(future);
		connect().when(function(error, flickr) {
			if (error) {
				future.deliver(error, undefined);
			}
			console.log("Uploading files: ", file);
		  	Flickr.upload(context, FlickrOptions, function(err, result) {
				console.log("Uploaded...", result);
		    	if(err) {
		      		console.error(err);
		      		future.deliver(err, undefined);
		    	}
		    	else {
					console.log("Deleting: ", file);
		    		fs.unlinkSync(file);	    		
			    	future.deliver(undefined, result);
		    	}
		  	});
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
		if (filesToUpload.length > 0) {
			uploadPhotos(filesToUpload).when(function(err, data) {
				uploading = false;			
				console.log("Done uploading!");
				purge();
			});			
		}
	}
};
module.exports = {
	enqueue: enqueue,
	purge: purge
};
