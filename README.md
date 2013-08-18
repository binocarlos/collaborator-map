collaborator-map
================

A redis data structure for users collaborating on projects.

## installation

	$ npm install collaborator-map

## usage

You need a [Redis](http://redis.io/) server running, you can provide the connection details to the constructor.

First - create a new map connected to the redis server:

```js
var Collaborators = require('collaborator-map');

var map = Collaborators({
	host:'127.0.0.1',
	port:6379,

	// this will be prepended to all redis keys used by the map
	prefix:'mycustomprefix'
}

```

### adding a project

If your system creates a new project - tell the map by passing the project id, owner id and access level.

```js

// project_id = binocarlos/countries
// user_id = binocarlos
// access = private
map.create_project('binocarlos/countries', 'binocarlos', 'private', function(error){
	
})
```

### adding collaborators

You can also add other users onto the project - note, the owner of the project (the one that created it) is always a collaborator on it.


