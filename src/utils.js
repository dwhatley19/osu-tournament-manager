// utils.gs: various functions and utilities used by other files.

function pad(n) {
  if (n < 10) return "0" + n.toString();
  return n.toString();
}

// TODO make this KMP algorithm
function indexOf(s, find, start) {
  for (var i = start; i < s.length - find.length; i++) {
    if (s.substring(i, i + find.length) == find) {
      return i + find.length;
    }
  }
  return s.length;
}

function playerInfo(username) {
  // TODO other special characters that could screw things up...?
  var url =
    "http://osu.ppy.sh/users/" +
    username
      .toString()
      .replace("[", "%5B")
      .replace("]", "%5D") +
    "/osu";
  try {
    var result = UrlFetchApp.fetch(url);
  } catch (e) {
    return null;
  }

  if (result.getResponseCode() == 200) {
    var text = result.getContentText();
    var json_start = '<script id="json-user" type="application/json">';
    var json_end = "</script>";

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);

    if (start_idx == end_idx) return null;

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
    var json_end = "</script>";

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);

    if (start_idx == end_idx) return null;

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
    var json_end = "</script>";

    var start_idx = indexOf(text, json_start, 0);
    var end_idx = indexOf(text, json_end, start_idx);

    if (start_idx == end_idx) return null;

    var json_data = text.substring(start_idx, end_idx - json_end.length);
    var data = JSON.parse(json_data);

    // NB(daw): for now, we only care about actual map-played events
    // not about host-changed events or w/e
    // this reduces the size of the data returned
    // we can change this if we're eventually interested in non-map events

    var events = data["events"];
    var res = [];
    for (var i = 0; i < events.length; i++) {
      if ("game" in events[i]) {
        res.push(events[i]["game"]);
      }
    }

    return res;
  }
}

function sendMessage(message, discordUrl) {
  var payload = JSON.stringify({ content: message });

  var params = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(discordUrl, params);
}

// exponentiates base by a integer power
function exp(base, power) {
  var result = 1;
  for (var i = 0; i < power; i++) {
    result *= base;
  }
  return result;
}

// takes in a sheet name
// and returns the corresponding mappool
// as an array of map IDs
function getMappool(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    sheetName
  );

  var maxMaps = 30;

  var mappool = [];
  for (var i = 2; i < maxMaps; i++) {
    if (spreadsheet.getRange(i, 1).getValue() == "") break;
    var id = spreadsheet
      .getRange(i, 1)
      .getValue()
      .toString();
    var code = spreadsheet
      .getRange(i, 2)
      .getValue()
      .toString();
    var name = spreadsheet
      .getRange(i, 4)
      .getValue()
      .toString();
    mappool.push({ id: id, code: code, name: name });
  }
  return mappool;
}

// TODO specification
function getTeams() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "Teams"
  );

  var maxTeams = 100;
  var teamNameCol = 1;
  var numPlayers = 3;
  var playerCols = [2, 4, 6];
  var idCols = [3, 5, 7];
  var timezoneCol = 9;

  var teams = {};
  for (var i = 2; i < maxTeams; i++) {
    var teamName = spreadsheet.getRange(i, 1).getValue();
    if (teamName == "") break;

    teams[teamName] = { players: [], ids: [] };
    for (var j = 0; j < numPlayers; j++) {
      var playerName = spreadsheet
        .getRange(i, playerCols[j])
        .getValue()
        .toString();
      if (playerName == "") break;
      teams[teamName].players.push(playerName);

      var playerID = spreadsheet
        .getRange(i, idCols[j])
        .getValue()
        .toString();
      if (playerID == "") break;
      teams[teamName].ids.push(playerID);

      var tz = spreadsheet
        .getRange(i, timezoneCol)
        .getValue()
        .toString();
      if (tz == "") break;
      teams[teamName].tz = tz;
    }
  }
  return teams;
}

function getStaffDataSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "meta"
  );
  var sheetID = spreadsheet.getRange(9, 1).getValue();
  var sheet2 = SpreadsheetApp.openById(sheetID).getSheetByName("data");
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
    var id = spreadsheet
      .getRange(i, 2)
      .getValue()
      .toString();

    if (name == "") break;

    refsByNameID[name] = id;
  }

  data.push(refsByNameID);
  return data;
}

function getMetaInfo() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "meta"
  );

  var maxRounds = 10;
  var sheetNameCol = 1;
  var startDateCol = 13;
  var minMatchCol = 3;
  var maxMatchCol = 4;
  var lbMaxMatch1Col = 8;
  var lbMaxMatch2Col = 9;
  var wbStageCol = 2;
  var lbStage1Col = 10;
  var lbStage2Col = 11;
  var wbBestToCol = 5;
  var lbBestToCol = 7;
  var wbMapStageCol = 6;
  var lbMapStageCol = 12;

  var metadata = {};
  for (var i = 2; i < maxRounds; i++) {
    var sheetName = spreadsheet.getRange(i, sheetNameCol).getValue();
    metadata[sheetName] = {
      startDate: spreadsheet.getRange(i, startDateCol).getValue(),
      minMatch: spreadsheet.getRange(i, minMatchCol).getValue(),
      maxMatch: spreadsheet.getRange(i, maxMatchCol).getValue(),
      lbMaxMatch1: spreadsheet.getRange(i, lbMaxMatch1Col).getValue(),
      lbMaxMatch2: spreadsheet.getRange(i, lbMaxMatch2Col).getValue(),
      wbStage: spreadsheet.getRange(i, wbStageCol).getValue(),
      lbStage1: spreadsheet.getRange(i, lbStage1Col).getValue(),
      lbStage2: spreadsheet.getRange(i, lbStage2Col).getValue(),
      wbBestTo: spreadsheet.getRange(i, wbBestToCol).getValue(),
      lbBestTo: spreadsheet.getRange(i, lbBestToCol).getValue(),
      wbMapStage: spreadsheet.getRange(i, wbMapStageCol).getValue(),
      lbMapStage: spreadsheet.getRange(i, lbMapStageCol).getValue()
    };
  }

  return metadata;
}
