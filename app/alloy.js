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

var DATABASE_NAME = 'wcstats012.sqlite';

db = Ti.Database.open(DATABASE_NAME);
db.execute('CREATE TABLE IF NOT EXISTS assignment(name TEXT, assignment_id INTEGER, activity_id INTEGER, logo_url TEXT);');
db.execute('CREATE TABLE IF NOT EXISTS assignment_event(assignment_id INTEGER, assignment_event_id INTEGER, opponent TEXT, opponent_id INTEGER, event_date TEXT, logo_url TEXT);');
db.execute('CREATE TABLE IF NOT EXISTS assignment_event_team(assignment_event_id INTEGER, user_id INTEGER, avatar TEXT, name TEXT, role TEXT);');
db.execute('CREATE TABLE IF NOT EXISTS assignment_event_stat_template(activity_training_template_id INTEGER, assignment_event_id INTEGER, kpi TEXT);');
db.execute('CREATE TABLE IF NOT EXISTS assignment_event_user_stat(assignment_id INTEGER, assignment_event_id INTEGER, user_id INTEGER, kpi TEXT, seq_no INTEGER, upload_status TEXT);');
db.close();

// see if there is any data to send
setInterval(uploadUnsentData, 5000);

function uploadUnsentData()
{
	var pendingUploads = selectAssignmentEventUserStatsPendingUpload();
	for (var i=0; i<pendingUploads.length; i++)
	{
		console.log('process this: ',pendingUploads[i].assignment_id, pendingUploads[i].assignment_event_id, pendingUploads[i].user_id, pendingUploads[i].seq_no, pendingUploads[i].kpi, pendingUploads[i].upload_status);
		postStatUpdate(pendingUploads[i].assignment_id, pendingUploads[i].assignment_event_id, pendingUploads[i].user_id, pendingUploads[i].seq_no, pendingUploads[i].kpi, pendingUploads[i].upload_status);
	}
}

