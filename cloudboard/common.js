var F = require('total.js');
var fs = require('fs');
var hb = require('handlebars');
var hb = require('handlebars');
var hbs = require('handlebars-form-helpers');
var cuid = require('cuid');
var gm = require('gm');
var async = require('async');
var db = require('./database.js');
var pages = require('./pages.js');

var $ = module.exports = require('../elastic-core/common.js');

var defaultLimit = 50;
var fileStoreLocation = F.config['files-dir'];
var tmpStoreLocation = F.config['files-tmp-dir'];
var originalLocation = F.config['files-original-dir'];
var mediumThumbLocation = F.config['files-medium-thumb-dir'];
var smallThumbLocation = F.config['files-small-thumb-dir'];

$.registerPages(pages);


$.EBStoreFile = function(self, callback) {

	var user = self.user.id;
	var totalSize = self.post.resumableTotalSize;
	var type = self.post.resumableType;
	var filename = self.post.resumableFilename;
	var tags = JSON.parse(self.post.tags);
	var allowPublic = self.post.allowPublic;

	var generateFile = function() {

		var body = {};
		
		body.key = cuid();
		body.name = filename;		
		body.user = user;
		body.public = allowPublic;
		body.active = false;
		body.type = type;
		body.size = totalSize;
		body.success = 'Pending';
		body.message = 'Waiting to start upload...'; 
		body.tags = tags; 
		body.meta = JSON.stringify({width: 0, height: 0});
		body.created = new Date();

		$.EBIndex(body.key, body, 'files', 'file', function(response) {

			if(response.created == true) {

				callback(body);

			} else {

				callback(null);
			}	
		});
	};

	//If the file is not 'active' then allow it to be resumed, although further down the path 
	// if the file is in a state of 'Processing' then don't allow it to be continued 
	var body = { 
		"query": {
			"bool": {
				"must": [
					{ "match": { "name":  filename }},
					{ "match": { "size" : totalSize }},
					{ "match": { "user" : user }},
					{ "match": { "active" : false }}
				]
			}
		}
	};

	console.log(body.query.bool.must);

	db.client.search({
		index: 'files',
		type: 'file',
		body: body 
	}, function (err, response) {
	
		if(err == null) {

			if(response.hits.hits.length == 0) {

				console.log("FOUND NONE...so GENERATE!");
				generateFile();

			} else if(response.hits.hits.length == 1) {

				console.log("FOUND 1..so UPDATING");
				var file = response.hits.hits.pop()._source;

				//Reset the status of the file
				file.success = "Pending";
				file.message = 'Waiting to start upload...'; 

				//We generate a date...as we sort by the created timestamp and we want the latest changes at the top
				file.created = new Date();

				$.EBUpdateFile(file, function(newFile) {

					console.log(newFile);
					callback(newFile);
				});

			} else { 

				console.log("FOUND SEVERAL...although this should never happen!");

				callback(null);
			}

		} else {
			
			console.log(err);
			callback(null);
		}
	});
};

$.EBUpdateFile = function(file, callback) {

	$.EBIndex(file.key, file, 'files', 'file', function(response) {

		//If we want to update the existing object not create it!
		if(response.created == false) {		

			callback(file);

		} else {

			callback(null);
		}
	});
}

function deleteFile(path, filename) {

	fs.unlink(path + filename, function (err) {

		//If the file failed to be deleted its likely because it doesn't exist!
		if(err != null) {

			console.log(err);
		}	
	});		
};

$.EBCompleteFile = function(file, callback) {

	//Run ten simultaneous uploads
	var queue = async.queue(uploadFile, 10);

	queue.drain = function() {
		console.log("All files are uploaded.");
	};

	queue.push(file, function(newFile, successful) {

		if(successful == true) {

			file.success = 'Successful';
			file.message = 'Successfully stored.';
			file.active = true;
	
		} else {

			file.success = 'Failed';
			file.message = 'Could not process file.';
			file.active = false;
		}

		file.created = new Date();

		$.EBUpdateFile(newFile, function(finalFile) {

			callback();
		});
	}); 
};

/*
 * As this is called asynchronously its possible a change to file (a shared object) may result in a change elsewhere
 *  so best not to change 'file' at all in this function
 */
function uploadFile(file, callback) {

	console.log("UPPPPING FILES BITCH!!!");

	console.log(file.key);
	

	fs.rename(tmpStoreLocation + file.name, originalLocation + file.key, function(errFull) {
			
		if(errFull != null) {

			console.log(errFull);

			callback(file, false);

		} else {

			console.log("FILE SAVED TO FILES: " + originalLocation + file.key);

			if(file.type.indexOf('image/') == -1) {

				callback(file, true);
		
			} else {

				gm(originalLocation + file.key).resize('200', '200', '>').write(smallThumbLocation + file.key, function(errSmall) {

					if(errSmall != null) {

						deleteFile(originalLocation, file.key);

						console.log(errSmall);

						callback(file, false);

					} else {

						console.log("Generating small thumb!");	

						gm(originalLocation + file.key).resize('450', '450', '>').write(mediumThumbLocation + file.key, function(errMedium) {

							if(errMedium != null) {

								deleteFile(originalLocation, file.key);

								deleteFile(mediumThumbLocation, file.key);
				
								console.log(errMedium);

								callback(file, false);

							} else {

								console.log("Generating medium thumb!");

								callback(file, true);
							}
						});
					}
				});
			}
		}
	});
}

