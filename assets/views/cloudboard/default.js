$(document).ready(function() {

	var doit;
	var lastId = '';
	var fileCount = 0;
	var selected = null;

	clearGrid();
	getFiles(lastId, -1);

	function clearGrid() {

		var fileItem = $('#default-file-item').clone();
		var detailsItem = $('#default-details-item').clone();
		
		$('#grid').empty();
		$('#grid').append(fileItem);
		$('#grid').append(detailsItem);
	};

	function generateGrid(data) {

		data.forEach(function(file) {

			console.log(file);

			fileCount++;
		
			lastId = file.key;

			fileItem = $('#default-file-item').clone();

			$(fileItem).removeAttr('id');

			$(fileItem).find('.options a:last').attr('href', '{{pages.returnFile.original}}' + file.key);

			$(fileItem).find('.remove a:first').attr('href', '{{pages.apiRemoveFile.uri}}' + file.key);

			$(fileItem).find('.tag a:first').attr('href', '/tag/' + file.key);

			$(fileItem).find('img').attr('src', '{{pages.returnFile.smallThumb}}' + file.key);

			$(fileItem).find('.filename').html(file.name);

			$(fileItem).css('display', 'inline-block');

			$(fileItem).attr('data-count', fileCount);

			$(fileItem).attr('data-id', file.key);

			$('#grid').append(fileItem);
		});
	};

	function getFiles(startId, limit) {

		$.post('{{pages.apiGetFiles.uri}}', {active: 'true', startId : startId, limit: limit, order: 'desc'}, function(data) {
					
			if(data.success == true) {
				
				if(data.end == true) {

					$('#load-more').hide();

				} else {
					
					if($("#grid li").size() > 100) {
						clearGrid();	
					}
				
				}
			
				var lastElement = $(".polaroid").last();

				generateGrid(data.files);

				showDetails(false);

				$('html, body').animate({scrollTop:$(lastElement).offset().top - 90}, "slow");
			}
		});
	}

	function doSearch(startId, limit) {
	
		var search = $('#search-field').val();

		console.log(search);

		var doSearch = $.ajax({
			type: "POST", 
			url: '{{pages.apiSearch.uri}}', 
			data: { 
				query  : search, 
				last   : startId, 
				fields : ['key', 'name', 'type', 'tags', 'meta'],
				index  : 'files',
				type   : 'file',
				limit  : limit
			}
		});

		doSearch.done(function(result) {

			if(result.success == true && result.message.length > 0) {

				var data = result.message;

				if(data.end == true) {

					$('#load-more').hide();

				} else {
					
					if($("#grid li").size() > 100) {
						clearGrid();	
					}
				}

				var lastElement = $(".polaroid").last();

				generateGrid(data);
			
				showDetails(false);

				$('html, body').animate({scrollTop:$(lastElement).offset().top - 90}, "slow");

			} else {
				console.log("No search results found!");
			}
		});		

		doSearch.fail(errorHandler);
	}

	$('#search-button').click(function() {
		
		fileCount = 0;
		lastId = '';

		$('#load-more').show();

		$('#load-more').unbind("click");

		$('#load-more').click(function() {

			$('.details').not('#default-details-item').remove();

			doSearch(lastId, -1);
		});

		clearGrid();
		doSearch(lastId, -1);
	});

	$(window).resize(function() {
		
		$('.details').not('#default-details-item').remove();

		clearTimeout(doit);

		doit = setTimeout(function() {
			showDetails(true);
		}, 400);
	});

	$('#load-more').click(function() {

		$('.details').not('#default-details-item').remove();

		getFiles(lastId, -1);
	});

	$('#grid').on('click', '.new-tag-text', function() {

		$(this).html("&nbsp;");
	});

	$('#grid').on('click', '.new-tag-button', function() {

		//Text will need to be validated here!!
		var tag = $(this).prev().text();

		var selected = this;

		$(selected).prev().html('Add new tag...');

		var key = $('.details').not('#default-details-item').attr('data-id');	

		var newTag = $.ajax({
			type: "POST", 
			url: '{{pages.apiSaveTag.uri}}', 
			data: { 
				key : key,
				tag : tag
			}
		});

		newTag.done(function(result) {

			if(result.success == true) {

				var tagItem = $('#default-tag-item').clone();

				$(tagItem).removeAttr('id');

				$(tagItem).children('.tag-text').html(tag);

				$(selected).closest('ul').children('.new-tag').after(tagItem);

			} else {

				console.log("Failed to add new tag!");
			}
		});		

		newTag.fail(errorHandler);
	});

	$('#grid').on('click', '.remove-tag-button', function() {

		var selected = this;

		var key = $('.details').not('#default-details-item').attr('data-id');	

		var tag = $(selected).parent().children(':first').text();

		var removeTag = $.ajax({
			type: "POST", 
			url: '{{pages.apiRemoveTag.uri}}', 
			data: { 
				key : key,
				tag : tag
			}
		});

		removeTag.done(function(result) {

			if(result.success == true) {

				$(selected).parent().remove();

			} else {

				console.log("Failed to add new tag!");
			}
		});		

		removeTag.fail(errorHandler);
	});

	$('#grid').on('click', '.remove-button', function() {
		
		lastId = $(selected).attr('data-id');

		var removeFile = $.ajax({
			type: "POST", 
			url: '{{pages.apiRemoveFile.uri}}', 
			data: { 
				key : lastId,
			}
		});

		removeFile.done(function(result) {

			if(result.success == true) {

				fileCount = $(selected).attr('data-count') - 1;
	
				var items = $(selected).nextAll();

				$(selected).remove();
			
				selected = null;

				$('.details').not('#default-details-item').remove();

				var getCount = $(items).length - 1;

				if(getCount > 0) {
					
					$(items).remove();

					getFiles(lastId, getCount);
				}

			} else {

				console.log("Could not remove file.");
				console.log(result.message);
			}
		});		

		removeFile.fail(errorHandler);
	});

	$('#grid').on('click', '.polaroid', function() {

		if(selected != null) {

			$(selected).css('border-color', '');
		}

		selected = this;

		$(selected).css('border-color', '#222');

		$('#grid').children('.details:not(:first)').remove();

		showDetails(true);
	});

	$('#grid').on('click', '.close-button', function() {

		$('.details').not('#default-details-item').remove();

		$(selected).css('border-color', '');

		selected = null;
	});

	function findEnd(selected) {

		var totalFiles = $('#grid').children().not('#default-file-item').not('#default-details-item').length;	

		var fileCount = $(selected).attr('data-count');

		var breakat = Math.floor( $('#grid').width() / $('.polaroid').outerWidth(true) );

		var fileRow = Math.ceil(fileCount / breakat);

		var endCount = fileRow * breakat;

		//If we are in the last row then default to total number of files in the grid
		if(fileCount > (totalFiles - (totalFiles % breakat))) {
			
			endCount = totalFiles;
		}
		
		return endCount;
	}

	function showDetails(focus) {

		if(selected == null) {
			return;
		}
		
		var endCount = findEnd(selected);
	
		endFile = $('div[data-count=' + endCount + ']');

		var detailsItem = $('#default-details-item').clone();

		$(detailsItem).removeAttr('id');

		var selectedId = $(selected).attr('data-id');

		$(detailsItem).attr('data-id', selectedId);


		var getFile = $.ajax({
			type: "POST", 
			url: '{{pages.apiGetFile.uri}}', 
			data: { 
				id : selectedId
			}
		});

		getFile.done(function(result) {

			if(result.success == true) {

				var file = result.file;

				file.tags.forEach(function(tag) {

					//Add new tag
					var tagItem = $(detailsItem).find('#default-tag-item').clone();

					$(tagItem).removeAttr('id');

					$(tagItem).children('.tag-text').html(tag);

					$(detailsItem).find('.new-tag').after(tagItem);
				});

				var key = $(selected).attr('data-id');

				$(detailsItem).find('.options a:first').attr('href', "{{pages.returnFile.original}}" + key);

				$(detailsItem).children('.image-container').css("background-image","url('{{pages.returnFile.mediumThumb}}" + key + "')");

				$(endFile).after(detailsItem);

				$(detailsItem).css('display', 'block');

				if(focus == true) {

					//Focus on the details item
					$('html, body').animate({scrollTop:$(selected).offset().top - 90}, "slow");
				}

			} else {

				console.log("Could not get file.");
				console.log(result.message);
			}
		});		

		getFile.fail(errorHandler);
	}
});

