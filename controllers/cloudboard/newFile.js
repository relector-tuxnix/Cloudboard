var $ = exports;

var common = require('../../cloudboard/common.js');

// GET New File Page
$.newFile = function() {

	var self = this;

	common.model = {};
	
	var page = common.make(self, common.pages.newFile);

	self.html(page);
};
