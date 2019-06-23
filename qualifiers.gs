// qualifiers.gs: controller for qualifiers-related sheets and functions

function isTriggerCell(row, col, spreadsheet) {
  return spreadsheet.getRange(row, col - 1).getValue() == "Match ID:";
}

// returns an array of teams in a given match,
// given the cell used to trigger editing
function getInfoFromTriggerCell(row, col, spreadsheet) {
  var info = {};
  
  var maxTeams = 8;
  var teams = [];
  for (var i = col + 2; i < col + 2 + maxTeams; i++) {
    var team = spreadsheet.getRange(row - 1, i).getValue();
    if (team == "") break;
    teams.push(team);
  }
  info['teams'] = teams;
  
  return info;
}

function setResultsFromTriggerCell(row, col, spreadsheet, results) {
  var startRow = row, startCol = col + 2;
  var numRows = results.length, numCols = results[0].length;
  spreadsheet.getRange(startRow, startCol, numRows, numCols).setValues(results);
}

// returns index into matchTeams
// corresponding to the team that userID is on
function getTeamFromPlayerID(userID, allTeamsByID, matchTeams) {
  for (var i in allTeamsByID) {
    for (var j = 0; j < allTeamsByID[i].length; j++) {
      if (parseInt(userID) == parseInt(allTeamsByID[i][j])) {
        return matchTeams.indexOf(i);
      }
    }
  }
  return -1;
}

// 
function computeQualsResults(matchInfo, allTeamsByID, matchTeams, mappool) {
  var data = [];
  var numMembersFound = [];
  for (var i = 0; i < mappool.length; i++) {
    // TODO deep copy
    var zeroArr = [];
    var zeroArr2 = [];
    for (var j = 0; j < matchTeams.length; j++) {
      zeroArr.push(0);
      zeroArr2.push(0);
    }
    data.push(zeroArr);
    numMembersFound.push(zeroArr2);
  }
  
  var expectedNumMembers = 2;
  
  var defaultErrorText = "There were errors!";
  data.push([defaultErrorText]); // for error reporting
  var errorRow = mappool.length;
  
  // generic errors
  var nonScoreV2 = false;
  
  for (var i = 0; i < matchInfo.length; i++) {
    var map = matchInfo[i];
    var bid = map['beatmap']['id'].toString();
    var row = mappool.indexOf(bid);
    
    // ignore maps not in the mappool and report an error
    if (row == -1) {
      data[errorRow][0] += " | map " + bid + " was played but is not in the mappool";
      continue;
    }
    
    if (map['scoring_type'] != 'scorev2') nonScoreV2 = true;
    
    var scores = map['scores'];
    for (var j = 0; j < scores.length; j++) {
      var userID = scores[j]['user_id'].toString();
      Logger.log(userID);
      var score = scores[j]['score'];
      
      // find user ID in list of match teams
      var teamIndex = getTeamFromPlayerID(userID, allTeamsByID, matchTeams);
      if (teamIndex == -1) {
        data[errorRow][0] += " | user ID " + userID + " not found";
      } else {
        console.log(row);
        data[row][teamIndex] += score;
        numMembersFound[row][teamIndex]++;
      }
    }
  }
  
  // make error messages for generic errors
  if (nonScoreV2) {
    data[errorRow][0] += " | some maps were not played using scoreV2!";
  }
  
  for (var i = 0; i < mappool.length; i++) {
    for (var j = 0; j < matchTeams.length; j++) {
      if (numMembersFound[i][j] != expectedNumMembers) {
        data[errorRow][0] += " | " + numMembersFound[i][j].toString() +
          " members of team " + matchTeams[j] + " played for map " + mappool[i] + "!";
      }
    }
  }
  
  // clear error row if no errors
  if (data[errorRow][0] == defaultErrorText) {
    data[errorRow][0] = "";
  }
  
  return data;
}

function onQualsEdit(e, spreadsheet) {
  if (isTriggerCell(e.range.getRow(), e.range.getColumn(), spreadsheet)) {
    var mappool = getMappool("Qualifiers mappool");
    
    var allTeamsByName = getTeams();
    var allTeamsByID = getTeams(true);
    
    var info = getInfoFromTriggerCell(
      e.range.getRow(),
      e.range.getColumn(), 
      spreadsheet
    );
    var matchTeams = info['teams'];
    var matchID = spreadsheet.getRange(e.range.getRow(), e.range.getColumn()).getValue();
    if (matchID.toString() != "") {
      Logger.log(matchTeams);
      Logger.log(allTeamsByID);
      
      var matchInfo2 = matchInfo(matchID);
      
      var results = computeQualsResults(matchInfo2, allTeamsByID, matchTeams, mappool);
      setResultsFromTriggerCell(
        e.range.getRow(),
        e.range.getColumn(),
        spreadsheet,
        results
      );
    }
  }
}

