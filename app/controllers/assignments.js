var args = arguments[0] || { };

$.activityIndicator.show();
getAssignments();

function goAssignment(e){
	var eventsWindow = Alloy.createController('assignmentEvents', [e.rowData.assignment_id, e.rowData.activity_id]).getView();
	if (Ti.Platform.osname == 'ipad')
	{
		$.navAssignment.openWindow(eventsWindow);
	}
	else
	{
		eventsWindow.open();
	}
};

//add behavior for goEventDetail
Ti.App.addEventListener('captureEventStats', function(e) {
	var eventStatsView = Alloy.createController('eventStats', [e.assignment_id, e.event_id, e.activity_id]).getView();
	if (Ti.Platform.osname == 'ipad')
	{
		$.navAssignment.openWindow(eventStatsView);
	}
	else
	{
		eventStatsView.open();
	}
});

function getAssignments()
{
	var tableData = [];
	
	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
		 	var tableData = [];

			json = JSON.parse(this.responseText);
			
			for (var i=0; i<json.length; i++)
			{
				var row = Ti.UI.createTableViewRow({height: 140, assignment_id: json[i]["id"], activity_id: json[i]["activity_id"], hasChild: true});
						
				var imageName = 'missing_logo.png';
				if ((json[i]["logo_url"]).indexOf("missing_logo.png") == -1)
				{
					imageName = json[i]["logo_url"];
				}
				
				var assignmentLogo = image({image: imageName, left: 15, height: 140, touchEnabled: false});
			  	row.add(assignmentLogo);
				var assignmentName = Ti.UI.createLabel({text: json[i]["name"], top: 45, left: 280, font: { fontSize:48, fontWeight: 'bold' }});
				row.add(assignmentName);
			  	
			  	tableData.push(row);
			}	
			$.assignmentsTable.setData(tableData);
			$.activityIndicator.hide();
			$.assignmentsTable.show();
		}
	});
		
	xhr.open('GET', webserver+'/assignments.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	xhr.send();	
}