// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};
function image(args) {
	return Ti.UI.createImageView(args);
}

var webserver;

Ti.App.Properties.setString("Mode","Prod");
var mode = Ti.App.Properties.getString("Mode");
if (mode == "Dev")
{
	// dev mode logic
	webserver = "http://localhost:3000";
}
else
{
	// prod mode logic
	webserver = "https://winnerscircle.herokuapp.com";
};