var args = arguments[0] || {};

var assignment_id = args[0];

getAssignmentEvents();

$.eventsTable.addEventListener('click', function(e){
	Ti.App.fireEvent('captureEventStats',{event_id: e.rowData.event_id, assignment_id: e.rowData.assignment_id, activity_id: e.rowData.activity_id});
});

function getAssignmentEvents()
{
	var tableData = [];
	
	$.activityIndicator.show();

	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
		 	json = JSON.parse(this.responseText);
	
			if (json.length != 0)
			{					
				deleteAssignmentEvents(assignment_id);
				for (var i=0; i<json.length; i++)
				{
					addAssignmentEvent(json[i]["assignment_id"], json[i]["id"], json[i]["opponent"], json[i]["opponent_id"], json[i]["match_day"], json[i]["logo"]);
				}
				buildUI();
			}	
		},
		onerror : function(e) {
		    buildUI();
		},
		timeout : 10000  // in milliseconds
	});
		
	xhr.open('GET', webserver+'/assignments/' + assignment_id + '/assignment_events.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	xhr.send();	
}

function  buildUI()
{
	var tableData = [];
	var assignmentEvents = selectAssignmentEvents(assignment_id);

	for (var i=0; i<assignmentEvents.length; i++)
	{
		var eventRow = Ti.UI.createTableViewRow({height: 140, hasChild: true, assignment_id: assignmentEvents[i].assignment_id, event_id: assignmentEvents[i].assignment_event_id, opponent: assignmentEvents[i].opponent, opponent_id: assignmentEvents[i].opponent_id});
		
		var logo = image({image: assignmentEvents[i].logo_url, height: 100, left: 5, touchEnabled: false});
	  	eventRow.add(logo);
		var name = Ti.UI.createLabel({text: assignmentEvents[i].opponent, touchEnabled: false, top: 35, left: 280, font: { fontSize:48, fontWeight: 'bold' }});
		eventRow.add(name);
		var eventDate = Ti.UI.createLabel({text: assignmentEvents[i].event_date, touchEnabled: false, top: 95, left: 290, font: { fontSize:18 }});
		eventRow.add(eventDate);
		tableData.push(eventRow);
	}	
	$.eventsTable.setData(tableData);
	$.activityIndicator.hide();
	$.eventsTable.visible = true;
}