var fs = require("fs");
var _ = require("lodash");
var futures = require("futures");
var moment = require("moment");

var Flickr = require("flickrapi");
var FlickrOptions = {
    permissions: "delete",
};
_.extend(FlickrOptions, JSON.parse(fs.readFileSync("keys/flickr_api_keys.json")));
_.extend(FlickrOptions, JSON.parse(fs.readFileSync("keys/flickr_access_token.json")));

var uploadPhotos = function(files) {
	Flickr.authenticate(FlickrOptions, function(error, flickr) {
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

	  	Flickr.upload(uploadOptions, FlickrOptions, function(err, result) {
	    	if(err) {
	      		return console.error(err);
	    	}
	    	_.each(files, function(file) {
	    		fs.unlinkSync(file);	    		
	    	});
	  	});
	});	
};

module.exports = {
	uploadPhotos: uploadPhotos
};