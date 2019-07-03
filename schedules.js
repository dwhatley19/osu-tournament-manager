// schedules.gs: controller for bracket-stage sheets and functions
// TODO rename to brackets.gs?

function setMatchResults(e, spreadsheet) {
  var numRows = e.range.getNumRows();
  var startRow = e.range.getRow(),
    startCol = e.range.getColumn();

  var columns = ["N", "O", "P", "Q", "R", "S", "T", "U"];
  var matchResultsCol = "V";

  for (var row = startRow; row < startRow + numRows; row++) {
    if (row <= 1) continue;

    var r = row.toString();
    var allEmpty = true;
    for (var i = 0; i < columns.length; i++) {
      if (spreadsheet.getRange(columns[i] + r).getValue() != "") {
        allEmpty = false;
        break;
      }
    }

    var matchID = spreadsheet.getRange("B" + r).getValue();
    var redTeam = spreadsheet.getRange("C" + r).getValue();
    var blueTeam = spreadsheet.getRange("D" + r).getValue();
    var redScore = spreadsheet.getRange("N" + r).getValue();
    var blueScore = spreadsheet.getRange("O" + r).getValue();
    var redRoll = spreadsheet.getRange("P" + r).getValue();
    var blueRoll = spreadsheet.getRange("Q" + r).getValue();
    var redBan = spreadsheet.getRange("R" + r).getValue();
    var blueBan = spreadsheet.getRange("S" + r).getValue();
    var rdSuccess = spreadsheet.getRange("T" + r).getValue();
    var mpLink = spreadsheet.getRange("U" + r).getValue();
    var posted = spreadsheet.getRange("W" + r).getValue();

    // fix this... please...
    var maxScore = 3;
    var stage = "Group Stage";
    if (spreadsheet.getSheetName() == "RO32 schedules") {
      maxScore = 4;
      stage = "Bracket Stage";
    } else if (spreadsheet.getSheetName() == "RO16 schedules") {
      maxScore = 4;
      stage = "Bracket Stage";
    } else if (
      spreadsheet.getSheetName() == "QF schedules" &&
      matchID.substring(0, 2) == "WB"
    ) {
      maxScore = 5;
      stage = "Bracket Stage";
    } else if (spreadsheet.getSheetName() == "QF schedules") {
      maxScore = 4;
      stage = "Bracket Stage";
    } else if (
      spreadsheet.getSheetName() == "SF schedules" &&
      matchID.substring(0, 2) == "WB"
    ) {
      maxScore = 6;
      stage = "Bracket Stage";
    } else if (spreadsheet.getSheetName() == "SF schedules") {
      maxScore = 5;
      stage = "Bracket Stage";
    } else if (
      spreadsheet.getSheetName() == "Finals schedules" &&
      matchID.substring(0, 2) == "WB"
    ) {
      maxScore = 7;
      stage = "Bracket Stage";
    } else if (spreadsheet.getSheetName() == "Finals schedules") {
      maxScore = 6;
      stage = "Bracket Stage";
    } else if (spreadsheet.getSheetName() == "Grand Finals schedules") {
      maxScore = 7;
      stage = "Bracket Stage";
    }
    // END fix this... please...

    var resultsCell = "**" + stage + ": Match " + matchID + "**\n";
    resultsCell +=
      "Red Team: `" + redTeam + "`\nBlue Team: `" + blueTeam + "`\n\n";
    resultsCell +=
      "Score: " +
      (redScore == maxScore
        ? "**`" + redTeam + "` " + redScore + "**"
        : "`" + redTeam + "` " + redScore) +
      " - " +
      (blueScore == maxScore
        ? "**`" + blueTeam + "` " + blueScore + "**"
        : "`" + blueTeam + "` " + blueScore) +
      "\n";
    if (redScore == "FF" || blueScore == "FF") {
      resultsCell += "This match was forfeited by a team.";
    } else {
      resultsCell += "Rolls: " + redRoll + ", " + blueRoll + "\n";
      resultsCell += "Bans: " + redBan + ", " + blueBan + "\n";
      resultsCell +=
        "Redemption " +
        (rdSuccess == "not played"
          ? "was **not played**\n"
          : (rdSuccess == "yes" ? "**succeeded**" : "**failed**") +
            " by `" +
            (redScore == maxScore ? blueTeam : redTeam) +
            "`\n");
      resultsCell += "MP link: " + mpLink;
    }

    if (allEmpty || posted == "yes") {
      spreadsheet.getRange(matchResultsCol + r).setValue("");
    } else {
      spreadsheet.getRange(matchResultsCol + r).setValue(resultsCell);
    }
  }
}

function createSchedules() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "RO32 schedules"
  ); //getActiveSheet();
  var sheetName = spreadsheet.getName();

  var teamInfo = getTeams();
  var teamTZs = {};
  for (var team in teamInfo) {
    teamTZs[team] = teamInfo[team].tz;
  }

  var metadata = getMetaInfo();

  var team1Col = 3,
    team2Col = 4,
    matchTimeCol = 5;
  var saturdayMatches = 0;
  var maxSaturdayMatches = metadata[sheetName].numMatches / 2 + 1;
  var startDate = metadata[sheetName].startDate;

  for (var i = 2; i < 18; i++) {
    var team1 = spreadsheet.getRange(i, team1Col).getValue();
    var team2 = spreadsheet.getRange(i, team2Col).getValue();

    // for example, "UTC-9" becomes -9 and "UTC" becomes 0
    var tz1 = teamTZs[team1].substring(3);
    var tz2 = teamTZs[team2].substring(3);
    tz1 = tz1 == "" ? 0 : parseInt(tz1);
    tz2 = tz2 == "" ? 0 : parseInt(tz2);

    // the ideal time for the match, 16:00 local time
    var idealTime = new Date(startDate);
    idealTime.setHours(16, 0, 0);

    var mintz = Math.min(tz1, tz2),
      maxtz = Math.max(tz1, tz2);
    var hourDiff = (mintz + maxtz) / 2;
    if (maxtz - mintz > 12) {
      hourDiff = (mintz + 24 + maxtz) / 2;
    }

    idealTime.setHours(idealTime.getHours() - hourDiff);

    if (saturdayMatches > maxSaturdayMatches) {
      idealTime.setHours(idealTime.getHours() + 24);
    } else {
      saturdayMatches++;
    }

    spreadsheet.getRange(i, matchTimeCol).setValue(idealTime);
  }
}
