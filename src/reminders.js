// reminders.gs: controller for sending reminders to referees.

function findPlayersByTeamName(matchTeams) {
  var initial = "Please use the following to remind the teams:\n```";
  var result = initial;
  var found = 0;

  var teamInfo = getTeams();
  var allTeams = {};
  for (var team in teamInfo) {
    allTeams[team] = teamInfo[team].players;
  }

  for (var i = 0; i < matchTeams.length; i++) {
    for (var j = 0; j < allTeams[matchTeams[i]].length; j++) {
      var playerName = allTeams[matchTeams[i]][j];
      if (playerName != "") result += "@" + playerName + " ";
    }
    result += "\n";
    found++;
  }
  result += "Match soon!```";

  var numExpectedTeams = matchTeams.length;
  if (found != numExpectedTeams) {
    result +=
      "**WARNING**: Not all players were found! You may need to add additional @-mentions.";
  }
  return result;
}

// returns {sheetName: [[matchID, time, ref, [team1, ...]], ...], ...}
function getMatchIDTimeRefTeams(sheets) {
  var ans = {};
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName();
    if (sheetName.indexOf("schedules") == -1) continue;

    // if: bracket stage sheets, else: qualifier sheet
    if (sheetName.indexOf("Qualifiers") == -1) {
      ans[sheetName] = [];

      var matchIdCol = 2;
      var matchTimeCol = 5;
      var refCol = 11;
      var maxRows = 50;
      var team1Col = 3,
        team2Col = 4;
      var firstRow = 2;

      for (var r = firstRow; r < maxRows; r++) {
        var ref = sheets[i].getRange(r, refCol).getValue();
        var matchID = sheets[i].getRange(r, matchIdCol).getValue();
        var time = new Date(sheets[i].getRange(r, matchTimeCol).getValue());
        var teams = [
          sheets[i].getRange(r, team1Col).getValue(),
          sheets[i].getRange(r, team2Col).getValue()
        ];

        ans[sheetName].push({
          matchID: matchID,
          time: time,
          ref: ref,
          teams: teams
        });
      }
    } else {
      ans[sheetName] = [];

      // below implementation assumes we traverse lobbies in column-first order
      var cols = [2, 14],
        curCol = 0;
      var firstRow = 4,
        rowDiff = 15,
        curRow = firstRow;
      var rowTimeRefDist = 2,
        colTimeRefDist = 0;
      var rowTimeTrigDist = 1,
        colTimeTrigDist = 0;
      var curLobby = 1;

      while (curCol < cols.length) {
        // this is assuming every lobby has a time assigned
        if (sheets[i].getRange(curRow, cols[curCol]).getValue() == "") {
          curCol++;
          curRow = firstRow;
          continue;
        }

        var ref = sheets[i]
          .getRange(curRow + rowTimeRefDist, cols[curCol] + colTimeRefDist)
          .getValue();
        var matchID = curLobby;
        var time = new Date(
          sheets[i].getRange(curRow, cols[curCol]).getValue()
        );
        var teams = getInfoFromTriggerCell(
          curRow + rowTimeTrigDist,
          cols[curCol] + colTimeTrigDist,
          sheets[i]
        )["teams"];

        ans[sheetName].push({
          matchID: matchID,
          time: time,
          ref: ref,
          teams: teams
        });

        curLobby++;
        curRow += rowDiff;
      }
    }
  }
  return ans;
}

function remindMatches() {
  var discordUrl = getWebhookURL();

  var refData = getRefData();

  var refereesID = "<@&" + refData[0] + ">";
  var refIDs = refData[1];

  var allSheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var matchInfo = getMatchIDTimeRefTeams(allSheets);

  for (var m in matchInfo) {
    var matchList = matchInfo[m];
    for (var i = 0; i < matchList.length; i++) {
      var matchID = matchList[i].matchID;
      var time = matchList[i].time;
      var ref = matchList[i].ref;
      var teams = matchList[i].teams;

      var now = new Date();
      var millisInHour = 3600 * 1000;
      var diffInHours = (time - now) / millisInHour;
      if (diffInHours > 0 && diffInHours < 2) {
        var message = "";
        if (ref in refIDs) {
          message =
            "<@" + refIDs[ref] + ">\nYou have a match (" + matchID + ") soon!";
        } else {
          message =
            refereesID +
            "\nThere is no referee for a match (" +
            matchID +
            ") that is happening soon!";
        }

        sendMessage(message + "\n" + findPlayersByTeamName(teams), discordUrl);
      }
    }
  }
}
