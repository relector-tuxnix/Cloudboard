var db = require('../elastic-core/database.js');

exports.client = db.client;

db.client.indices.create({

	index: 'files',

	body : {
		"mappings" : {
			"file" : {
				"properties" : {
					"key" : {"type" : "string", "index" : "not_analyzed", "null_value" : "na"},
					"name" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
		
					"user" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},

					"public" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},

					"checkCount" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},

					"active" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"type" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"size" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"success" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"message" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
				
					"tags" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},
					"meta" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},

					"created" : {"type" : "date", "index" : "not_analyzed", "null_value" : "na"}
				}
			}
		}
	}

}, function(err, result) {});
