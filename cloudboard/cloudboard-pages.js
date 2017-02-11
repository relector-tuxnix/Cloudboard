var $ = exports;

$.apiGetFiles = {
	uri: '/api/get-files',
	controller: 'cloudboard/api.js',
	flags: ['post', 'authorize'],
	label: 'Get Files',
}

$.apiGetFile = {
	uri: '/api/get-file',
	controller: 'cloudboard/api.js',
	flags: ['post', 'authorize'],
	label: 'Get File',
}

$.apiReturnFile = {
	uri: '/file/{type}/{key}/',
	controller: 'cloudboard/api.js',
	base: '/file',
	smallThumb: '/file/small-thumb/',
	mediumThumb: '/file/medium-thumb/',
	original: '/file/original/',
	flags: ['get'],
	label: 'Return File',
}
	
$.apiBootstrapFile = {
	uri: '/api/bootstrap-file',
	controller: 'cloudboard/api.js',
	flags: ['+xhr', 'upload', 'post', 'authorize'],
	label: 'Boostrap File',
}

$.apiCheckFile = {
	uri: '/api/check-file',
	controller: 'cloudboard/api.js',
	flags: ['+xhr', 'upload', 'post', 'authorize'],
	label: 'Check File',
}

$.apiSaveFile = {
	uri: '/api/save-file',
	controller: 'cloudboard/api.js',
	flags : ['+xhr', 'upload', 'post', 'authorize'],
	length: 819200,
	label: 'Save File',
}

$.apiRemoveFile = {
	uri: '/api/remove-file',
	controller: 'cloudboard/api.js',
	flags: ['post', 'authorize'],
	label: 'Remove File.',
}

$.apiSaveTag = {
	uri: '/api/save-tag',
	controller: 'cloudboard/api.js',
	flags: ['post', 'authorize'],
	label: 'Save Tag.',
}

$.apiRemoveTag = {
	uri: '/api/remove-tag',
	controller: 'cloudboard/api.js',
	flags: ['post', 'authorize'],
	label: 'Remove Tag.',
}

$.error = {
	uri: '/error',
	controller: 'elastic-core/default.js',
	priority: 1,
	flags: [],
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
	controller: 'cloudboard/newFile.js',
	flags: ['authorize'],
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

$.getLogin = {
	uri: '/login',
	controller: 'elastic-core/login.js',
	priority: 1,
	flags: ['unauthorize', 'get'],
	label: 'Login',
	views: [
		{'body' : 'cloudboard/login.html'},
		{'defaultjs' : 'cloudboard/default.js'},
		{'default' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.postLogin = {
	uri: '/login',
	controller: 'elastic-core/login.js',
	priority: 1,
	flags: ['unauthorize', 'post'],
	label: 'Login',
	views: [],
	above: [],
	below: []
};
	
$.logout = {
	uri: '/logout',
	controller: 'elastic-core/login.js',
	flags: ['authorize'],
	label: 'Logout',
	above: [],
	below: []
};

$.home = {
	uri: '/',
	controller: 'cloudboard/home.js',
	priority: 1,
	flags: ['get'],
	label: 'Cloudboard',
	views: [
		{'defaultjs' : 'cloudboard/default.js'},
		{'deafult' : 'cloudboard/default.html'}
	],
	above: [],
	below: []
};

$.getRegister = {
	uri: '/register',
	controller: 'elastic-core/register.js',
	flags: ['unauthorize'],
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
	controller: 'cloudboard/api.js',
	base: '/search',
	flags: ['get'],
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
	$.getRegister,
	$.search,
	$.newFile
];

$.getRegister.above = [$.home];
$.search.above = [$.home];
$.newFile.above = [$.home];