$.EBGetFiles = function(self, callback) {

	var body = {};
	var limit = self.post.limit;
	var user = self.user.id;
	var startId = self.post.startId;
	var order = self.post.order;
	var active = self.post.active;

	body.query = {
		"bool": {
			"must": [
				{ "match" : { "user" : user }},
			]
		}
	};

	if(startId != null && startId != '') {

		body.query.bool.must.push({ "range" : { "key" : { "lt" : startId }}});
	}

	if(limit == null || limit == "") {
		limit = 0;
	}

	 //Check if submitted limit is within specified bounds
        if(limit < 1 || limit > defaultLimit) {

                limit = defaultLimit;
        } 

	if(active != '') {

		body.query.bool.must.push({"match" : { "active" : active }});
	}

	if(order == '' || order == "asc") {

		body.sort = [
			{ "created" : { "order" : "asc" }}
		];

	} else {

		body.sort = [
			{ "created" : { "order" : "desc" }}
		];
	}

	db.client.search({
		index: 'files',
		type: 'file',
		size: limit,
		body: body
	}, function (err, response) {
	
		if(err == null) {

			var files = [];

			for(var i = 0; i < response.hits.hits.length; i++) {

				files.push(response.hits.hits[i]._source);
			}

			if(response.hits.hits.length < limit) {

				callback({ success: true, message: 'Retrieved files.', end: true, files: files });

			} else {

				callback({ success: true, message: 'Retrieved files.', end: false, files: files });

			}

		} else {

			callback({ success: false, message: err, end: false, files: [] });
		}

	});
};

$.EBGetFile = function(self, key, callback) {

	var body = { 
		"query": {
			"bool": {
				"must": [
					{ "match": { "key" : key }}
				]
			}
		}
	};

	//Only look for public files
	if(self.user == null) {

		body.query.bool.must.push({ "match" : { "public" : true }});

	} else {

		body.query.bool.must.push({ "match" : { "user" : self.user.id }});
	}

	db.client.search({
		index: 'files',
		type: 'file',
		limit: 1,
		body: body
	}, function (err, response) {
	
		if(err == null) {

			if(response.hits.hits.length == 0) {

				callback({success: false, message: 'Could not find file.', file: null});

			} else {
				
				var file = response.hits.hits.pop();
		
				callback({ success: true, message: "Found file.", file: file._source });
			}

		} else {

			callback({success: false, message: err, file: null});
		}
	});
};

$.EBSaveTag = function(self, callback) {

	var key = self.post.key;
	var user = self.user.id;
	var tag = self.post.tag;

	db.client.search({
		index: 'files',
		type: 'file',
		limit: 1,
		body: {
			"query": {
				"bool": {
					"must": [
						{ "match": { "key" : key }},
						{ "match": { "user" : user }},
					]
				}
			}
		}
	}, function (err, response) {
	
		if(err == null) {

			if(response.hits.hits.length == 0) {

				callback({success: false, message: 'Could not find file.'});

			} else {
				
				var file = response.hits.hits.pop();
		
				if(file._source.tags.indexOf(tag) != -1) {
	
					callback({success: false, messsage: 'Tag already applied to file.'});

				} else {

					file._source.tags.push(tag);

					$.EBUpdateFile(file._source, function(newFile) {
				
						if(newFile != null) {

							callback({success: true, message: "File updated to include tag."});

						} else {
					
							callback({success: false, message: "Could not update file."});
						}
					});
				}
			}

		} else {

			callback({success: false, message: err});
		}
	});
}

$.EBRemoveTag = function(self, callback) {

	var key = self.post.key;
	var user = self.user.id;
	var tag = self.post.tag;

	db.client.search({
		index: 'files',
		type: 'file',
		limit: 1,
		body: {
			"query": {
				"bool": {
					"must": [
						{ "match": { "key" : key }},
						{ "match": { "user" : user }},
					]
				}
			}
		}
	}, function (err, response) {
	
		if(err == null) {

			if(response.hits.hits.length == 0) {

				callback({success: false, message: 'Could not find file.'});

			} else {
				
				var file = response.hits.hits.pop();
		
				if(file._source.tags.indexOf(tag) == -1) {
	
					callback({success: false, messsage: 'Tag is not applied to file so no need to remove.'});

				} else {

					file._source.tags.pop(tag);

					$.EBUpdateFile(file._source, function(newFile) {
				
						if(newFile != null) {

							callback({success: true, message: "Tag removed from file."});

						} else {
					
							callback({success: false, message: "Could not update file."});
						}
					});
				}
			}

		} else {

			callback({success: false, message: err});
		}
	});
}

$.EBRemoveFile = function(self, callback)
{
	var key = self.post.key;

	$.EBGetFile(self, key, function(result) {

		if(result.success == true) {		

			var file = result.file;

			db.client.delete({
				index: 'files',
				type: 'file',
				id: key
			}, function (err, response) {

				if(err == null) {

					//Delete the original file
					deleteFile(originalLocation, file.key);

					//If its not an image then we don't need to delete the thumbnails
					if(file.type.indexOf('image/') == -1) {

						callback({success: true, message: 'File deleted'}); 

					} else {

						deleteFile(mediumThumbLocation, file.key);
						deleteFile(smallThumbLocation, file.key);

						callback({success: true, message: 'File deleted'}); 
					}

				} else {

					callback({success: false, message: "Failed to delete."});
				}
			});

		} else {

			callback({success: false, message: "Failed to delete."});
		}
	});
}
