var args = arguments[0] || {};

var assignment_id = args[0];
var event_id = args[1];
var activity_id = args[2];
var athleteStats = new Array();
var uploadData = new Array();;
var json = null;
var seqno = 0;

$.captureTab.addEventListener('focus', function(e){
    if (json != null)
    {
    	buildCaptureUI();
    }
    Ti.App.addEventListener('updateStat', updateStat);
    $.captureWin.show();
    $.runningTotalsWin.hide();
});

$.runningTotalsTab.addEventListener('focus', function(e){
	Ti.App.addEventListener('deleteAction', deleteAction);
    getRunningTotals();
    $.captureWin.hide();
    $.runningTotalsWin.show();
});

$.captureWin.addEventListener('blur', function() {
    Ti.App.removeEventListener('updateStat', updateStat);
 });

var updateStat = function(e) {
	e.cancelBubble = true;
	var buttonClicked = athleteStats[e.athlete][e.kpi_id];
	buttonClicked.title = parseInt(buttonClicked.title)+1;
	uploadData[seqno] = [e.athlete_name, e.kpi, parseInt(buttonClicked.title), "Pending Upload", seqno, e.user_id];
	postStatUpdate(assignment_id, event_id, e.user_id, seqno, e.kpi, "Save");
	seqno++;
};

$.runningTotalsTab.addEventListener('blur', function() {
    Ti.App.removeEventListener('deleteAction', deleteAction);
 });

var deleteAction = function(e) {
	e.cancelBubble = true;
	var alertWindow = Titanium.UI.createAlertDialog({
	    title: 'Delete Statistic',
	    message: 'Are you sure you want to delete this stat?',
	    cancel:1,
	    athlete_name: e.athlete_name,
	    kpi: e.kpi,
	    seqno: e.seqno,
	    user_id: e.user_id,
	    buttonNames: ['OK','Cancel']
	});
	
	alertWindow.addEventListener('click',function(ev){
		e.cancelBubble = true;
	    switch(ev.index)
	    {
	    case 0:
	      	uploadData[ev.source.seqno] = [ev.source.athlete_name, ev.source.kpi, 0, "Delete"];
	      	postStatUpdate(assignment_id, event_id, ev.source.user_id, ev.source.seqno, ev.source.kpi, "Delete");
			getRunningTotals();
	      break;
	    case 1:
	      	Titanium.API.info( "cancel button was hit");
	      	break;
	    }
	});
	alertWindow.show();
};

Ti.App.addEventListener('deleteAction', deleteAction);

function postStatUpdate(assignment_id, event_id, user_id, seq_no, kpi, a)
{
	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
			postResponse = JSON.parse(this.responseText);
			
			if (postResponse["success"] == true)
			{
				uploadData[seq_no][3] != "Delete"?uploadData[seq_no][3]="Upload Complete":uploadData[seq_no][3] = uploadData[seq_no][3];
			}
		}
	});
	
	xhr.open('POST', webserver+'/assignments/'+ assignment_id + '/assignment_events/update_stat.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	
	var reorderPost = {'assignment_event[assignment_id]': assignment_id, 
		'assignment_event[assignment_event_id]': event_id, 
		'assignment_event[user_id]': user_id, 
		'assignment_event[seqno]': seq_no,
		'assignment_event[kpi]': kpi, 
		'assignment_event[a]': a  };
	xhr.send(reorderPost);
}

getEventTeam();

function getEventTeam()
{
	var tableData = [];
	
	$.activityIndicator.show();

	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
			json = JSON.parse(this.responseText);
			
			buildCaptureUI();
		}
	});
	xhr.open('GET', webserver+'/assignments/' + assignment_id + '/assignment_events/' + event_id + '/assignment_events/team_and_stat_template.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	xhr.send();	
}

