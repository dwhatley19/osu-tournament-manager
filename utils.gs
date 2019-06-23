// utils.gs: various functions and utilities used by other files.

function pad(n) {
  if (n < 10) return '0' + n.toString();
  return n.toString();
}

// TODO make this KMP algorithm
function indexOf(s, find, start) {
  for (var i = start; i < s.length-find.length; i++) {
    if (s.substring(i, i+find.length) == find) {
      return i+find.length;
    }
  }
  return s.length;
}

function playerInfo(username) {
  // TODO other special characters that could screw things up...?
  var url = 'http://osu.ppy.sh/users/' + username.toString().replace('[', '%5B').replace(']', '%5D') + '/osu';
  try {
    var result = UrlFetchApp.fetch(url);
  } catch (e) {
    return null;
  }
  
  if (result.getResponseCode() == 200) {
    var text = result.getContentText();
    var json_start = '<script id="json-user" type="application/json">';
    var json_end = '</script>';

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);
    
    if (start_idx == end_idx) return null;
    
    Logger.log(start_idx);
    Logger.log(end_idx);
    
    var json_data = text.substring(start_idx, end_idx - json_end.length);
    var data = JSON.parse(json_data);

    return data;
  }
}

function beatmapInfo(bid) {
  var url = "http://osu.ppy.sh/b/" + bid.toString();
  var result = UrlFetchApp.fetch(url);
  if (result.getResponseCode() == 200) {
    var text = result.getContentText();
    var json_start = '<script id="json-beatmapset" type="application/json">';
    var json_end = '</script>';

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);
    
    if (start_idx == end_idx) return null;
    
    Logger.log(start_idx);
    Logger.log(end_idx);
    
    var json_data = text.substring(start_idx, end_idx - json_end.length);
    var data = JSON.parse(json_data);

    return data;
  }
}

// returns an *array* of all game events
function matchInfo(mid) {
  var url = "http://osu.ppy.sh/community/matches/" + mid.toString();
  var result = UrlFetchApp.fetch(url);
  if (result.getResponseCode() == 200) {
    var text = result.getContentText();
    var json_start = '<script id="json-events" type="application/json">';
    var json_end = '</script>';

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);
    
    if (start_idx == end_idx) return null;
    
    Logger.log(start_idx);
    Logger.log(end_idx);
    
    var json_data = text.substring(start_idx, end_idx - json_end.length);
    var data = JSON.parse(json_data);
    
    // NB(daw): for now, we only care about actual map-played events
    // not about host-changed events or w/e
    // this reduces the size of the data returned
    // we can change this if we're eventually interested in non-map events

    var events = data['events'];
    var res = [];
    for (var i = 0; i < events.length; i++) {
      if ('game' in events[i]) {
        res.push(events[i]['game']);
      }
    }
    
    Logger.log(res);
    return res;
  }
}

function sendMessage(message, discordUrl) {
  var payload = JSON.stringify({content: message});
  
  var params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: "POST",
    payload: payload,
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(discordUrl, params);
  
  Logger.log(response.getContentText());
}

// exponentiates base by a integer power
function exp(base, power) {
  var result = 1;
  for (var i = 0; i<power; i++) {
    result *= base;
  }
  return result;
}

// takes in a sheet name
// and returns the corresponding mappool
// as an array of map IDs
function getMappool(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  var maxMaps = 30;
  
  var mappool = [];
  for (var i = 2; i < maxMaps; i++) {
    if (spreadsheet.getRange(i, 1).getValue() == "") break;
    mappool.push(spreadsheet.getRange(i, 1).getValue().toString());
  }
  return mappool;
}

// TODO specification
function getTeams(byID) {
  if (!byID) byID = false;
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teams');
  
  var maxTeams = 100;
  var teamNameCol = 1;
  var numPlayers = 3;
  var playerCols = [2, 4, 6];
  var idCols = [3, 5, 7];
  
  var teams = {};
  for (var i = 2; i < maxTeams; i++) {
    var teamName = spreadsheet.getRange(i, 1).getValue();
    if (teamName == "") break;
    
    teams[teamName] = [];
    for (var j = 0; j < numPlayers; j++) {
      if (!byID) {
        var playerName = spreadsheet.getRange(i, playerCols[j]).getValue().toString();
        if (playerName == "") break;
        teams[teamName].push(playerName);
      } else {
        var playerID = spreadsheet.getRange(i, idCols[j]).getValue().toString();
        if (playerID == "") break;
        teams[teamName].push(playerID);
      }
    }
  }
  return teams;
}

function getStaffDataSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meta');
  var sheetID = spreadsheet.getRange(9, 1).getValue();
  var sheet2 = SpreadsheetApp.openById(sheetID).getSheetByName('data');
  return sheet2;
}

function getWebhookURL() {
  var spreadsheet = getStaffDataSheet();
  return spreadsheet.getRange(4, 1).getValue();
}

// returns an array of size 2
// first element is the ID for mentioning all referees
// second element is a dictionary in the format {'ref_name': 'ref_id'}
function getRefData() {
  var data = [];
  
  var spreadsheet = getStaffDataSheet();
  data.push(spreadsheet.getRange(6, 1).getValue());
  var maxRefs = 100;
  var refsByNameID = {};
  for (var i = 8; i < maxRefs; i++) {
    var name = spreadsheet.getRange(i, 1).getValue();
    var id = spreadsheet.getRange(i, 2).getValue().toString();
    
    if (name == "") break;
    
    refsByNameID[name] = id;
  }
  
  data.push(refsByNameID);
  return data;
}
