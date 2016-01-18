var $ = exports;

var common = require('../../cloudboard/common.js');

// GET Search Page
$.getSearchPage = function(query) {

	var self = this;

	common.model = {};

	common.model.query = query;
	common.model.results = [];

	var page = common.make(self, common.pages.home);

	self.html(page);
};