function buildCaptureUI()
{
	if (json.length != 0)
	{			
		var tableData = [];		
		var sectionName;
		var sectionHeader;
	
		for (var i=0; i<json["team"].length; i++)
		{
			if (sectionName != json["team"][i]["role"])
			{
				if (i != 0)
				{
					tableData.push(sectionHeader);
				}
				sectionHeader = Ti.UI.createTableViewSection({headerTitle: json["team"][i]["role"], height: 50, touchEnabled: false});
				sectionName = json["team"][i]["role"];
			}
			
			var row = Ti.UI.createTableViewRow({height: 140, touchEnabled: false});
			var avatarPath = "missing_avatar.png";
			if (json["team"][i]["avatar"] != "missing_avatar.png")
			{
				avatarPath = json["team"][i]["avatar"];
			}
			var avatar = image({image: avatarPath, width: Ti.UI.SIZE, height: Ti.UI.SIZE, left: 0});
			row.add(avatar);
			var name = Ti.UI.createLabel({text: json["team"][i]["name"], touchEnabled: false, top: 10, left: 120, font: { fontSize:14, fontWeight: 'bold' }});
			row.add(name);
			
			// calculate offset
			var kpiCategories = json["stats"].length;
			var offset = (($.captureWin.rect.width - 138)/kpiCategories);

			var kpiButtons = new Array();
			for (var j=0; j<json["stats"].length; j++)
			{
				var kpi = Ti.UI.createLabel({text: json["stats"][j]["kpi"], touchEnabled: false, top: 30, left: offset+25-json["stats"][j]["kpi"].length, font: { fontSize:14}});
				row.add(kpi);
				var statValue = 0;
				// first time load it from the retrieved values
				if (uploadData.length == 0)
				{
					for (x=0; x<json["saved_stats"].length; x++)
					{
					
						uploadData[x] = [json["saved_stats"][x]["name"], json["saved_stats"][x]["kpi"], 1, "Upload Complete", x, json["saved_stats"][x]["user_id"]];
					}
				}
				
				for (x=0; x<uploadData.length; x++)
				{
					if (uploadData[x][1] == json["stats"][j]["kpi"] && uploadData[x][0] == json["team"][i]["name"] && uploadData[x][3] != "Deleted")
					{
						statValue++;
					}
				}
				
				var kpiButton = Ti.UI.createButton({title: statValue, top: 50, width: 80, height: 80, left: offset, borderRadius: 40, borderColor: 'grey', athlete: i, kpi_id: j, kpi: json["stats"][j]["kpi"], athlete: i, athlete_name: json["team"][i]["name"], user_id: json["team"][i]["user_id"], font: { fontSize:48, fontWeight: 'bold'}});
				
				kpiButton.addEventListener('click', function(e){
					Ti.App.fireEvent('updateStat', {user_id: e.source.user_id, kpi:e.source.kpi, kpi_id: e.source.kpi_id, athlete:e.source.athlete, athlete_name: e.source.athlete_name});
				});
				kpiButtons[j] = kpiButton;
				row.add(kpiButton);
				offset += 100;
			}
			athleteStats[i] = kpiButtons;
			sectionHeader.add(row);
		}
		tableData.push(sectionHeader);
	}	
	$.statsTable.setData(tableData);
	$.activityIndicator.hide();
	$.statsTable.visible = true;
}

function getRunningTotals()
{
	var tableData = [];
	
	$.statsTable.visible = false;
	$.statsTable.removeAllChildren();
	var statSeq = 1;
	for (var i=0; i<uploadData.length; i++)
	{
		if( uploadData[i].length > 0)
		{
			if (uploadData[i][3] != "Delete")
			{
				var row = Ti.UI.createTableViewRow({height: 60});
				var actionNo = Ti.UI.createLabel({text: statSeq++, touchEnabled: false, top: 10, left: 10, font: { fontSize:24}});
				row.add(actionNo);
				var name = Ti.UI.createLabel({text: uploadData[i][0], touchEnabled: false, top: 10, left: 50, font: { fontSize:24}});
				row.add(name);
				var kpi = Ti.UI.createLabel({text: uploadData[i][1], touchEnabled: false, top: 10, left: 300, font: { fontSize:24}});
				row.add(kpi);
				var uploadStatus = Ti.UI.createLabel({text: uploadData[i][3], touchEnabled: false, top: 10, left: 650, font: { fontSize:24}});
				row.add(uploadStatus);
				var deleteButton = Ti.UI.createButton({title: "Delete", top: 10, left: 900, seqno: uploadData[i][4], kpi: uploadData[i][1], user_id: uploadData[i][5], font: { fontSize:24}});
							
				deleteButton.addEventListener('click', function(e){
					Ti.App.fireEvent('deleteAction', {seqno:e.source.seqno, user_id:e.source.user_id, kpi:e.source.kpi});
				});
				row.add(deleteButton);
				tableData.push(row);
			}
		}
	}
	$.historyTable.setData(tableData);
	$.historyTable.visible = true;
}
