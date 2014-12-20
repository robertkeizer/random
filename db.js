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

				var _uuid = uuid.v4();
				while( self.docs[_uuid] ){
					_uuid = uuid.v4();
				}
				self.docs[_uuid] = rawJSON;
				return resolve( { key: _uuid } );
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

		defineView: function( ){
			
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
