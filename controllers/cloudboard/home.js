var $ = exports;

var common = require('../../cloudboard/common.js')

// GET Home Page
$.home = function() {

	var self = this;

	if(self.user != null) {

		common.model = {};

		var page = common.make(self, common.pages.home);

		self.html(page);

	} else {

		self.redirect(common.pages.getLogin.uri);
	}
};
