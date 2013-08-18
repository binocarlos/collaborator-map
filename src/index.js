/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var fs = require('fs');
var _ = require('lodash');
var redis = require('redis');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Map(options){
	this.redis = redis.createClient(options.port, options.host);
}

util.inherits(Map, EventEmitter);

Map.prototype.key = function(key){
	return this.prefix + ':' + key;
}

Map.prototype.reset = function(done){
	var self = this;
	this.redis.keys(this.key('*'), function(error, keys){
		if(error || !keys || keys.length<=0){
			done();
			return;
		}
		self.redis.del(keys, done);
	})
}

/*

	return the level of access granted for the given user
	
*/
Map.prototype.get_access = function(id, user, done){
	var self = this;
	async.parallel({
		access_level:function(next){
			self.redis.get(self.key(id + ':access'), next);
		},
		collaborator:function(next){
			self.redis.sismember(self.key(id + ':collabs'), user, next);
		}
	}, function(error, access_results){
		if(error){
			done(error);
			return;
		}

		if(access_results.collaborator){
			done(null, 'write');
		}
		else{
			/*
			
				this means that the project is read only by collaborators
				
			*/
			if(access_results.access!=='public'){
				done(null, 'none');
			}
			else{
				done(null, 'read');
			}	
		}
		
	})
}


/*

	change the access level for a project
	
*/
Map.prototype.set_access = function(id, access, done){
	var self = this;
	self.redis.set(self.key(id + ':access'), access, done);
}

Map.prototype.get_owner = function(id, done){
	var self = this;
	self.redis.get(this.key(id), done);
}

Map.prototype.add_collaborator = function(id, user, done){
	var self = this;
	self.redis.sadd(self.key(id + ':collabs'), user, done);
}

Map.prototype.remove_collaborator = function(id, user, done){
	var self = this;
	self.get_owner(id, function(error, owner){
		if(owner==user){
			done('cannot remove the owner from the collaborators');
			return;
		}
		self.redis.srem(self.key(id + ':collabs'), user, done);
	})
}


/*

	project settings is an object:

		id 				- 34343
		owner 		- binocarlos
		access 		- 
	
*/
Map.prototype.create_project = function(id, owner, access, done){
	var self = this;

	if(arguments.length<=3){
		done = access;
		access = 'public';
	}

	this.redis.get(this.key(id), function(error, existingowner){
		if(existingowner){
			error = 'project already exists';
		}
		if(error){
			done(error);
			return;
		}

		async.parallel([
			function(next){
				self.redis.set(self.key(id), owner, next);
			},
			function(next){
				self.redis.set(self.key(id + ':access'), access, next);
			},
			function(next){
				self.redis.sadd(self.key(id + ':collabs'), owner, next);
			}
		], done);
	})
}

Map.prototype.update_project_id = function(id, newid, done){
	var self = this;
	async.parallel({
		owner:function(next){
			self.redis.get(self.key(id), next);
		},
		access:function(next){
			self.redis.get(self.key(id + ':access'), next);
		},
		collabs:function(next){
			self.redis.smembers(self.key(id + ':collabs'), next);
		}
	}, function(error, project){
		if(error){
			done(error);
			return;
		}
		self.delete_project(id, function(error){
			if(error){
				done(error);
				return;
			}
			async.parallel([
				function(next){
					self.redis.set(self.key(id), project.owner, next);
				},
				function(next){
					self.redis.set(self.key(id + ':access'), project.access, next);
				},
				function(next){

					async.forEach(project.collabs, function(collab, next){
						self.redis.sadd(self.key(id + ':collabs'), collab, next);
					})

				}
			], done)

		})
	})
}

Map.prototype.delete_project = function(id, done){
	var self = this;
	async.parallel([
		function(next){
			self.redis.del(self.key(id), owner, next);
		},
		function(next){
			self.redis.del(self.key(id + ':access'), access, next);
		},
		function(next){
			self.redis.del(self.key(id + ':collabs'), access, next);
		}
	], done)
}

module.exports = function factory(options){
	options = _.defaults(options || {}, {
		prefix:'test',
		host:'127.0.0.1',
		port:6379
	})

	return new Map(options);
}