function postStatUpdate(assignment_id, event_id, user_id, seq_no, kpi, a)
{
	var xhr = Ti.Network.createHTTPClient(
	{
		onload: function() 
		{
			postResponse = JSON.parse(this.responseText);
			
			if (postResponse["success"] == true)
			{
				console.log('upload complete ', event_id, user_id, kpi, seq_no);
				updateAssignmentEventUserStat(event_id, user_id, kpi, seq_no, a != "Pending Delete"?"Upload Complete":"Delete");
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

// Assignment Database calls
function selectAssignments()
{
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select ROWID, * from assignment');
	while (rows.isValidRow()) {
		retData.push({assignment_id:rows.fieldByName('assignment_id'), activity_id:rows.fieldByName('activity_id'), name:rows.fieldByName('name'), logo_url:rows.fieldByName('logo_url')});
		rows.next();
	}
	db.close();
	return retData;
}

function addAssignment(assignment_id, activity_id, name, logo_url) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('insert into assignment values (?,?,?,?)', name, assignment_id, activity_id, logo_url);
	mydb.close();
}

function deleteAssignments() 
{
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment');
	mydb.close();
}
// END Assignemnt Database calls

// AssignmentEvent Database calls
function selectAssignmentEvents(assignment_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event where assignment_id = ?', assignment_id);
	while (rows.isValidRow()) {
		retData.push({assignment_id:rows.fieldByName('assignment_id'), assignment_event_id:rows.fieldByName('assignment_event_id'), opponent:rows.fieldByName('opponent'), logo_url:rows.fieldByName('logo_url')});
		rows.next();
	}
	db.close();
	return retData;
}

function selectAssignmentEvent(assignment_event_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event where assignment_event_id = ?', assignment_event_id);
	while (rows.isValidRow()) {
		retData.push({assignment_id:rows.fieldByName('assignment_id'), assignment_event_id:rows.fieldByName('assignment_event_id'), activity_id:rows.fieldByName('activity_id'), name:rows.fieldByName('name'), logo_url:rows.fieldByName('logo_url')});
		rows.next();
	}
	db.close();
	return retData;
};

function updateAssignmentEvent(assignment_event_id, opponent, opponent_id, event_date, logo_url) { 
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('update assignment_event set opponent = ?, opponent_id = ?, event_date = ?, logo_url = ? where assignment_event_id = ?', opponent, opponent_id, event_date, logo_url, assignment_event_id);
	var rows = mydb.execute('select * from assignment_event where assignment_event_id = ?', assignment_event_id);
	mydb.close();
	return rows;
}

function addAssignmentEvent(assignment_id, assignment_event_id, opponent, opponent_id, event_date, logo_url) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('insert into assignment_event values (?,?,?,?,?,?)', assignment_id, assignment_event_id, opponent, opponent_id, event_date, logo_url);
	mydb.close();
}

function deleteAssignmentEvents(assignment_id) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment_event where assignment_id = ?', assignment_id);
	mydb.close();
}
// END AssignemntEvent Database calls

// AssignmentEventTeam Database calls
function selectAssignmentEventTeam(assignment_event_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_team where assignment_event_id = ?', assignment_event_id);
	while (rows.isValidRow()) {
		retData.push({assignment_event_id:rows.fieldByName('assignment_event_id'), user_id:rows.fieldByName('user_id'), avatar:rows.fieldByName('avatar'), name:rows.fieldByName('name'), role:rows.fieldByName('role')});
		rows.next();
	}
	db.close();
	return retData;
}

// AssignmentEventTeam Database calls
function selectAssignmentEventTeamMemberName(assignment_event_id, user_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_team where assignment_event_id = ? and user_id = ?', assignment_event_id, user_id);
	while (rows.isValidRow()) {
		retData.push({name:rows.fieldByName('name')});
		rows.next();
	}
	db.close();
	return retData;
}

function updateAssignmentEventTeam(assignment_event_id, user_id, avatar, name) { 
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('update assignment_event set user_id = ?, avatar = ?, name = ?, role = ? where assignment_event_id = ?', user_id, avatar, name, role, assignment_event_id);
	var rows = mydb.execute('select * from assignment_event_team where assignment_event_id = ?', assignment_event_id);
	mydb.close();
	return rows;
}

function addAssignmentEventTeamMember(assignment_event_id, user_id, avatar, name, role) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('insert into assignment_event_team values (?,?,?,?,?)', assignment_event_id, user_id, avatar, name, role);
	mydb.close();
}

function deleteAssignmentEventTeam(assignment_event_id) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment_event_team where assignment_event_id = ?', assignment_event_id);
	mydb.close();
};

function deleteAssignmentEventTeamMember(assignment_event_id) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment_event_team where assignment_event_id = ? and user_id = ?', assignment_event_id, user_id);
	mydb.close();
};
// END AssignemntEventTeam Database calls

// AssignmentEventStatTemplate Database calls
function selectAssignmentEventStatTemplate(assignment_event_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_stat_template where assignment_event_id = ?', assignment_event_id);
	while (rows.isValidRow()) {
		retData.push({activity_training_template_id:rows.fieldByName('activity_training_template_id'), assignment_event_id:rows.fieldByName('assignment_event_id'), kpi:rows.fieldByName('kpi')});
		rows.next();
	}
	db.close();
	return retData;
}

function updateAssignmentEventStatTemplate(activity_training_template_id, assignment_event_id, kpi) { 
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('update assignment_event_stat_template set kpi = ? where assignment_event_id = ?', kpi, assignment_event_id, activity_training_template_id);
	var rows = mydb.execute('select * from assignment_event_stat_template where assignment_event_id = ?', assignment_event_id);
	mydb.close();
	return rows;
}

function addAssignmentEventStatTemplateItem(activity_training_template_id, assignment_event_id, kpi) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('insert into assignment_event_stat_template values (?,?,?)', activity_training_template_id, assignment_event_id, kpi);
	mydb.close();
}

