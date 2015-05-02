var common = require('../../cloudboard/common.js')
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.home.uri, getHomePage, pages.home.options);
};

// GET Home Page
function getHomePage()
{
	var self = this;

	if(self.user != null) {

		common.model = {};
		common.model.pages = pages;
		common.model.page = pages.home;

		var page = common.make(self, pages.home.views);

		self.html(page);

	} else {

		self.redirect('/login');

	}
}
