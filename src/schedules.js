// schedules.gs: controller for bracket-stage sheets and functions
// TODO rename to brackets.gs?

function setMatchResults(e, spreadsheet) {
  var numRows = e.range.getNumRows();
  var startRow = e.range.getRow(),
    startCol = e.range.getColumn();

  var columns = ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"];
  var matchResultsCol = "Y";

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

    var matchID = spreadsheet
      .getRange("B" + r)
      .getValue()
      .toString();
    var redTeam = "`" + spreadsheet.getRange("C" + r).getValue() + "`";
    var blueTeam = "`" + spreadsheet.getRange("D" + r).getValue() + "`";
    var redScore = spreadsheet.getRange("O" + r).getValue();
    var blueScore = spreadsheet.getRange("P" + r).getValue();
    var redRoll = spreadsheet.getRange("Q" + r).getValue();
    var blueRoll = spreadsheet.getRange("R" + r).getValue();
    var redBanID = spreadsheet.getRange("S" + r).getValue();
    var blueBanID = spreadsheet.getRange("T" + r).getValue();
    var rdBanID = spreadsheet.getRange("U" + r).getValue();
    var rdSuccess = spreadsheet.getRange("V" + r).getValue();
    var rdScore = spreadsheet.getRange("W" + r).getValue();
    var mpLink = spreadsheet.getRange("X" + r).getValue();
    var posted = spreadsheet.getRange("Z" + r).getValue();
    var redBanIDs = [],
      blueBanIDs = [];
    var redBans = [],
      blueBans = [],
      rdBan = "";

    var maxScore = 3;
    var stage = "Group Stage";
    var mappoolStage = "";

    var metadata = getMetaInfo();
    for (var sheetName in metadata) {
      if (
        spreadsheet.getSheetName() == sheetName &&
        parseInt(matchID.substring(0, 2)) <= metadata[sheetName].lbMaxMatch1
      ) {
        maxScore = metadata[sheetName].lbBestTo;
        stage = metadata[sheetName].lbStage1;
        mappoolStage = metadata[sheetName].lbMapStage;
        break;
      } else if (
        spreadsheet.getSheetName() == sheetName &&
        parseInt(matchID.substring(0, 2)) <= metadata[sheetName].lbMaxMatch2
      ) {
        maxScore = metadata[sheetName].lbBestTo;
        stage = metadata[sheetName].lbStage2;
        mappoolStage = metadata[sheetName].lbMapStage;
        break;
      } else if (spreadsheet.getSheetName() == sheetName) {
        maxScore = metadata[sheetName].wbBestTo;
        stage = metadata[sheetName].wbStage;
        mappoolStage = metadata[sheetName].wbMapStage;
        break;
      }
    }

    var mappool = getMappool(mappoolStage + " mappool");
    for (var i = 0; i < mappool.length; i++) {
      if (redBanID.indexOf(mappool[i].code) >= 0) {
        redBanIDs.push(mappool[i].code);
        redBans.push(mappool[i].name);
      } else if (blueBanID.indexOf(mappool[i].code) >= 0) {
        blueBanIDs.push(mappool[i].code);
        blueBans.push(mappool[i].name);
      } else if (mappool[i].code == rdBanID) rdBan = mappool[i].name;
    }

    // comments included to simulate an example match results message

    // **RO32: Match 13**
    var resultsCell = "**" + stage + ": Match " + matchID + "**\n";

    // Final Score: **Stoof & Friends  |  4** - 3  |  NaJi
    resultsCell +=
      "Final Score: " +
      (redScore == maxScore
        ? "**" + redTeam + "**  |  **" + redScore + "**"
        : redTeam + "  |  " + redScore) +
      " - " +
      (blueScore == maxScore
        ? "**" + blueScore + "  |  " + blueTeam + "**"
        : blueScore + "  |  " + blueTeam) +
      "\n";
    if (redScore == "FF" || blueScore == "FF") {
      resultsCell += "This match was forfeited by a team.";
    } else {
      // Roll Winner: Stoof & Friends (73 to 41)
      resultsCell +=
        "Roll Winner: " +
        (redRoll > blueRoll ? redTeam : blueTeam) +
        " (" +
        redRoll +
        " to " +
        blueRoll +
        ")\n";
      // MP Link: <https://osu.ppy.sh/community/matches/53152575>
      resultsCell += "MP Link: <" + mpLink + ">\n\n";
      resultsCell += "**Bans:**\n";
      resultsCell += "__" + redTeam + "__\n";
      for (var i = 0; i < redBans.length; i++) {
        resultsCell += "**" + redBanIDs[i] + "** | " + redBans[i] + "\n";
      }
      resultsCell += "__" + blueTeam + "__\n";
      for (var i = 0; i < blueBans.length; i++) {
        resultsCell += "**" + blueBanIDs[i] + "** | " + blueBans[i] + "\n";
      }

      if (rdBan != "N/A") {
        resultsCell += "Redemption ban:\n**" + rdBanID + "** | " + rdBan;
        resultsCell +=
          " (banned by " +
          (rdSuccess.charAt(rdSuccess.length - 1) == "2" ? redTeam : blueTeam) +
          ")\n";
      }
      resultsCell += "\n";

      resultsCell +=
        "Redemption outcome: Redemption " +
        (rdSuccess == "not played"
          ? "was **not played**"
          : (rdSuccess.charAt(0) == "y"
              ? "**successful**"
              : "**unsuccessful**") +
            " by " +
            (rdSuccess.charAt(rdSuccess.length - 1) == "2"
              ? blueTeam
              : redTeam) +
            " (Score: " +
            rdScore +
            ")");
    }

    if (allEmpty || posted == "yes") {
      spreadsheet.getRange(matchResultsCol + r).setValue("");
    } else {
      spreadsheet.getRange(matchResultsCol + r).setValue(resultsCell);
    }
  }
}

