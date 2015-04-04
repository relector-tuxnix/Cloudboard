//Override elastic-core pages
var $ = module.exports = require('../elastic-core/pages.js'); 

$.apiGetFiles = {
	uri: '/api/get-files',
	label: 'Get Files',
}

$.apiGetFile = {
	uri: '/api/get-file',
	label: 'Get File',
}

$.returnFile = {
	uri: '/file/{action}/{type}/{key}/',
	base: '/file',
	label: 'Return File',
}
	
$.apiBootstrapFile = {
	uri: '/api/bootstrap-file',
	label: 'Boostrap File',
}

$.apiCheckFile = {
	uri: '/api/check-file',
	label: 'Check File',
}

$.apiSaveFile = {
	uri: '/api/save-file',
	label: 'Save File',
}

$.apiRemoveFile = {
	uri: '/api/remove-file',
	label: 'Remove File.',
}

$.apiSaveTag = {
	uri: '/api/save-tag',
	label: 'Save Tag.',
}

$.apiRemoveTag = {
	uri: '/api/remove-tag',
	label: 'Remove Tag.',
}

$.default = {
	label: 'Cloudboard',
	view: 'cloudboard/default',
};

$.error = {
	uri: '/error',
	label: 'Error Occured',
	view: 'cloudboard/error',
	above: [],
	below: []
};

$.newFile = {
	uri: '/new-file',
	label: 'New File',
	view: 'cloudboard/newFile',
	above: [],
	below: []
}

$.viewFiles = {
	uri: '/view-files',
	label: 'Cloudboard',
	view: 'cloudboard/default',
	above: [],
	below: []
};

$.login = {
	uri: '/login',
	label: 'Cloudboard',
	view: 'cloudboard/login',
	above: [],
	below: []
};

$.logout = {
	uri: '/logout',
	label: 'Logout',
	above: [],
	below: []
};

$.home = {
	uri: '/',
	label: 'Cloudboard',
	view: 'cloudboard/default',
	above: [],
	below: []
};

$.register = {
	uri: '/register',
	label: 'Register',
	view: 'cloudboard/register',
	above: [],
	below: []
};

$.search = {
	uri: '/search/{query}',
	base: '/search',
	label: 'Search',
	view: 'cloudboard/search',
	above: [],
	below: []
};


//RELATIONSHIPS

$.home.below = [
	$.register,
	$.search,
	$.newFile,
	$.viewFiles
];

$.register.above = [$.home];
$.search.above = [$.home];
$.newFile.above = [$.home];
$.viewFiles.above = [$.home];
