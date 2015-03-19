var pages = require('../elastic-core/pages.js'); 

//Override elastic-core pages
module.exports = pages;

module.exports.apiGetFiles = {
	uri: '/api/get-files',
	label: 'Get Files',
}

module.exports.apiGetFile = {
	uri: '/api/get-file',
	label: 'Get File',
}

module.exports.returnFile = {
	uri: '/file/{action}/{type}/{key}/',
	base: '/file/',
	label: 'Return File',
}
	
module.exports.apiBootstrapFile = {
	uri: '/api/bootstrap-file',
	label: 'Boostrap File',
}

module.exports.apiCheckFile = {
	uri: '/api/check-file',
	label: 'Check File',
}

module.exports.apiSaveFile = {
	uri: '/api/save-file',
	label: 'Save File',
}

module.exports.apiRemoveFile = {
	uri: '/api/remove-file',
	label: 'Remove File.',
}

module.exports.apiSaveTag = {
	uri: '/api/save-tag',
	label: 'Save Tag.',
}

module.exports.apiRemoveTag = {
	uri: '/api/remove-tag',
	label: 'Remove Tag.',
}

module.exports.default = {
	label: 'Cloudboard',
	view: 'cloudboard/default',
};

module.exports.error = {
	uri: '/error',
	label: 'Error Occured',
	view: 'cloudboard/error',
	above: [],
	below: []
};

module.exports.newFile = {
	uri: '/new-file',
	label: 'New File',
	view: 'cloudboard/newFile',
	above: [],
	below: []
}

module.exports.viewFiles = {
	uri: '/view-files',
	label: 'Cloudboard',
	view: 'cloudboard/default',
	above: [],
	below: []
};

module.exports.login = {
	uri: '/login',
	label: 'Cloudboard',
	view: 'cloudboard/login',
	above: [],
	below: []
};

module.exports.logout = {
	uri: '/logout',
	label: 'Logout',
	above: [],
	below: []
};

module.exports.home = {
	uri: '/',
	label: 'Cloudboard',
	view: 'cloudboard/default',
	above: [],
	below: []
};

module.exports.register = {
	uri: '/register',
	label: 'Register',
	view: 'cloudboard/register',
	above: [],
	below: []
};

module.exports.search = {
	uri: '/search/{query}',
	base: '/search',
	label: 'Search',
	view: 'cloudboard/search',
	above: [],
	below: []
};


//RELATIONSHIPS

/*
module.exports.home.below = [
	module.exports.search, 
	module.exports.newPost, 
	module.exports.newQuote, 
	module.exports.newFile, 
	module.exports.updatePost, 
	module.exports.updateQuote, 
	module.exports.viewPost, 
	module.exports.viewQuotes
];

module.exports.newPost.above = [module.exports.home];
module.exports.updatePost.above = [module.exports.home];
module.exports.newQuote.above = [module.exports.home];
module.exports.updateQuote.above = [module.exports.home];
module.exports.viewPost.above = [module.exports.home];
module.exports.viewQuotes.above = [module.exports.home];
module.exports.search.above = [module.exports.home];
module.exports.newFile.above = [module.exports.home];
module.exports.viewFiles.above = [module.exports.home];
*/
