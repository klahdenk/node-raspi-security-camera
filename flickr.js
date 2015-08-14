var fs = require("fs");
var _ = require("lodash");
var moment = require("moment");
var futures = require("futures");

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
	var future = futures.future.create();
	when(connect).then(function(error, flickr) {
		if (error) {
			future.deliver(error, undefined);
		}
		var photos = [];
		_.each(files, function(file) {
			photos.push({
	      		title: moment().format("YYYY-MM-DD"),
	      		tags: [],
	      		photo: file,
	      		is_public: 0,
	      		is_friend: 0,
	      		is_family: 0,
			});			
		});

	  	var uploadOptions = {
	    		photos: photos
	  	};

		console.log("Uploading files: ", files);
	  	Flickr.upload(uploadOptions, FlickrOptions, function(err, result) {
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
				console.log("Done uploading!");
	    	}
	  	});
	});
	return future;
};	

var enqueue = function(files) {
	fileArray = fileArray.concat(files);
	purge();
}

var purge = function() {
	if (!uploading) {		
		uploadPhotos(fileArray).when(function(err, data) {
			uploading = false;			
		});
		fileArray = [];
	}
};
module.exports = {
	enqueue: enqueue,
	purge: purge
};
