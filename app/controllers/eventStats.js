var args = arguments[0] || {};

var assignment_id = args[0];
var event_id = args[1];
var activity_id = args[2];
var athleteStats = new Array();
var seqno = 0;

$.captureTab.addEventListener('focus', function(e){
    buildCaptureUI();
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
	var nextSeqNo = selectNextAssignmentEventUserStatSeqno(event_id);
	seqno = nextSeqNo[0].max_seqno == null?0:parseInt(nextSeqNo[0].max_seqno)+1;
	addAssignmentEventUserStat(assignment_id, event_id, e.user_id, e.kpi, seqno, "Pending Upload");
	//postStatUpdate(assignment_id, event_id, e.user_id, seqno, e.kpi, "Save");
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
	    	updateAssignmentEventUserStat(event_id, ev.source.user_id, ev.source.kpi, ev.source.seqno, "Pending Delete");
			getRunningTotals();
	      break;
	    case 1:
	      	break;
	    }
	});
	alertWindow.show();
};

Ti.App.addEventListener('deleteAction', deleteAction);

getEventTeam();

function getEventTeam()
{
	var tableData = [];
	
	$.activityIndicator.show();

	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
			var json = JSON.parse(this.responseText);
			if (json != null)
			{
				deleteAssignmentEventTeam(event_id);
				deleteAssignmentEventStatTemplate(event_id);
			}
			
			for (var i=0; i<json["team"].length; i++)
			{
				addAssignmentEventTeamMember(event_id, parseInt(json["team"][i]["user_id"]), json["team"][i]["avatar"], json["team"][i]["name"], json["team"][i]["role"]);
			}	
			var team = selectAssignmentEventTeam(event_id);
			console.log(team.length);
			for (var j=0; j<json["stats"].length; j++)
			{
				addAssignmentEventStatTemplateItem(parseInt(json["stats"][j]["id"]), event_id, json["stats"][j]["kpi"]);
			}
			
			if (json["saved_stats"] != null)
			{
				for (var k=0; k<json["saved_stats"].length; k++)
				{
					var userStat = selectAssignmentEventUserStat(event_id, parseInt(json["saved_stats"][k]["user_id"]),json["saved_stats"][k]["kpi"], parseInt(json["saved_stats"][k]["seq_no"]));
					
					if (userStat.length == 0)
					{
						console.log('gonna create this: ', assignment_id, event_id, parseInt(json["saved_stats"][k]["user_id"]), json["saved_stats"][k]["kpi"], parseInt(json["saved_stats"][k]["seq_no"]), "Upload Complete");
						addAssignmentEventUserStat(assignment_id, event_id, parseInt(json["saved_stats"][k]["user_id"]), parseInt(json["saved_stats"][k]["kpi"]), parseInt(json["saved_stats"][k]["seq_no"]), "Upload Complete");
					}
					else
					{
						updateAssignmentEventUserStat(event_id, parseInt(json["saved_stats"][k]["user_id"]), parseInt(json["saved_stats"][k]["kpi"]), parseInt(json["saved_stats"][k]["seq_no"]), "Upload Complete");
					}
				}	
			}	
			
			buildCaptureUI();
		},
		onerror : function(e) {
		    buildCaptureUI();
		},
		timeout : 10000  // in milliseconds
	});
	xhr.open('GET', webserver+'/assignments/' + assignment_id + '/assignment_events/' + event_id + '/assignment_events/team_and_stat_template.json');
	xhr.setRequestHeader("X-CSRFToken", Ti.App.Properties.getString("csrf"));
	xhr.send();	
}

function buildCaptureUI()
{
	var team = selectAssignmentEventTeam(event_id);
	var stat_template = selectAssignmentEventStatTemplate(event_id);
	var user_stats = selectAssignmentEventUserStats(event_id);			
	var tableData = [];		
	var sectionName;
	var sectionHeader;

	for (var i=0; i<team.length; i++)
	{
		if (sectionName != team[i].role)
		{
			if (i != 0)
			{
				tableData.push(sectionHeader);
			}
			sectionHeader = Ti.UI.createTableViewSection({headerTitle: team[i].role, height: 50, touchEnabled: false});
			sectionName = team[i].role;
		}
		
		var row = Ti.UI.createTableViewRow({height: 140, touchEnabled: false});
		var avatarPath = "missing_avatar.png";
		if (team[i].avatar != "missing_avatar.png")
		{
			avatarPath = team[i].avatar;
		}
		var avatar = image({image: avatarPath, width: Ti.UI.SIZE, height: Ti.UI.SIZE, left: 0});
		row.add(avatar);
		var name = Ti.UI.createLabel({text: team[i].name, touchEnabled: false, top: 10, left: 120, font: { fontSize:14, fontWeight: 'bold' }});
		row.add(name);
		
		// calculate offset
		var kpiCategories = stat_template.length;
		var offset = (($.captureWin.rect.width - 138)/kpiCategories)+5;

		var kpiButtons = new Array();
		for (var j=0; j<stat_template.length; j++)
		{
			var kpi = Ti.UI.createLabel({text: stat_template[j].kpi, touchEnabled: false, top: 30, left: offset+25-stat_template[j].kpi.length, font: { fontSize:14}});
			row.add(kpi);
			var statValue = selectAssignmentEventUserStatCount(event_id, team[i].user_id, stat_template[j].kpi);
			
			var kpiButton = Ti.UI.createButton({title: statValue[0].total, top: 50, width: 80, height: 80, left: offset, borderRadius: 40, borderColor: 'grey', athlete: i, kpi_id: j, kpi: stat_template[j].kpi, athlete: i, athlete_name: team[i].name, user_id: team[i].user_id, font: { fontSize:48, fontWeight: 'bold'}});
			
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
	var team_stats = selectAssignmentEventUserStats(event_id);
	for (var i=0; i<team_stats.length; i++)
	{
		if (team_stats[i].upload_status != "Delete")
		{
			var row = Ti.UI.createTableViewRow({height: 60});
			var actionNo = Ti.UI.createLabel({text: team_stats[i].seq_no, touchEnabled: false, top: 10, left: 10, font: { fontSize:24}});
			row.add(actionNo);
			var playerName = selectAssignmentEventTeamMemberName(event_id, team_stats[i].user_id);
			var name = Ti.UI.createLabel({text: playerName[0].name, touchEnabled: false, top: 10, left: 50, font: { fontSize:24}});
			row.add(name);
			var kpi = Ti.UI.createLabel({text: team_stats[i].kpi, touchEnabled: false, top: 10, left: 300, font: { fontSize:24}});
			row.add(kpi);
			var uploadStatus = Ti.UI.createLabel({text: team_stats[i].upload_status, touchEnabled: false, top: 10, left: 650, font: { fontSize:24}});
			row.add(uploadStatus);
			var deleteButton = Ti.UI.createButton({title: "Delete", top: 10, left: 900, seqno: team_stats[i].seq_no, kpi: team_stats[i].kpi, user_id: team_stats[i].user_id, font: { fontSize:24}});
						
			deleteButton.addEventListener('click', function(e){
				Ti.App.fireEvent('deleteAction', {seqno:e.source.seqno, user_id:e.source.user_id, kpi:e.source.kpi});
			});
			row.add(deleteButton);
			tableData.push(row);
		}
	}
	$.historyTable.setData(tableData);
	$.historyTable.visible = true;
}
