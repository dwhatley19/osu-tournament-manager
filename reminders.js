// reminders.gs: controller for sending reminders to referees.

function findPlayersByTeamName(team1, team2) {
  var initial = "Please use the following to remind the teams:\n```";
  var result = initial;
  var found = 0;
  
  var allTeams = getTeams();
  var matchTeams = [team1, team2];
  
  for (var i = 0; i < matchTeams.length; i++) {
    for (var j = 0; j < allTeams[matchTeams[i]].length; j++) {
      var playerName = allTeams[matchTeams[i]][j];
      if (playerName != "") result += "\@" + playerName + " ";
    }
    result += "\n";
    found++;
  }
  result += "Match soon!```";
  
  if (found != 2) {
    result += "**WARNING**: Not all players were found! You may need to add additional @-mentions.";
  }
  return result;
}

function remindMatches() {
  var discordUrl = getWebhookURL;
  
  var refData = getRefData();
  
  var refereesID = '<@&' + refData[0] + '>';
  var refIDs = refData[1];
  
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().indexOf('schedules') == -1) continue;
    // TODO don't hardcode this...
    var matchIdCol = 2;
    var matchTimeCol = 5;
    var team1Col = 3, team2Col = 4;
    var refCol = 11;
    for (var r = 2; r < 50; r++) {
      var time = new Date(sheets[i].getRange(r, matchTimeCol).getValue());
      var now = new Date();
      Logger.log(time);
      Logger.log(now);
      var diffInHours = (time - now) / (3600 * 1000);
      Logger.log(diffInHours);
      // WTF
      if (diffInHours > 0 && diffInHours < 1) {
        var ref = sheets[i].getRange(r, refCol).getValue();
        var matchID = sheets[i].getRange(r, matchIdCol).getValue();
        var team1 = sheets[i].getRange(r, team1Col).getValue();
        var team2 = sheets[i].getRange(r, team2Col).getValue();
        var message = "";
        if (ref in refIDs) {
          message = "<@" + refIDs[ref] + ">\nYou have a match (" + matchID + ") in less than an hour!";
        } else if (ref == "") {
          message = refereesID + "\nThere is no referee for a match (" + matchID + ") that is happening in less than an hour!";
        } else {
          message = "@" + ref + "\nYou have a match (" + matchID + ") in less than an hour!";
        }
        sendMessage(message + '\n' + findPlayersByTeamName(team1, team2), discordUrl);
      }
    }
  }
}