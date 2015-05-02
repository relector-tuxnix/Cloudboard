var common = require('../../cloudboard/common.js');
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.newFile.uri, getAddPage, pages.newFile.options);
};

// GET Add Page
function getAddPage()
{
	var self = this;

	common.model = {};
	common.model.pages = pages;
	common.model.page = pages.newFile;
	
	var page = common.make(self, pages.newFile.views);

	self.html(page);
}
