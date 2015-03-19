var common = require('../../cloudboard/common.js')
var pages = require('../../cloudboard/pages.js');

exports.install = function(framework) {
	framework.route(pages.register.uri, getRegisterPage, ['unauthorize']);
	framework.route(pages.register.uri, postRegisterPage, ['unauthorize', 'post']);
};

// GET Register Page
function getRegisterPage()
{
	var self = this;

	common.model = {};
	common.model.pages = pages;
	common.model.page = pages.register;
	common.model.message = '';
	common.model.email = '';
	common.model.body = common.make(self, pages.register.view);

	var page = common.make(self, pages.default.view);

	self.html(page);
}

//POST Register Page
function postRegisterPage()
{
	var self = this;

	var post = {
		"email" : self.post.email,
		"password" : self.post.password,
		"confirm" : self.post.confirmPassword
	};

	common.EBRegister(self, post, function(result) {

		console.log(result);

		if(result.success == true) {

			self.redirect(pages.login.uri);

		} else {

			common.model.message = result.message;
			common.model.email = self.post.email;
			common.model.body = common.make(self, pages.register.view);

			var page = common.make(self, pages.default.view);

			self.html(page)
		}	
	});
}