function deleteAssignmentEventStatTemplateItem(assignment_event_id, activity_training_template_id) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment_event_stat_template where assignment_event_id = ? and activity_training_template_id = ?', assignment_event_id, activity_training_template_id);
	mydb.close();
}

function deleteAssignmentEventStatTemplate(assignment_event_id) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('delete from assignment_event_stat_template where assignment_event_id = ?', assignment_event_id);
	mydb.close();
}
// END AssignmentEventStatTemplate Database calls

// AssignmentEventUserStat Database calls
function selectAssignmentEventUserStat(assignment_event_id, user_id, kpi, seq_no) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_user_stat where assignment_event_id = ? and user_id = ? and kpi = ? and seq_no = ? ORDER BY seq_no ASC', assignment_event_id, user_id, kpi, seq_no);
	while (rows.isValidRow()) {
		retData.push({assignment_event_id:rows.fieldByName('assignment_event_id'), user_id:rows.fieldByName('user_id'), seq_no:rows.fieldByName('seq_no'), kpi:rows.fieldByName('kpi'), upload_status:rows.fieldByName('upload_status')});
		rows.next();
	}
	db.close();
	return retData;
}

function selectAssignmentEventUserStatsPendingUpload() {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_user_stat where upload_status = "Pending Upload" or upload_status = "Pending Delete"');
	while (rows.isValidRow()) {
		retData.push({assignment_id:rows.fieldByName('assignment_id'), assignment_event_id:rows.fieldByName('assignment_event_id'), user_id:rows.fieldByName('user_id'), seq_no:rows.fieldByName('seq_no'), kpi:rows.fieldByName('kpi'), upload_status:rows.fieldByName('upload_status')});
		rows.next();
	}
	db.close();
	return retData;
}

function selectNextAssignmentEventUserStatSeqno(assignment_event_id)
{
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select max(seq_no) as max_seqno from assignment_event_user_stat where assignment_event_id = ?', assignment_event_id);
	while (rows.isValidRow()) {
		retData.push({max_seqno:rows.fieldByName('max_seqno')});
		rows.next();
	}
	db.close();
	return retData;
}

function selectAssignmentEventUserStatCount(assignment_event_id, user_id, kpi) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select kpi, count(*) as total from assignment_event_user_stat where assignment_event_id = ? and user_id = ? and kpi = ? and upload_status != ?', assignment_event_id, user_id, kpi, "Delete");
	while (rows.isValidRow()) {
		retData.push({total:rows.fieldByName('total')});
		rows.next();
	}
	db.close();
	return retData;
}

function selectAssignmentEventUserStats(assignment_event_id) {
	var retData = [];
	var db = Ti.Database.open(DATABASE_NAME);
	var rows = db.execute('select * from assignment_event_user_stat where assignment_event_id = ?', assignment_event_id);
	while (rows.isValidRow()) {
		retData.push({assignment_event_id:rows.fieldByName('assignment_event_id'), user_id:rows.fieldByName('user_id'), seq_no:rows.fieldByName('seq_no'), kpi:rows.fieldByName('kpi'), upload_status:rows.fieldByName('upload_status')});
		rows.next();
	}
	db.close();
	return retData;
}

function updateAssignmentEventUserStat(assignment_event_id, user_id, kpi, seq_no, upload_status) { 
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('update assignment_event_user_stat set upload_status = ? where assignment_event_id = ? and user_id = ? and seq_no = ?', upload_status, assignment_event_id, user_id, seq_no);
	var rows = mydb.execute('select * from assignment_event_user_stat where assignment_event_id = ? and user_id = ? and seq_no = ?', assignment_event_id, user_id, seq_no);
	mydb.close();
	return rows;
}

function addAssignmentEventUserStat(assignment_id, assignment_event_id, user_id, kpi, seq_no, upload_status) {
	var mydb = Ti.Database.open(DATABASE_NAME);
	mydb.execute('insert into assignment_event_user_stat values (?, ?,?,?,?,?)', assignment_id, assignment_event_id, user_id, kpi, seq_no, upload_status);
	mydb.close();
}
// END AssignmentEventUserStat Database calls
