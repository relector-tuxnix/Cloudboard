var common = require('../../cloudboard/common.js');
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.newFile.uri, getAddPage, ['authorize']);
};

// GET Add Page
function getAddPage()
{
	var self = this;

	common.model = {};
	common.model.pages = pages;
	common.model.page = pages.newFile;
	common.model.body = common.make(self, pages.newFile.view);
	
	var page = common.make(self, pages.default.view);

	self.html(page);
}
