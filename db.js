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

				return resolve( self.views[whatView] );
			} );
		},

		defineView: function( name, func ){
			var self = this;
			return new Promise( function( resolve, reject ){

				// Lets make sure we don't already have this view.
				if( this.views[name] ){
					return reject( "View with that name already defined." );
				}

				
			} );
		},

		// This function makes sure that all the views we have
		// are up to date..
		_updateViews: function( docId ){
			var self = this;
			return new Promise( function( resolve, reject ){
				
			} );
		}
	}
};

myDb = db( );

var _insertPromises = [ ];
for( var z=0; z<100; z++ ){
	_insertPromises.push( myDb.insert( { "firstName": "Rob", "lastName": "Keizer" } ) );
}

Promise.all( _insertPromises ).then( function( ){
	console.log( myDb );
} );
