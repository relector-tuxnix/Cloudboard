//Override elastic-core pages
var $ = module.exports = require('../elastic-core/pages.js'); 

$.apiGetFiles = {
	uri: '/api/get-files',
	options: ['post', 'authorize'],
	label: 'Get Files',
}

$.apiGetFile = {
	uri: '/api/get-file',
	options: ['post', 'authorize'],
	label: 'Get File',
}

$.returnFile = {
	uri: '/file/{action}/{type}/{key}/',
	base: '/file',
	options: ['get'],
	label: 'Return File',
}
	
$.apiBootstrapFile = {
	uri: '/api/bootstrap-file',
	options: ['+xhr', 'upload', 'post', 'authorize'],
	label: 'Boostrap File',
}

$.apiCheckFile = {
	uri: '/api/check-file',
	options: ['+xhr', 'upload', 'post', 'authorize'],
	label: 'Check File',
}

$.apiSaveFile = {
	uri: '/api/save-file',
	options: { flags : ['+xhr', 'upload', 'post', 'authorize'], length: 819200 },
	label: 'Save File',
}

$.apiRemoveFile = {
	uri: '/api/remove-file',
	options: ['post', 'authorize'],
	label: 'Remove File.',
}

$.apiSaveTag = {
	uri: '/api/save-tag',
	options: ['post', 'authorize'],
	label: 'Save Tag.',
}

$.apiRemoveTag = {
	uri: '/api/remove-tag',
	options: ['post', 'authorize'],
	label: 'Remove Tag.',
}

$.default = {
	label: 'Cloudboard',
	options: [],
	views: [
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
};

$.error = {
	uri: '/error',
	options: [],
	label: 'Error Occured',
	views: [
		{'body' : 'cloudboard/error.html'},
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.newFile = {
	uri: '/new-file',
	options: ['authorize'],
	label: 'New File',
	views: [
		{'newFilejs' : 'cloudboard/newFile.js'},
		{'body' : 'cloudboard/newFile.html'},
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
}

$.login = {
	uri: '/login',
	options: ['unauthorize', 'get'],
	postOptions: ['unauthorize', 'post'],
	label: 'Login',
	views: [
		{'body' : 'cloudboard/login.html'},
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.logout = {
	uri: '/logout',
	options: [],
	label: 'Logout',
	above: [],
	below: []
};

$.home = {
	uri: '/',
	options: ['get'],
	label: 'Cloudboard',
	views: [
		{'defaultjs' : 'cloudboard/default.js'},
		{'deafult' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.register = {
	uri: '/register',
	options: ['unauthorize'],
	postOptions: ['unauthorize', 'post'],
	active: true,
	label: 'Register',
	views: [
		{'body' : 'cloudboard/register.html'},
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.search = {
	uri: '/search/{query}',
	base: '/search',
	options: ['get'],
	label: 'Search',
	views: [
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}

	],
	above: [],
	below: []
};


//RELATIONSHIPS

$.home.below = [
	$.register,
	$.search,
	$.newFile
];

$.register.above = [$.home];
$.search.above = [$.home];
$.newFile.above = [$.home];
