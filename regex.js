/*

	1)
		generate a regex that we want to test.
		calculate a string that matches.
		place on 2d grid

	2)
		generate a regex that we want to test ( should have some
		part that overlaps previous ).
		calculate a string that matches
		place on 2d grid.

	3-n; repeat 2.
*/

var generateGrid = function( x, y ){

	var content = [ ];
	for( var i=0; i<y; i++ ){
		var _row = [ ];
		for( var z=0; z<x; z++ ){
			_row.push( "" );
		}
		content.push( _row );
	}

	return {
		content: content,
		add: function( ){
			console.log( "WHAT" );
		},
		foo: function( ){
			console.log( JSON.stringify( this.content ) );
		}
	}
};

var _grid = generateGrid( 4, 4 );

console.log( JSON.stringify( _grid ) );

_grid.add( );

_grid.foo();
