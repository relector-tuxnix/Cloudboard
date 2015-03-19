var common = require('../../cloudboard/common.js')
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.login.uri, getLoginPage, ['unauthorize']);
	framework.route(pages.login.uri, postLoginPage, ['unauthorize', 'post']);
	framework.route(pages.logout.uri, getLogoutPage, ['authorize']);
};

// GET Login Page
function getLoginPage()
{
	var self = this;

	common.model = {};
	common.model.pages = pages;
	common.model.page = pages.login;
	common.model.message = '';
	common.model.email = '';
	common.model.body = common.make(self, pages.login.view);

	var page = common.make(self, pages.default.view);

	self.html(page);
}

// POST Login Page
function postLoginPage()
{
	var self = this;

	var post = {
		"email" : self.post.email,
		"password" : self.post.password
	};

	common.EBLogin(self, post, function(result) {

		if(result.success == false) {

			common.model.message = "Invalid username or password.";
			common.model.email = self.post.email;
			common.model.body = common.make(self, pages.login.view);

			var page = common.make(self, pages.default.view);			

			self.html(page);

		} else {

			self.redirect(pages.home.uri);
		}
	});
}

//GET Logout Page
function getLogoutPage()
{
	var self = this;

	common.model = {};
	common.model.page = pages.logout;

	common.EBLogout(self);

	self.redirect(pages.home.uri);
}
