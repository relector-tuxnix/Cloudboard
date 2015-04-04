(function() {

	"use strict";

	var Resumable = function(opts) {
	
		if((this instanceof Resumable) == false) {
			return new Resumable(opts);
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

		$.defaults = {
			chunkSize: 1*1024*1024,
			simultaneousUploads: 3,
			fileParameterName: 'file',
			query: {},
			bootstrapTarget: '',
			checkTarget: '',
			saveTarget: '/',
			xhrTimeout: 0
		};

		$.opts = opts || {};

		$.getOpt = function(o) {
			var $opt = this;
			// Get multiple option if passed an array
			if(o instanceof Array) {
				var options = {};
				$h.each(o, function(option){
						options[option] = $opt.getOpt(option);
						});
				return options;
			}
			// Otherwise, just return a simple option
			if ($opt instanceof ResumableChunk) {
				if (typeof $opt.opts[o] !== 'undefined') { return $opt.opts[o]; }
				else { $opt = $opt.fileObj; }
			}
			if ($opt instanceof ResumableFile) {
				if (typeof $opt.opts[o] !== 'undefined') { return $opt.opts[o]; }
				else { $opt = $opt.resumableObj; }
			}
			if ($opt instanceof Resumable) {
				if (typeof $opt.opts[o] !== 'undefined') { return $opt.opts[o]; }
				else { return $opt.defaults[o]; }
			}
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

		var onDrop = function(event){
			$h.stopEvent(event);
			appendFilesFromFileList(event.dataTransfer.files, event);
		};

		var onDragOver = function(e) {
			e.preventDefault();
		};

		// INTERNAL METHODS (both handy and responsible for the heavy load)
		var appendFilesFromFileList = function(fileList, event) {

			$h.each(fileList, function(file) {

				var f = new ResumableFile($, file);
				f.container = event.srcElement;

				//Generate a file in database to reflect this files existence

				// Set up request and listen for event
				var xhr = new XMLHttpRequest();

				// Done (either done, failed)
				var doneHandler = function(e) {

					// release listeners
					xhr.removeEventListener('load', doneHandler, false);
					xhr.removeEventListener('error', doneHandler, false);

					if(xhr.status == 200) {

						var response = JSON.parse(xhr.responseText);

						//Let the file be uploaded or continued because on the server side the file is 'Pending', 'Uploading' or 'Failed'
						if(response.success == true && response.file.success != "Processing") {

							var key = response.file.key;
							var existing = $.getFromUniqueIdentifier(key);

							f.identifier = key;

							if(existing == false) {
			
								$.files.push(f);

								$.fire('fileAdded', response.file);

							} else {

								//If the file is complete and a new upload attempt is made remove the existing and recreate the upload
								if(existing.isComplete() == true) {

									existing.cancel();											

									$.files.push(f);

									$.fire('fileAdded', response.file);

								} else {
				
									$.fire('alreadyQueued');
								}
							}

						//The file is 'Failed' or 'Processing'
						} else {
										
							$.fire('alreadyQueued');
						}

					} else {
			
						// HTTP 415/500/501, permanent error
						xhr.abort();

						console.log(status);
						console.log("Unknown Error");
					}
				};

				xhr.addEventListener('load', doneHandler, false);
				xhr.addEventListener('error', doneHandler, false);

				// Set up the basic query data from Resumable
				var query = {
					resumableTotalSize: f.file.size,
					resumableType: f.file.type,
					resumableFilename: f.file.name,
					tags: JSON.stringify($.tags)
				};

				// Add data from the query options
				var data = new FormData();

				$h.each(query, function(k,v) {
					data.append(k,v);
				});

				xhr.open('POST', $.getOpt('bootstrapTarget'));
				xhr.timeout = $.getOpt('xhrTimeout');
				xhr.send(data);
			});
		};


		// INTERNAL OBJECT TYPES
		function ResumableFile(resumableObj, file) {

			var _error = false;
			var $ = this;
			$.opts = {};
			$.getOpt = resumableObj.getOpt;
			$._prevProgress = 0;
			$.resumableObj = resumableObj;
			$.file = file;
			$.fileName = file.fileName||file.name; // Some confusion in different versions of Firefox
			$.size = file.size;
			$.relativePath = file.webkitRelativePath || $.fileName;
			$._pause = false;
			$.container = '';
			$.identifier = '';

			// Callback when something happens within the chunk
			var chunkEvent = function(event, message) {

				// event can be 'success', 'error'
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
						$.resumableObj.uploadNextChunk();
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
					$.chunks.push(new ResumableChunk($.resumableObj, $, offset, chunkEvent));
				}
			};

			$.isUploading = function(){

				var uploading = false;

				$h.each($.chunks, function(chunk){
					if(chunk.status() == 'uploading') {
						uploading = true;
						return(false);
					}
				});

				return(uploading);
			};    

			$.isComplete = function(){

				var outstanding = false;

				$h.each($.chunks, function(chunk){
					
					var status = chunk.status();
					
					if(status === 'pending' || status === 'uploading') {
						outstanding = true;
						return(false);
					}
				});

				return(!outstanding);
			};

			$.pause = function(pause){

				if(typeof(pause) === 'undefined'){
					$._pause = ($._pause ? false : true);
				}else{
					$._pause = pause;
				}
			};

			$.isPaused = function() {
				return $._pause;
			};

			// Bootstrap and return
			$.bootstrap();

			return(this);
		}


		function ResumableChunk(resumableObj, fileObj, offset, callback) {

			var $ = this;
			$.opts = {};
			$.getOpt = resumableObj.getOpt;
			$.resumableObj = resumableObj;
			$.fileObj = fileObj;
			$.fileObjSize = fileObj.size;
			$.fileObjType = fileObj.file.type;
			$.offset = offset;
			$.callback = callback;
			$.lastProgressCallback = (new Date);
			$.tested = false;
			$.retries = 0;
			$.xhr = null;

			// Computed properties
			var chunkSize = $.getOpt('chunkSize');
			$.startByte = $.offset * chunkSize;
			$.endByte = Math.min($.fileObjSize, ($.offset+1)*chunkSize);

			if ($.fileObjSize - $.endByte < chunkSize) {
				// The last chunk will be bigger than the chunk size, but less than 2*chunkSize
				$.endByte = $.fileObjSize;
			}

			// test() makes a GET request without any data to see if the chunk has already been uploaded in a previous session
			$.test = function() {

				//We want to impose a limit on how quickly the checks are done
				window.setTimeout(function() {
		 
					// Set up request and listen for event
					$.xhr = new XMLHttpRequest();

					var testHandler = function(e) {

						$.tested = true;

						var status = $.status();

						if(status === 'success') {

							var response = $.message();

							if(response.message == 'not_found') {

								console.log("Save chunk!");
						
								$.send();
							
							//message = found
							} else {

								console.log("Skip chunk!");
						
								$.resumableObj.uploadNextChunk();
							}

						//Corrupt or other issue like logged out 401
						} else {

							console.log("Error...Cancel upload!");

							$.callback('error', response.message);

							//Cancel all uploads
							$.fileObj.cancel();
						}
					};

					$.xhr.addEventListener('load', testHandler, false);
					$.xhr.addEventListener('error', testHandler, false);

					// Set up the basic query data from Resumable
					var query = {
						// Add extra data to identify chunk
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

					// Add data from the query options
					var data = new FormData();

					$h.each(query, function(k,v) {
						data.append(k,v);
					});

					$.xhr.open('POST', $.getOpt('checkTarget'));
					$.xhr.timeout = $.getOpt('xhrTimeout');
					$.xhr.send(data);
				},0);
			};

			// send() uploads the actual data in a POST call
			$.send = function() {

				if($.tested == false) {
					$.test();
					return;
				}

				// Set up request and listen for event
				$.xhr = new XMLHttpRequest();

				// Done (either done, failed)
				var doneHandler = function(e) {

					var status = $.status();

					if(status == 'success') {

						console.log("Successfully saved chunk!");
						
						$.resumableObj.uploadNextChunk();

					//Corrupt or other issue like logged out 401
					} else {

						console.log("Error...cancel upload!");

						//Cancel all uploads
						$.fileObj.cancel();
					}
				};

				$.xhr.addEventListener('load', doneHandler, false);
				$.xhr.addEventListener('error', doneHandler, false);

				// Set up the basic query data from Resumable
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

				// Add data from the query options
				var data = new FormData();

				$h.each(query, function(k,v) { 
					data.append(k,v);
				});

				//Append our actual data chunk
				data.append($.getOpt('fileParameterName'), bytes);

				$.xhr.open('POST', $.getOpt('saveTarget'));
				$.xhr.timeout = $.getOpt('xhrTimeout');

				$.xhr.send(data);
			};

			$.abort = function() {
				// Abort and reset
				if($.xhr) { 
					$.xhr.abort();
				}

				$.xhr = null;
			};

			$.status = function() {

				// Returns: 'pending', 'uploading', 'success', 'error'
				if(!$.xhr) {

					return('pending');

				} else if($.xhr.readyState < 4) {

				      // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
				      return('uploading');

				} else {

					if($.xhr.status == 200) {

						var message = $.message();

						if( message == '' || message.success == false) {
					
							return('error');
						}	

						// HTTP 200, perfect
						return('success');

					} else {

						// HTTP 415/500/501, permanent error
						$.abort();

						return('error');
					}
				}
			};

			$.message = function(){
				return($.xhr ? JSON.parse($.xhr.responseText) : '');
			};
			
			return(this);
		}

		// QUEUE
		$.uploadNextChunk = function() {

			var found = 0;

			// Now, simply look for the next best thing to upload per file
			$h.each($.files, function(file) {
				
				if(file.isPaused() === false) {
				
					$h.each(file.chunks, function(chunk) {
					
						if(chunk.status() == 'pending') {

							//Send the chunk to the server side to be saved!
							chunk.send();

							found++;

							return;
						}
					});
				}

				//We have reached our upper limit on active uploads
				if(found == $.getOpt('simultaneousUploads')) {

					return;
				}
			});

			//We have file chunks uploading
			if(found != 0) {
				return;
			}

			// The are no more outstanding chunks to upload, check is everything is done
			var outstanding = false;

			$h.each($.files, function(file) {
				
				if(file.isComplete() == false) {

					outstanding = true;

					return(false);
				}
			});

			if(outstanding == false) {
				// All chunks have been uploaded, complete
				$.fire('complete');
			}
		
			return(false);
		};


		/*
		 *  PUBLIC METHODS FOR RESUMABLE.JS
		 */

		$.setTags = function(tags) {
			$.tags = tags;
		};

		$.assignBrowse = function(domNodes) {

			if(typeof(domNodes.length) == 'undefined') {
				domNodes = [domNodes];
			}

			$h.each(domNodes, function(domNode) {

				var input;
				
				if(domNode.tagName==='INPUT' && domNode.type==='file') {

					input = domNode;

				} else {

					input = document.createElement('input');
					input.setAttribute('type', 'file');
					input.style.display = 'none';

					domNode.addEventListener('click', function() {
						input.style.opacity = 0;
						input.style.display='block';
						input.focus();
						input.click();
						input.style.display='none';
					}, false);

					domNode.appendChild(input);
				}
				
				input.setAttribute('multiple', 'multiple');
				input.removeAttribute('webkitdirectory');
				
				// When new files are added, simply append them to the overall list
				input.addEventListener('change', function(e) {
					appendFilesFromFileList(e.target.files, e);
					e.target.value = '';
				}, false);
			});
		};

		$.assignDrop = function(domNodes) {
			if(typeof(domNodes.length)=='undefined') domNodes = [domNodes];

			$h.each(domNodes, function(domNode) {
				    domNode.addEventListener('dragover', onDragOver, false);
				    domNode.addEventListener('drop', onDrop, false);
			});
		};

		$.unAssignDrop = function(domNodes) {
			if (typeof(domNodes.length) == 'undefined') domNodes = [domNodes];

			$h.each(domNodes, function(domNode) {
				domNode.removeEventListener('dragover', onDragOver);
				domNode.removeEventListener('drop', onDrop);
			});
		};

		$.isUploading = function() {
			var uploading = false;

			$h.each($.files, function(file) {
				if(file.isUploading()) {
					uploading = true;
					return(false);
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

			$.uploadNextChunk();
		};

		$.pause = function(){

			// Resume all chunks currently being uploaded
			$h.each($.files, function(file){
				file.abort();
			});

			$.fire('pause');
		};

		$.cancelOne = function(key) {

			var file = $.getFromUniqueIdentifier(key);

			if(file != false) {
				file.cancel();	
			}	
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
