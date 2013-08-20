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

  it('should allow a public project to be read by a non-collaborator', function(done){
  	map.create_project('bobsnewprojects', 'bob', 'public', function(error){
  		map.get_access('bobsnewprojects', 'pete', function(error, access){
  			access.should.equal('read');
  			done();
  		})
  	})

  })

  it('should let us know if a project exists', function(done){
    map.create_project('bobsnewprojects', 'bob', 'public', function(error){
      map.project_exists('bobsnewprojects', function(error, exists){
        exists.should.equal(true);
        map.project_exists('otherproject', function(error, exists){
          exists.should.equal(false);
          done();
        })
      })
    })

  })

  it('should stop access once a collaborator has been removed', function(done){
  	map.create_project('bobsnewprojects', 'bob', 'private', function(error){

  		async.series([
  			

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
  			},

  			function(next){
  				map.remove_collaborator('bobsnewprojects', 'pete', next);
  			},

  			function(next){
  				map.get_access('bobsnewprojects', 'pete', function(error, access){
  					if(error){
  						throw new Error(error);
  					}

  					access.should.equal('none');
  					next();
  				})
  			}

  		], done)

  	})

  })

  it('should allow a whole project to be renamed', function(done){

  	map.create_project('bobsnewprojects', 'bob', 'private', function(error){

  		async.series([
  			

  			function(next){
  				map.add_collaborator('bobsnewprojects', 'pete', next);
  			},

  			function(next){

  				map.rename_project('bobsnewprojects', 'otherproject', next);

  			},

  			function(next){

  				map.get_access('otherproject', 'pete', function(error, access){
  					if(error){
  						throw new Error(error);
  					}

  					access.should.equal('write');
  					//next();
  				})
  			}

  		], function(error){
        if(error){
          throw new Error(error);
        }
        done();
      })


  	})

  })

  it('should list the collaborators of a project', function(done){
  	map.create_project('bobsnewprojects', 'bob', 'private', function(error){
  		async.series([
  			

  			function(next){
  				map.add_collaborator('bobsnewprojects', 'pete', next);
  			},

  			function(next){
  				map.add_collaborator('bobsnewprojects', 'steve', next);
  			},

  			function(next){
  				map.add_collaborator('bobsnewprojects', 'nigel', next);
  			},

  			function(next){
  				map.get_collaborators('bobsnewprojects', function(error, collabs){
  					collabs.length.should.equal(4);
  					collabs = collabs.sort();
  					collabs[3].should.equal('steve');
  					next();
  				})
  			}

  		], done)
  	})
  })


  it('should list multiple projects for one user with the status', function(done){

    async.series([
      function(next){
        map.create_project('bobproject1', 'bob', 'private', next);
      },

      function(next){
        map.create_project('bobproject2', 'bob', 'public', next);
      },

      function(next){
        map.create_project('steveproject1', 'steve', 'public', next);
      },

      function(next){
        map.add_collaborator('steveproject1', 'bob', next);
      },

      function(next){
        map.get_projects('bob', function(error, projects){
          if(error){
            throw new Error(error);
          }
          function compare(a,b) {
          if (a.id < b.id)
               return -1;
            if (a.id > b.id)
              return 1;
            return 0;
          }

          projects.sort(compare);

          projects.length.should.equal(3);
          projects[0].access.should.equal('private');
          projects[1].access.should.equal('public');
          projects[2].access.should.equal('public');
          projects[1].owner.should.equal(true);
          projects[2].owner.should.equal(false);
          done();

        })
      }

    ])

  })

  it('should not allow the owner of a project to be removed as a collaborator', function(done){
    map.create_project('bobsnewprojects', 'bob', 'private', function(error){
      async.series([
        

        function(next){
          map.add_collaborator('bobsnewprojects', 'pete', next);
        },

        function(next){
          map.remove_collaborator('bobsnewprojects', 'bob', function(error){
            error.should.equal('cannot remove the owner from the collaborators');
            next();
          });
        }


      ], done)
    })
  })

})
