var uuid	= require( "uuid" );
var util	= require( "util" );
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
				var _uuid = uuid.v4();
				while( self.docs[_uuid] ){ _uuid = uuid.v4(); }

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

		defineView: function( name, func ){
			var self = this;
			return new Promise( function( resolve, reject ){

				var _newView = { data: { }, func: func };

				var _runPromises = [ ];
				Object.keys(self.docs).forEach( function( docId ){
					_runPromises.push( new Promise( function( resolve, reject ){
						func( self.docs[docId] ).then( function( result ){
							return resolve( { 'key': docId, 'value': result } );
						}, reject );
					} ) );
				} );

				Promise.all( _runPromises ).then( function( results ){
					results.forEach( function( result ){
						if( result.value !== undefined ){
							_newView.data[result.key] = result.value;
						}
					} );

					self.views[name] = _newView;
					return resolve( );
				} );
			} );
		},

		// This function makes sure that all the views we have
		// are up to date..
		_updateViews: function( docId ){
			var self = this;
			return new Promise( function( resolve, reject ){

				var _promises = [ ];
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

var _insertPromises = [ ];
for( var z=0; z<10; z++ ){
	_insertPromises.push( myDb.insert( { "firstName": "Rob", "lastName": "Keizer" + z } ) );
}

_insertPromises.push( myDb.insert( { "foo": "bar" } ) );

Promise.all( _insertPromises ).then( function( ){

	console.log( "Inserted the documents.." );

	myDb.defineView( "by-lastname", function( doc ){
		return new Promise( function( resolve, reject ){
			if( doc.lastName ){
				return resolve( doc.lastName, null );
			}
			return resolve( );
		} );
	} ).then( function( ){
		myDb.query( "by-lastname" ).then( function( result ){
			console.log( result );

			myDb.insert( { "meh": "hope", "lastName": "Meh" } ).then( function( ){
				myDb.query( "by-lastname" ).then( function( result ){
					console.log( result );
				} );
			} );
		} );
	} );
} );
