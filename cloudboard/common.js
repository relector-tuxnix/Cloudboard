var F = require('total.js');
var fs = require('fs');
var hb = require('handlebars');
var hb = require('handlebars');
var hbs = require('handlebars-form-helpers');
var cuid = require('cuid');
var gm = require('gm');
var async = require('async');

var $ = module.exports = require('../elastic-core/common.js');

var defaultLimit = 50;
var fileStoreLocation = F.config['files-dir'];
var tmpStoreLocation = F.config['files-tmp-dir'];
var originalLocation = F.config['files-original-dir'];
var mediumThumbLocation = F.config['files-medium-thumb-dir'];
var smallThumbLocation = F.config['files-small-thumb-dir'];


F.once('load', function() {
 
	$.defaultLimit = F.config['default-item-limit'];

	$.defaultTheme = F.config['default-theme'];

	console.log(`LOADED CLOUDBOARD WITH THEME ${$.defaultTheme}`);

	var pages = require(`./${$.defaultTheme}-pages.js`);

	$.registerPages(pages);

	$.processRoutes();	
});


$.CBStoreFile = function(user, totalSize, mime, filename, tags, allowPublic, callback) {

	var generateFile = function() {

		var body = {};
		
		body._key = cuid();
		body._type = "file";
		body._name = filename;		
		body._user = user;
		body._public = allowPublic;
		body._active = "false";
		body._mime = mime;
		body._size = totalSize;
		body._success = 'Pending';
		body._message = 'Waiting to start upload...'; 
		body._tags = tags; 
		body._meta = {width: 0, height: 0};
		body._created = new Date();

		$.ECStore(body._key, body, function(response) {

			console.log(response);

			callback(body);
		});
	};

	/*
	 * If the file is not 'active' then allow it to be resumed, although further down the path 
	 * if the file is in a state of 'Processing' then don't allow it to be continued 
	 */
	var query = [`_name = "${filename}"`, `_size = "${totalSize}"`, `_user = "${user}"`, `_active = "false"`];

	$.ECGet(query, 3, [], [], [], function(result) {

		if(result.success == false) {

			console.log("FOUND NONE...so GENERATE!");

			generateFile();

		} else if(result.message.length == 1) {

			console.log("FOUND 1..so UPDATING");

			var file = result.message[0];

			//Reset the status of the file
			file._success = "Pending";
			file._message = 'Waiting to start upload...'; 

			//We generate a date...as we sort by the created timestamp and we want the latest changes at the top
			file._created = new Date();

			$.ECStore(file._key, file, function(newFile) {

				console.log(newFile);

				callback(newFile);
			});

		} else {
	
			console.log("FOUND SEVERAL...although this should never happen!");

			callback(null);
		}
	});
};


function deleteFile(path, filename) {

	fs.unlink(`${path}${filename}`, function (err) {

		/* If the file failed to be deleted its likely because it doesn't exist! */
		if(err != null) {

			console.log(err);
		}	
	});		
};


$.CBCompleteFile = function(file, callback) {

	/* Run ten simultaneous uploads */
	var queue = async.queue(uploadFile, 10);

	queue.drain = function() {
		console.log("All files are uploaded.");
	};

	queue.push(file, function(newFile, successful) {

		if(successful == true) {

			file._success = 'Successful';
			file._message = 'Successfully stored.';
			file._active = "true";
	
		} else {

			file._success = 'Failed';
			file._message = 'Could not process file.';
			file._active = "false";
		}

		file._created = new Date();

		$.ECStore(newFile._key, newFile, function(finalFile) {

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
	console.log(file._key);
	
	fs.rename(`${tmpStoreLocation}${file.name}`, `${originalLocation}${file.key}`, function(errFull) {
			
		if(errFull != null) {

			console.log(errFull);

			callback(file, false);

		} else {

			console.log(`FILE SAVED TO FILES: ${originalLocation}${file.key}`);

			if(file.type.indexOf('image/') == -1) {

				callback(file, true);
		
			} else {

				gm(`${originalLocation}${file.key}`).resize('200', '200', '>').write(`${smallThumbLocation}${file.key}`, function(errSmall) {

					if(errSmall != null) {

						deleteFile(originalLocation, file.key);

						console.log(errSmall);

						callback(file, false);

					} else {

						console.log("Generating small thumb!");	

						gm(`${originalLocation}${file.key}`).resize('450', '450', '>').write(`${mediumThumbLocation}${file.key}`, function(errMedium) {

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


$.CBGetFiles = function(user, range, last, order, limit, active, callback) {

	var query = [`_type = "file"`];

	if(user == null || user == "") {

		query.push(`_public = "true"`);

	} else {

		query.push(`_user = "${user}"`);
	}

	if(active != null && active != "") {

 		query.push(`_active = "${active}"`);
	}

	$.ECGet(query, 1, [], [], [], function(result) {

		callback(result);
	});
};


$.CBGetFile = function(user, key, callback) {

	var query = [`_type = "file"`, `_key = "${key}"`];

	if(user == null || user == "") {

		query.push(`_public = "true"`);

	} else {

		query.push(`_user = "${user}"`);
	}

	$.ECGet(query, 1, [], [], [], function(result) {

		callback(result);
	});
};


$.CBSaveTag = function(user, key, tag, callback) {

	var query = [`_key = "${key}"`, `_user = "${user}"`];

	$.ECGet(query, 1, [], [], [], function(result) {

		if(result.success == false) {

			callback({success: false, message: 'Could not find file.'});

		} else {
			
			var file = result.message[0];
	
			if(file._tags.indexOf(tag) != -1) {

				callback({success: false, messsage: 'Tag already applied to file.'});

			} else {

				file._tags.push(tag);

				$.ECStore(file._key, file, function(result) {
			
					callback(result);
				});
			}
		}
	});
};


$.CBRemoveTag = function(user, key, tag, callback) {

	var query = [`_key = "${key}"`, `_user = "${user}"`, `"${tag}" IN _tags`];

	$.ECGet(query, 1, [], [], [], function(result) {

		if(result.success == false) {

			callback({success: false, message: 'Could not find file.'});

		} else {
			
			var file = result.message[0];
	
			if(file._tags.indexOf(tag) == -1) {

				callback({success: false, messsage: 'Tag not applied to file.'});

			} else {

				file._tags.pop(tag);

				$.ECStore(file._key, file, function(result) {
			
					callback(result);
				});
			}
		}
	});
};


$.CBRemoveFile = function(user, key, callback) {

	var query = [`_key = "${key}"`, `_user = "${user}"`];

	$.ECGet(query, 1, [], [], [], function(result) {

		if(result.success == false) {

			callback({success: false, message: "Could not find file to delete."});

		} else {

			var file = result.message[0];

			$.ECDelete(file._key, function(result) {

				if(result.success == false) {

					callback({success: false, message: "Failed to delete."});

				} else {

					/* Delete the original file */
					deleteFile(originalLocation, file._key);

					/* If its not an image then we don't need to delete the thumbnails */
					if(file._mime.indexOf('image/') == -1) {

						callback({success: true, message: 'File deleted'}); 

					} else {

						deleteFile(mediumThumbLocation, file._key);
						deleteFile(smallThumbLocation, file._key);

						callback({success: true, message: 'File deleted'}); 
					}
				}
			});
		}
	});
};
