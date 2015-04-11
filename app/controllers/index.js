var email_property = Ti.App.Properties.getString('email');
var auth_token_property = Ti.App.Properties.getString('auth_token');

if (email_property != null && auth_token_property != null)
{
	
	doSignIn();
}
else
{
	$.index.open();
}

function doSignIn(e){
	
	var signInPost = {
				email: (email_property != null && email_property.length>0)?email_property:$.email.value,
			    password: $.password.value,
			    auth_token: auth_token_property,
			    remember_me: '1',
			    commit : 'Sign In'
		};
	
	var xhr = Ti.Network.createHTTPClient({
		onload: function() 
		{
		 	// handle the response
		 	json = JSON.parse(this.responseText);
		 	if (json["success"] == 1)
		 	{
		 		// if these don't exist then set them
				Ti.App.Properties.setString('email', (email_property != null && email_property.length>0)?email_property:$.email.value);
				Ti.App.Properties.setString('auth_token', json["auth_token"]);
				
				var assignmentsWindow = Alloy.createController('assignments').getView();
	    		assignmentsWindow.open();
		 	}
		 	else
		 	{
		 		if (auth_token_property != null)
		 		{
		 			alert('Email or password was incorrect');
		 			$.index.open();
		 		}
		 	}
		},
		onerror : function(e) {
			// use cached credential and play on
			if (auth_token_property != null)
			{
		    	var assignmentsWindow = Alloy.createController('assignments').getView();
	    		assignmentsWindow.open();
		   	}
		},
		timeout : 10000  // in milliseconds
	});
	
	xhr.open('POST',webserver+'/users/sign_in.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	xhr.send(signInPost);
};
