var db = require('../elastic-core/database.js');

exports.client = db.client;

db.client.indices.create({

	index: 'files',

	body : {
		"mappings" : {
			"file" : {

				_id : {
					"path" : "key",
					"store" : "true",
					"index" : "analyzed"
				},

				"properties" : {
					"key" : {"type" : "string", "index" : "analyzed", "null_value" : "na"},
					"name" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},
		
					"user" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},

					"public" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},

					"checkCount" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},

					"active" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"type" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},
					"size" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},
					"success" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
					"message" : {"type" : "string", "null_value" : "na", "index" : "not_analyzed"},
				
					"tags" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},
					"meta" : {"type" : "string", "null_value" : "na", "index" : "analyzed"},

					"created" : {"type" : "date", "index" : "analyzed", "null_value" : "na"}
				}
			}
		}
	}

}, function(err, result) {});
