var irc		= require( "irc" );
var nano	= require( "nano" );

var client	= new irc.Client( "irc.wikimedia.org", "robertkeizer-testbot", { 
	channels: [ "#en.wikipedia" ]
} );

client.addListener( "message#en.wikipedia", function( from, message ){
	console.log( "From is " );
	console.log( from );

	console.log( "Message is " );
	console.log( message );
} );

client.addListener( "error", function( message ){
	console.log( "ERROR: " );
	console.log( message );
} );
