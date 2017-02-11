var $ = exports;

var fs = require('fs');
var common = require('../../cloudboard/common.js');
var resumable = require('../../cloudboard/resumable-node.js')();

$.apiGetFiles = function() {

	var self = this;

	var user = self.user._id;
	var range = self.body["range[]"];
	var last = self.body["last[]"];
	var order = self.body["order[]"];
	var limit = self.body.limit;
	var active = self.body.active;

	common.CBGetFiles(user, range, last, order, limit, active, function(result) {

		self.json(result);
	});
};

$.apiGetFile = function() {

	var self = this;
	
	var user = self.user._id;
	var key = self.body.key;

	common.CBGetFile(user, key, function(result) {

		self.json(result);
	});
};

/* Need to do serious security checks here! */
$.apiReturnFile = function(type, key) {

	var self = this;

	var user = self.user._id;
	var key = self.body.key;

	/* Check user has that file in db and if they do return it with the mime type set...otherwise return 404 */
	common.CBGetFile(user, key, function(result) {

		if(result.success == false) {

			self.view404();

		} else {

			var file = result.message[0];

			//Set the download name to the orignal filename rather then the file key
			var headers = [];
			headers['Content-Type'] = file._mime;
			headers['Access-Control-Allow-Origin'] = '*';

			var filename = self.config[`"files-${type}-dir"`] + file._key;

			var fullPath = F.path.root(filename);

			fs.exists(fullPath, function(exists) {
			
				if(exists == false) {

					self.file('/images/cloudboard/file-generic-icon-' + type + '.png');
			
				} else {

					self.file('~' + fullPath, file._name, headers);
				}
			});
		}
	});
};

$.apiBootstrapFile = function() {

	var self = this;

	var user = self.user._id;
	var totalSize = self.body.resumableTotalSize;
	var mime = self.body.resumableType;
	var filename = self.body.resumableFilename;
	var tags = self.body["tags[]"];
	var allowPublic = self.body.allowPublic;

	common.CBStoreFile(user, totalSize, mime, filename, tags, allowPublic, function(file) {

		if(file == null) {

			self.view500('An error occued during the upload. Could not bootstrap file.');

		} else {

			self.json({success: true, message: 'Found or Generated file.', file: file});
		}
	});
};

$.apiCheckFile = function() {

	var self = this;

	var user = self.user._id;
	var key = self.body.resumableIdentifier;
	var chunkNumber = self.body.resumableChunkNumber;
	var totalChunks = self.body.resumableTotalChunks;

	/* Returns: FOUND, NOT_FOUND */
	resumable.get(self, function(status) {

		common.CBGetFile(user, key, function(result) {

			if(result.success == false) {

				self.json({success: false, message: 'An error occued during the upload.'});

			} else {

				var file = result.message[0]; 

				file.success = 'Uploading';
				file.message = Math.round((chunkNumber / totalChunks) * 100) + '%';

				common.ECStore(file._key, file, function(newFile) {

					if(newFile == null) {

						self.json({success: false, message: 'Failed to update file.'});

					} else {
					
						if(status == 'found') {

							self.json({success: true, message: 'found'});

						} else {

							self.json({success: true, message: 'not_found'});
						}
					}
				});
			}
		});

	});
};

$.apiSaveFile = function() {

	var self = this;

	var user = self.user._id;
	var key = self.body.resumableIdentifier;

	/* Do not delete temporary files until the end of the request */
	self.noClear(true);	

	common.CBGetFile(user, key, function(result) {

		if(result.success == false) {

			self.json({success: false, message: 'An error occued during the upload.', file: null});

		} else {

			var file = result.message[0]; 

			/* Returns: DONE, PARTLY_DONE, FAILED */
			resumable.post(self, function(status) {

				console.log(`STATUS: '${status}'`);
				console.log(file._key);

				if(status == 'done') {

					file._success = 'Processing';
					file._message = 'Post Processing...';
					file._active = false;
					file._created = new Date();

					common.ECStore(file._key, file, function(finalFile) {

						if(finalFile.success == false) {

							self.json({success: false, message: 'Failed to complete file upload.'});

						} else {
						
							self.json({success: true, message: status});
						}	
					});

					/* Move the chunks into a single file to be processed! */
					resumable.completeFile(self, function(status) {

						/* 
						 * Now move the temp file to the file store and perform any manipulations to the file
						 * The user does not need to wait for this due to it potentially being very slow process...especially large files
						 * If the status is failed from completeFile then we will let EBCompleteFile handle it and update the status
						 */
						common.CBCompleteFile(file, function() {

							/* Remove the temporary upload files */
							resumable.clean(self, file._key);
						});
					});

				} else if(status == 'failed') {

					file._success = 'Failed';
					file._message = 'Failed to upload file.';

					/* Remove the temporary upload files */
					resumable.clean(self, file._key);

					common.ECStore(file._key, file, function(result) {

						self.json(result)
					});

				/* partly_done */
				} else {

					self.json({success: true, message: status});
				}
			});
		}
	});
};

$.apiRemoveFile = function() {

	var self = this;

	var key = self.body.key;
	var user = self.user._id;

	common.CBRemoveFile(user, key, function(result) {

		self.json(result);	
	});
};

$.apiSaveTag = function() {

	var self = this;

	var key = self.body.key;
	var user = self.user._id;
	var tag = self.body.tag;

	common.CBSaveTag(user, key, tag, function(result) {

		self.json(result);
	});
};

$.apiRemoveTag = function() {

	var self = this;

	var key = self.body.key;
	var user = self.user._id;
	var tag = self.body.tag;

	common.CBRemoveTag(user, key, tag, function(result) {

		self.json(result);
	});
};
