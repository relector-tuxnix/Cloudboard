var fs = require('fs');
var framework = require('total.js');
var path = require('path');
var util = require('util');

module.exports = resumable = function() {
	
	var $ = this;

	$.temporaryFolder = framework.config['files-tmp-dir'];
	$.maxFileSize = null;

	var cleanIdentifier = function(identifier) {

		return identifier.replace(/^0-9A-Za-z_-/img, '');
	}

	var getChunkFilename = function(self, chunkNumber, identifier) {

		// Clean up the identifier
		identifier = cleanIdentifier(identifier);

		return path.join($.temporaryFolder, 'resumable-' + identifier + '-' + self.user.id + '.' + chunkNumber);
	}

	var validateRequest = function(chunkNumber, chunkSize, totalSize, identifier, filename, fileSize){

		// Clean up the identifier
		identifier = cleanIdentifier(identifier);

		// Check if the request is sane
		if (chunkNumber==0 || chunkSize==0 || totalSize==0 || identifier.length==0 || filename.length==0) {
			return 'non_resumable_request';
		}

		var numberOfChunks = Math.max(Math.floor(totalSize/(chunkSize*1.0)), 1);

		if(chunkNumber > numberOfChunks) {
			return 'invalid_resumable_request1';
		}

		// Is the file too big?
		if($.maxFileSize && totalSize > $.maxFileSize) {
			return 'invalid_resumable_request2';
		}

		if(typeof(fileSize) != 'undefined') {

			if(chunkNumber < numberOfChunks && fileSize != chunkSize) {

				// The chunk in the POST request isn't the correct size
				return 'invalid_resumable_request3';
			}

			if(numberOfChunks > 1 && chunkNumber == numberOfChunks && fileSize != ((totalSize % chunkSize) + chunkSize)) {

				// The chunks in the POST is the last one, and the fil is not the correct size
				return 'invalid_resumable_request4';
			}

			if(numberOfChunks == 1 && fileSize != totalSize) {

				// The file is only a single chunk, and the data size does not fit
				return 'invalid_resumable_request5';
			}
		}

		return 'valid';
	}

	//'found'
	//'not_found'
	$.get = function(self, callback) {

		var chunkNumber = self.post.resumableChunkNumber;
		var chunkSize = self.post.resumableChunkSize;
		var totalSize = self.post.resumableTotalSize;
		var identifier = self.post.resumableIdentifier;
		var filename = self.post.resumableFilename;
		var originalFilename = self.post.resumableRelativePath;
		var totalChunks = self.post.resumableTotalChunks;

		var validate = validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename);

		console.log('VALIDATE');
		console.log(validate);
		
		if(validate == 'valid') {

			var chunkFilename = getChunkFilename(self, chunkNumber, identifier);

			fs.exists(chunkFilename, function(exists) {

				if(exists) {

					callback('found');

				} else {

					callback('not_found');
				}
			});

		} else {

			callback('not_found');
		}
	}

	//'partly_done'
	//'done'
	//'failed'
	$.post = function(self, callback) {

		//This can happen is the user does not have enough priviledges to read the file from their filesystem
		if(self.files.length != 1) {

			callback('failed');

			return;
		}

		var file = self.files.pop();

console.log(file);

		var chunkNumber = self.post.resumableChunkNumber;
		var chunkSize = self.post.resumableChunkSize;
		var totalSize = self.post.resumableTotalSize;
		var identifier = self.post.resumableIdentifier;

		var validate = validateRequest(chunkNumber, chunkSize, totalSize, identifier, file.length);

console.log(validate);

		if(validate == 'valid') {
		
			var chunkFilename = getChunkFilename(self, chunkNumber, identifier);

console.log(chunkFilename);

			// Save the chunk (TODO: OVERWRITE)
			fs.rename(file.path, chunkFilename, function() {

				// Do we have all the chunks?
				var currentTestChunk = 1;
				var numberOfChunks = Math.max(Math.floor(totalSize/(chunkSize*1.0)), 1);

				var testChunkExists = function() {

					fs.exists(getChunkFilename(self, currentTestChunk, identifier), function(exists) {
					
						if(exists) {

							currentTestChunk++;
						
							if(currentTestChunk > numberOfChunks) {

								callback('done');

							} else {

								// Recursion
								testChunkExists();
							}

						} else {

							console.log("WE ARE HERE!!");
							callback('partly_done');
						}
					});
				}

				testChunkExists();
			});

		} else {

			console.log("HERE2@");

			callback('failed');
		}
	}

	$.completeFile = function(self, callback) {

		var identifier = self.post.resumableIdentifier;
		var filename = self.post.resumableFilename;

		var completeFile = path.join($.temporaryFolder, filename);

		var stream = fs.createWriteStream(completeFile);

		$.write(self, identifier, stream);

		stream.on('finish', function() { 

			callback('done');
		});

		stream.on('error', function() { 

			callback('failed');
		});
	};

	// Pipe chunks directly in to an existsing WritableStream to create a single file
	$.write = function(self, identifier, writableStream) {

		// Iterate over each chunk
		var pipeChunk = function(number) {

			var chunkFilename = getChunkFilename(self, number, identifier);

			fs.exists(chunkFilename, function(exists) {

				if(exists == true) {

					// If the chunk with the current number exists,
					// then create a ReadStream from the file
					// and pipe it to the specified writableStream.
					var sourceStream = fs.createReadStream(chunkFilename);

					sourceStream.pipe(writableStream, {
						end: false
					});

					sourceStream.on('end', function() {
						// When the chunk is fully streamed, jump to the next one
						pipeChunk(number + 1);
					});

				} else {
					// When all the chunks have been piped, end the stream
					writableStream.end();
				}
			});
		}

		pipeChunk(1);
	}


	$.clean = function(self, identifier) {
	
		// Iterate over each chunk
		var pipeChunkRm = function(number) {

			var chunkFilename = getChunkFilename(self, number, identifier);

			fs.exists(chunkFilename, function(exists) {
			
				if(exists == true) {

					fs.unlink(chunkFilename, function(err) {

						if(err != null) {
							console.log(err);
						}
					});

					pipeChunkRm(number + 1);
				}
			});
		}

		pipeChunkRm(1);
	}

	return $;
}
