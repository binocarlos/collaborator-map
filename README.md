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
})

```

### adding a project

When a user creates a new resource that requires access control - tell the map about the:

 * project id
 * owner id
 * access level

```js

// project_id = binocarlos/countries
// user_id = binocarlos
// access = private

map.create_project('binocarlos/countries', 'binocarlos', 'private', function(error){
	
})
```

### getting access

There are 3 access levels a given user can obtain with a resource:

 * read
 * write
 * none

To get the access level for any user on a particular project id:

```js
map.get_access('binocarlos/countries', 'otheruser', function(error, access){
	
	// from our example above access would be 'none' - the project is private

})

```

### collaborators

The people who can write to a project (or read a private one) are called 'collaborators'.

By default the owner of a project is a collaborator (and cannot be removed as one).

You can added and remove collaborators to a project:

Add a user:

```js
map.add_collaborator('bobsnewprojects', 'pete', next);
```

Remove a user:

```js
map.remove_collaborator('bobsnewprojects', 'pete', next);
```

### renaming projects

If for some reason you want to change the id by which you refer to a project:

```js
map.rename_project('oldprojectid', 'newprojectid', next);

```

### listing user projects

You can list the projects that a user can access.

The list contains objects with the following properties:

 * id - the project id
 * access - the access setting (public | private)
 * owner - whether the user is the owner of the project (true | false)

```js
map.get_projects('bob', function(error, projects){
	// projects is an array of objects
})
```

## licence

MIT