function createSchedules() {
  var spreadsheet = SpreadsheetApp.getActiveSheet();
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

  var maxSaturdayMatches =
    (metadata[sheetName].maxMatch - metadata[sheetName].minMatch + 1) / 2;
  if (
    metadata[sheetName].lbMaxMatch1 >= 0 ||
    metadata[sheetName].lbMaxMatch2 >= 0
  ) {
    // include matches from WB and LB round n, not LB round n+1
    maxSaturdayMatches =
      metadata[sheetName].lbMaxMatch1 - metadata[sheetName].minMatch + 1;
    maxSaturdayMatches +=
      metadata[sheetName].maxMatch - metadata[sheetName].lbMaxMatch2;
  }

  var startDate = metadata[sheetName].startDate;

  for (var i = 2; i < 32; i++) {
    var team1 = spreadsheet.getRange(i, team1Col).getValue();
    var team2 = spreadsheet.getRange(i, team2Col).getValue();

    if (!(team1 in teamTZs && team2 in teamTZs)) continue;

    // for example, "UTC-9" becomes -9 and "UTC" becomes 0
    var tz1 = teamTZs[team1].substring(3);
    var tz2 = teamTZs[team2].substring(3);
    tz1 = tz1 == "" ? 0 : parseInt(tz1);
    tz2 = tz2 == "" ? 0 : parseInt(tz2);

    // the ideal time for the match, 18:00 local time
    var idealTime = new Date(startDate);
    idealTime.setHours(18, 0, 0);

    var mintz = Math.min(tz1, tz2),
      maxtz = Math.max(tz1, tz2);
    var hourDiff = (mintz + maxtz) / 2;
    if (maxtz - mintz > 12) {
      hourDiff = (mintz + 24 + maxtz) / 2;
    }

    idealTime.setHours(idealTime.getHours() - hourDiff);

    if (saturdayMatches >= maxSaturdayMatches) {
      idealTime.setHours(idealTime.getHours() + 24);
    } else {
      saturdayMatches++;
    }

    spreadsheet.getRange(i, matchTimeCol).setValue(idealTime);
  }
}
