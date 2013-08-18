var Collaborators = require('../src');
var async = require('async');

describe('collaborator-map', function(){

	var map = Collaborators({
		prefix:'collaboratormaptest'
	})

	beforeEach(function(done){
    map.reset(done);
  })

  it('should be a function', function(done) {
    Collaborators.should.be.a('function');
    done();
  })

  it('should allow a project to have an owner who can write', function(done){

  	map.create_project('bobsnewprojects', 'bob', function(error){
  		map.get_access('bobsnewprojects', 'bob', function(error, access){
  			access.should.equal('write');
  			done();
  		})
  	})

  })

  it('should not allow the same project to be created twice', function(done){

  	map.create_project('bobsnewprojects', 'bob', function(error){
  		map.create_project('bobsnewprojects', 'bob', function(error){
  			error.should.equal('project already exists');
  			done();
  		})
  		
  	})
  })

  it('should allow collaborators to be added who can then access the project', function(done){

  	map.create_project('bobsnewprojects', 'bob', 'private', function(error){

  		async.series([
  			function(next){
  				map.get_access('bobsnewprojects', 'pete', function(error, access){
  					if(error){
  						throw new Error(error);
  					}

  					access.should.equal('none');
  					next();
  				})
  			},

  			function(next){
  				map.add_collaborator('bobsnewprojects', 'pete', next);
  			},

  			function(next){
  				map.get_access('bobsnewprojects', 'pete', function(error, access){
  					if(error){
  						throw new Error(error);
  					}

  					access.should.equal('write');
  					next();
  				})
  			}

  		], done)

  	})
  	

  })

  it('should allow a private project to not be read by a non collaborator', function(done){
  	done();

  })

  it('should allow a public project to be read by a non-collaborator', function(done){
  	done();

  })

  it('should stop access once a collaborator has been removed', function(done){
  	done();

  })

})
