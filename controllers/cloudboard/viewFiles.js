var common = require('../../cloudboard/common.js')
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.home.uri, getPage, ['authorize']);
};

function getPage()
{
	var self = this;

	common.model = {};
	common.model.pages = pages;
	common.model.page = pages.home;

	var page = common.make(self, pages.home.view);

	self.html(page);
}
