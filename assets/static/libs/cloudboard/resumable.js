(function() {

	"use strict";

	var Resumable = function(bootstrapTarget, checkTarget, saveTarget) {
	
		if((this instanceof Resumable) == false) {
			return new Resumable(bootstrapTarget, checkTarget, saveTarget);
		}

		this.version = 1.0;

		// SUPPORTED BY BROWSER?
		// Check if these features are support by the browser:
		// - File object type
		// - Blob object type
		// - FileList object type
		// - slicing files
		this.support = ((typeof(File)!=='undefined') &&
				(typeof(Blob)!=='undefined') &&
				(typeof(FileList)!=='undefined') &&
				(!!Blob.prototype.webkitSlice||!!Blob.prototype.mozSlice||!!Blob.prototype.slice||false));

		if(this.support == false) {
			return(false);
		}

		// PROPERTIES
		var $ = this;

		$.files = [];
		$.tags = [];
		$.allowPublic = false;

		$.defaults = {
			chunkSize: 1*1024*1024,
			simultaneousUploads: 1,
			fileParameterName: 'file',
			query: {},
			xhrTimeout: 0,
			bootstrapTarget: bootstrapTarget,
			checkTarget: checkTarget,
			saveTarget: saveTarget
		};

		$.getOpt = function(o) {
			return $.defaults[o];
		};
    
		// EVENTS
		// catchAll(event, ...)
		// fileSuccess(file), fileProgress(file), fileAdded(file, event), fileRetry(file), fileError(file, message),
		// complete(), error(message, file), pause()
		$.events = [];

		$.on = function(event, callback) {
			$.events.push(event.toLowerCase(), callback);
		};

		$.fire = function() {

			// `arguments` is an object, not array, in FF, so:
			var args = [];

			for (var i=0; i < arguments.length; i++) args.push(arguments[i]);

			// Find event listeners, and support pseudo-event `catchAll`
			var event = args[0].toLowerCase();

			for(var i = 0; i <= $.events.length; i += 2) {
				if($.events[i]==event) $.events[i+1].apply($,args.slice(1));
				if($.events[i]=='catchall') $.events[i+1].apply(null,args);
			}
		};

	
		/*
		 *  INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
		 */

		var $h = {
			stopEvent: function(e) {
				e.stopPropagation();
				e.preventDefault();
	   		},

			each: function(o, callback) {

				if(typeof(o.length) !== 'undefined') {

					for (var i = 0; i < o.length; i++) {
						// Array or FileList
						if(callback(o[i]) === false) return;
					}

				} else {
					
					for(i in o) {
						// Object
						if(callback(i, o[i]) === false) return;
					}
				}
			},

			generateUniqueIdentifier: function(file) {
				var relativePath = file.webkitRelativePath||file.fileName||file.name; // Some confusion in different versions of Firefox
				var size = file.size;
				return(size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
			}
		};

		/* INTERNAL METHODS (both handy and responsible for the heavy load) */
		var appendFilesFromFileList = function(fileList, event) {

			$h.each(fileList, function(file) {

				var f = new ResumableFile($, file);
				f.container = event.srcElement;

				/* Set up the basic query data from Resumable */
				var query = {
					resumableTotalSize: f.file.size,
					resumableType: f.file.type,
					resumableFilename: f.file.name,
					tags: $.tags,
					allowPublic: $.allowPublic
				};

				/* Add data from the query options */
				var data = new FormData();

				$h.each(query, function(k,v) {
					data.append(k,v);
				});

				/* Generate a file in database to reflect this files existence */
				$.ajax({
					xhr: function () {
						var xhr = $.ajaxSettings.xhr();
						xhr.upload.onprogress = function (e) {
							console.log(Math.floor(e.loaded / e.total * 100) + '%');
						};
						return xhr;
					},
					contentType: false,
					processData: false,
					type: 'POST',
					data: data,
					url: $.getOpt("bootstrapTarget"),
					success: function(response) {

						console.log("Successfully bootstraped file!");

						/* Let the file be uploaded or continued because on the server side the file is 'Pending', 'Uploading' or 'Failed' */
						if(response.file._success != "Processing") {

							var key = response.file._key;
							var existing = $.getFromUniqueIdentifier(key);

							f.identifier = key;

							if(existing == false) {
			
								$.files.push(f);

								$.fire('fileAdded', response.file);

							} else {

								/* If the file is complete and a new upload attempt is made remove the existing and recreate the upload */
								if(existing.isComplete() == true) {

									existing.cancel();											

									$.files.push(f);

									$.fire('fileAdded', response.file);

								} else {
				
									$.fire('alreadyQueued');
								}
							}

						/* The file is 'Failed' or 'Processing' */
						} else {
										
							$.fire('alreadyQueued');
						}
					},
					error: function() {

						console.log("Error occured testing upload... cancelling upload!");

						$.callback('error', 'Error...cancel upload');

						/* Cancel all uploads */
						$.fileObj.cancel();
					},
					complete: function() {}
				});
			});
		};


		/* INTERNAL OBJECT TYPES */
		function ResumableFile(resumableObj, file) {

			var _error = false;
			var $ = this;
			$.getOpt = resumableObj.getOpt;
			$._prevProgress = 0;
			$.resumableObj = resumableObj;
			$.file = file;
			$.fileName = file.fileName||file.name; /* Some confusion in different versions of Firefox */
			$.size = file.size;
			$.relativePath = file.webkitRelativePath || $.fileName;
			$._pause = false;
			$.container = '';
			$.identifier = '';

			/* Callback when something happens within the chunk */
			var chunkEvent = function(event, message) {

				/* event can be 'success', 'error' */
				switch(event) {

					case 'error':

						console.log("ERE: " + message);
						$.abort();
						_error = true;
						$.chunks = [];
						$.resumableObj.fire('fileError', message);
						break;

					case 'success':
						if(_error) return;

						break;
				}
			};

			// Main code to set up a file object with chunks, packaged to be able to handle retries if needed.
			$.chunks = [];

			$.abort = function() {

				$h.each($.chunks, function(c) {

					if(c.status() === 'uploading') {
						c.abort();
					}
				});
			};

			$.cancel = function() {
			
				// Reset this file to be void
				var _chunks = $.chunks;

				$.chunks = [];

				// Stop current uploads
				$h.each(_chunks, function(c){
					
					if(c.status() == 'uploading') {
						c.abort();
					}
				});

				$.resumableObj.removeFile($);
			};

			$.bootstrap = function() {
			
				$.abort();
				_error = false;

				// Rebuild stack of chunks from file
				$.chunks = [];
				$._prevProgress = 0;

				var maxOffset = Math.max(Math.floor($.file.size / $.getOpt('chunkSize')), 1);

				//Generate chunks and callback for events
				for (var offset = 0; offset < maxOffset; offset++) {

					(function(offset){
						window.setTimeout(function(){
							$.chunks.push(new ResumableChunk($.resumableObj, $, offset, chunkEvent));
						}, 0);
					})(offset);
				}
			};

			$.isUploading = function() {

				var uploading = false;

				$h.each($.chunks, function(chunk) {

					if(chunk.status() == 'uploading') {
						uploading = true;

						return false;
					}
				});

				return uploading;
			};    

			$.isComplete = function(){

				var outstanding = false;

				$h.each($.chunks, function(chunk){
					
					var status = chunk.status();
					
					if(status === 'pending' || status === 'uploading') {
						outstanding = true;

						return false;
					}
				});

				return !outstanding;
			};

			$.pause = function() {

				if($.isPaused() == true) {
					return;
				}

				$.abort();

				$._pause = true;
			};

			$.resume = function() {
	
				$._pause = false;	
			};

			$.isPaused = function() {

				return $._pause;
			};

			/* Bootstrap and return */
			$.bootstrap();

			return(this);
		}


		function ResumableChunk(resumableObj, fileObj, offset, callback) {

			var $ = this;
			$.getOpt = resumableObj.getOpt;
			$.resumableObj = resumableObj;
			$.fileObj = fileObj;
			$.fileObjSize = fileObj.size;
			$.fileObjType = fileObj.file.type;
			$.offset = offset;
			$.callback = callback;
			$.lastProgressCallback = (new Date);
			$.retries = 0;

			/* Computed properties */
			var chunkSize = $.getOpt('chunkSize');
			$.startByte = $.offset * chunkSize;
			$.endByte = Math.min($.fileObjSize, ($.offset+1)*chunkSize);

			if($.fileObjSize - $.endByte < chunkSize) {

				/* The last chunk will be bigger than the chunk size, but less than 2*chunkSize */
				$.endByte = $.fileObjSize;
			}

			/* test() makes a GET request without any data to see if the chunk has already been uploaded in a previous session */
			$.test = function() {

				/* Add data from the query options */
				var data = new FormData();

				/* Set up the basic query data from Resumable */
				var query = {

					/* Add extra data to identify chunk */
					resumableChunkNumber: $.offset + 1,
					resumableChunkSize: $.getOpt('chunkSize'),
					resumableCurrentChunkSize: $.endByte - $.startByte,
					resumableTotalSize: $.fileObjSize,
					resumableType: $.fileObjType,
					resumableFilename: $.fileObj.fileName,
					resumableRelativePath: $.fileObj.relativePath,
					resumableTotalChunks: $.fileObj.chunks.length,
					resumableIdentifier: $.fileObj.identifier
				};

				$h.each(query, function(k,v) {
					data.append(k,v);
				});

				$.ajax({
					xhr: function () {
						var xhr = $.ajaxSettings.xhr();
						xhr.upload.onprogress = function (e) {
							console.log(Math.floor(e.loaded / e.total * 100) + '%');
						};
						return xhr;
					},
					contentType: false,
					processData: false,
					type: 'POST',
					data: data,
					url: $.getOpt("checkTarget"),
					success: function(response) {

						console.log("Successfully tested chunk!");
					
						if(response.message == 'not_found') {

							console.log("Save chunk!");

							$.send();
						
						/* message = found */
						} else {

							console.log("Skip chunk!");
					
							$.resumableObj.uploadNextChunk();
						}
					},
					error: function() {

						console.log("Error occured testing upload... cancelling upload!");

						$.callback('error', 'Error...cancel upload');

						/* Cancel all uploads */
						$.fileObj.cancel();
					},
					complete: function() {}
				});
			};

			// uploads the actual data in a POST call
			$.send = function() {

				console.log("Sending!");

				/* Add data from the query options */
				var data = new FormData();

				/* Set up the basic query data from Resumable */
				var query = {
					resumableChunkNumber: $.offset + 1,
					resumableChunkSize: $.getOpt('chunkSize'),
					resumableCurrentChunkSize: $.endByte - $.startByte,
					resumableTotalSize: $.fileObjSize,
					resumableType: $.fileObjType,
					resumableFilename: $.fileObj.fileName,
					resumableRelativePath: $.fileObj.relativePath,
					resumableTotalChunks: $.fileObj.chunks.length,
					resumableIdentifier: $.fileObj.identifier
				};

				var func = ($.fileObj.file.slice ? 'slice' : ($.fileObj.file.mozSlice ? 'mozSlice' : ($.fileObj.file.webkitSlice ? 'webkitSlice' : 'slice')));
				var bytes = $.fileObj.file[func]($.startByte,$.endByte);

				$h.each(query, function(k,v) { 
					data.append(k,v);
				});

				/* Append our actual data chunk */
				data.append($.getOpt('fileParameterName'), bytes);

				$.ajax({
					xhr: function () {
						var xhr = $.ajaxSettings.xhr();
						xhr.upload.onprogress = function (e) {
							console.log(Math.floor(e.loaded / e.total * 100) + '%');
						};
						return xhr;
					},
					contentType: false,
					processData: false,
					type: 'POST',
					data: data,
					url: $.getOpt("saveTarget"),
					success: function(response) {

						console.log("Successfully saved chunk!");
					
						$.resumableObj.uploadNextChunk();
					},
					error: function() {

						console.log("Error occured cancelling upload!");

						$.callback('error', 'Error...cancel upload');

						/* Cancel all uploads */
						$.fileObj.cancel();
					},
					complete: function() {
						console.log("Complete");
					}
				});
			};
	
			return(this);
		}

		// This controls the uploading after a ResumableFile has been bootstrapped with the server and r.upload is called
		$.uploadNextChunk = function() {

			console.log("Looking for chunk to upload!");

			var found = false;
			var count = 0;

			// Now, simply look for the next best thing to upload per file
			$h.each($.files, function(file) {
				
				if(file.isPaused() === false && file.isUploading() === false) {
				
					$h.each(file.chunks, function(chunk) {
					
						if(chunk.status() == 'pending') {

							//Send the chunk to the server side to be saved!
							chunk.test();

							found = true;

							return false;
						}
					});
				}

				if(found == true) {
					return false;
				}
			});

			//We have file chunks uploading
			if(found == true) {
				return;
			}

			// The are no more outstanding chunks to upload, check is everything is done
			var outstanding = false;

			$h.each($.files, function(file) {
				
				if(file.isComplete() == false) {

					outstanding = true;

					return false;
				}
			});

			if(outstanding == false) {
				// All chunks have been uploaded, complete
				$.fire('complete');
			}
		
			return;
		};


		/*
		 *  PUBLIC METHODS FOR RESUMABLE.JS
		 */

		$.setTags = function(tags) {
			$.tags = tags;
		};

		$.setPublic = function(state) {
			$.allowPublic = state;
		};

		$.assignBrowse = function(box, input) {

			box.addEventListener('click', function() {
				input.style.opacity = 0;
				input.style.display='block';
				input.focus();
				input.click();
				input.style.display='none';
			}, false);

			// When new files are added, simply append them to the overall list
			input.addEventListener('change', function(e) {
				appendFilesFromFileList(e.target.files, e);
				e.target.value = '';
			}, false);
		};

		var onDrop = function(event) {

			$h.stopEvent(event);

			appendFilesFromFileList(event.dataTransfer.files, event);
		};

		var onDragOver = function(e) {

			e.preventDefault();
		};

		$.assignDrop = function(box) {

			box.addEventListener('dragover', onDragOver, false);
			box.addEventListener('drop', onDrop, false);
		};

		$.unAssignDrop = function(box) {
			box.removeEventListener('dragover', onDragOver);
			box.removeEventListener('drop', onDrop);
		};

		$.isUploading = function() {

			var uploading = false;

			$h.each($.files, function(file) {

				if(file.isUploading() == true) {
					uploading = true;

					return;
				}
			});

			return(uploading);
		};

		//Called from newFile
		$.upload = function() {

			// Make sure we don't start too many uploads at once
			if($.isUploading()) {
				return;
			}

			// Kick off the queue
			$.fire('uploadStart');

			//Start upload for more then one file
			for (var num=1; num <= $.getOpt('simultaneousUploads'); num++) {
				$.uploadNextChunk();
			}
		};

		$.resumeOne = function(key) {

			var file = $.getFromUniqueIdentifier(key);

			if(file != false) {

				file.resume();	

				$.upload();

				return true;

			} else {

				console.log("Please queue the file again!");

				return false;
			}			
		};

		$.pauseOne = function(key) {

			var file = $.getFromUniqueIdentifier(key);

			if(file != false) {

				file.pause();	

				return true;
			}	

			return false;
		};

		$.pauseAll = function(){

			// Resume all chunks currently being uploaded
			$h.each($.files, function(file){
				file.pause();
			});

			$.fire('pause');
		};

		$.cancelOne = function(key) {

			var file = $.getFromUniqueIdentifier(key);

			if(file != false) {

				file.cancel();	

				return true;
			}	

			return false;
		};

  	  	$.cancelAll = function() {

	 		for(var i = $.files.length - 1; i >= 0; i--) {
				$.files[i].cancel();
		   	}
		
			//$.fire('cancelAll');
    		};

		$.removeFile = function(file) {

			for(var i = $.files.length - 1; i >= 0; i--) {
				if($.files[i] === file) {
					$.files.splice(i, 1);
				}
			}
		};

		$.getFromUniqueIdentifier = function(key) {
			var ret = false;

			$h.each($.files, function(f) {
				if(f.identifier == key) {
					ret = f;
				}
			});

			return(ret);
		};

		return(this);
	};


	window.Resumable = Resumable;	
})();
