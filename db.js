var vm		= require( "vm" );
var uuid	= require( "uuid" );
var async	= require( "async" );
var Promise	= require( "lie" );

var db = function( ){
	return {
		docs: { },
		views: { },
		insert: function( rawJSON ){
			var self = this;

			return new Promise( function( resolve, reject ){

				if( Array.isArray( rawJSON ) ){
					var _promises = [ ];
					rawJSON.forEach( function( singleJSON ){
						_promises.push( new Promise( function( resolve, reject ){
							self.insert( singleJSON ).then( resolve, reject );
						} ) );
					} );

					return Promise.all( _promises ).then( resolve, reject );
				}

				// Figure out what the uuid for this document should be. Make sure we don't
				// have a collision.. even though its stupidly small.
				var _uuid = uuid.v4(); while( self.docs[_uuid] ){ _uuid = uuid.v4(); }

				// Lets insert the document.
				self.docs[_uuid] = rawJSON;

				// Update any views that may require updating.
				self._updateViews( _uuid ).then( function( ){
					return resolve( { key: _uuid } );
				}, reject );
			} );
		},

		query: function( whatView ){
			var self = this;
			return new Promise( function( resolve, reject ){
				if( !self.views[whatView] ){
					return reject( "Unknown view" );
				}

				return resolve( self.views[whatView].data );
			} );
		},

		defineView: function( options, func ){
			var self = this;
			return new Promise( function( resolve, reject ){

				var _newView = { data: { }, func: func };

				var _runPromises = [ ];

				if( options.previous ){
					self.query( options.previous ).then( function( results ){

						var _runPromises = [ ];
						Object.keys( results ).forEach( function( resultKey ){
							_runPromises.push( new Promise( function( resolve, reject ){
								func( resultKey, results[resultKey] ).then( function( result ){
									return resolve( { key: result.key, value: result.value } );
								}, reject );
							} ) );
						} );

						Promise.all( _runPromises ).then( function( results ){
							results.forEach( function( result ){
								if( result.value !== undefined ){
									_newView.data[result.key] = result.value;
								}
							} );

							self.views[options.name] = _newView;
							return resolve( );
						} );
					} );
				}else{

					Object.keys(self.docs).forEach( function( docId ){
						_runPromises.push( func( self.docs[docId] ) );
					} );

					Promise.all( _runPromises ).then( function( results ){

						results.forEach( function( result ){
							console.log( "I have result of " + JSON.stringify( result ) );
							if( result.value !== undefined ){
								_newView.data[result.key] = result.value;
							}
						} );

						self.views[options.name] = _newView;
						return resolve( );
					} );
				}
			} );
		},

		// This function makes sure that all the views we have
		// are up to date..
		_updateViews: function( docId ){
			var self = this;
			return new Promise( function( resolve, reject ){

				var _promises = [ ];

				// Going to need to order this at some point; as views will be able to depend on other views.
				Object.keys( self.views ).forEach( function( viewName ){
					_promises.push( new Promise( function( resolve, reject ){
						self.views[viewName].func( self.docs[docId] ).then( function( result ){

							if( self.views[viewName].data[docId] && result === undefined ){
								delete self.views[viewName].data[docId];
							}

							if( result !== undefined ){
								self.views[viewName].data[docId] = result;
							}

							return resolve( );
						} );
					} ) );
				} );

				Promise.all( _promises ).then( resolve, reject );
			} );
		}
	}
};

myDb = db( );

async.series( [ function( cb ){

	// Lets insert some random documents.
	var _insertPromises = [ ];
	for( var z=0; z<10; z++ ){
		_insertPromises.push( myDb.insert( { "firstName": "Rob", "lastName": "Keizer" + z } ) );
		_insertPromises.push( myDb.insert( { "foo": "bar", "z": z } ) );
	}

	Promise.all( _insertPromises ).then( function( ){ cb( ); } );

}, function( cb ){
	
	// Lets define a view.

	myDb.defineView( { name: "by-lastname" }, function( doc ){
		return new Promise( function( resolve, reject ){
			if( doc.lastName ){
				return resolve( { key: doc.lastName, value: null } );
			}
			return resolve( );
		} );
	} ).then( function( ){ return cb( ); } );

}, function( cb ){

	// Lets insert another doc to make sure that the views update as expected.
	myDb.insert( { "meh": "hope", "lastName": "Meh" } ).then( function( ){ cb( ); } );
}, function( cb ){

	// Another view 
	myDb.defineView( { name: "ending-in-number", previous: "by-lastname" }, function( docId, key ){
		return new Promise( function( resolve, reject ){
			if( key.match( /[0-9]$/ ) ){
				return resolve( { key: value, value: null } );
			}
			return resolve( );
		} );
	} ).then( function( ){ return cb( ); } );

}, function( cb ){

	myDb.query( "by-lastname" ).then( function( result ){
		console.log( "by-lastname" );
		console.log( result );
		return cb( );
	} );

}, function( cb ){
	console.log( "ending-in-number" );
	myDb.query( "ending-in-number" ).then( function( result ){
		console.log( result );
	} );
} ], function( err ){
	
} );
