// registrations.gs: controller for registrations and signup sheets and functions

// TODO make this less disgusting
// - make this more efficient; don't process irrelevant parts of the JSON
// - this is a little inefficient: don't require people to the left to be processed before
//   people on the right are
// (Setizia TODO) BWS
function handlePlayers(e, spreadsheet, forceCompute) {
  var numRows = e.range.getNumRows();
  var startRow = e.range.getRow(), startCol = e.range.getColumn();
  
  if (forceCompute) {
    startRow = 2;
    numRows = 0;
    while (spreadsheet.getRange('B' + (numRows + 2).toString()).getValue() != '') numRows++;
  }
  
  for (var row = startRow; row < startRow + numRows; row++) {
    if (row <= 1) continue; // skip first row
    
    var r = row.toString();
    
    // change these if number of players gets higher
    var cols = ['D', 'F', 'H']; // "player1", "player2", etc. cols
    var nextCols = ['E', 'G', 'I']; // "pp1", "pp2", etc. cols
    var perfIndexCol = 'J'; // perf index column
    var otherCols = ['A', 'B', 'C', 'K']; // columns that aren't in the above
    var maxPlayers = 3; // max players on a team
    var ppVals = [0, 0, 0];
    var highest = 2; // number of PP vals considered in PI calculation
    var firstCol = 'A', lastCol = 'K'; // first and last columns to consider
    var totalCols = 11;
    var bwsPpVals = [0, 0, 0]; // BWS-adjusted pp values
    var bwsAdditive = 15825;
    var bwsMultiplier = .9937;
    var lastModifiedCol = 'M';
    var teamIDCol = 'B';
    
    // cell backgrounds when invalid team:
    var backgrounds = [[]];
    for (var i = 0; i < totalCols; i++) {
      backgrounds[0].push('#FFBF80');
    }
    var backgrounds2 = [[]];
    for (var i = 0; i < totalCols; i++) {
      backgrounds2[0].push('#FFFF00');
    }
    
    var badRow = false; // if an invalid team member exists
    var requiredPpl = 2; // if fewer than 2 ppl, bad team!
    var maxPerfIndex = 65 * 1e6;
    var minPerfIndex = 21.25 * 1e6;
    
    for (var i = 0; i < maxPlayers; i++) {
      var username = spreadsheet.getRange(cols[i] + r).getValue();
      if (username == '') {
        // set blank cell rows to blank
        spreadsheet.getRange(nextCols[i] + r).setValue('');
        spreadsheet.getRange(nextCols[i] + r).setBackground('#FFFFFF');
        requiredPpl -= 1;
        continue;
      }
      
      var data = playerInfo(username);
      
      if (data == null) {
        spreadsheet.getRange(nextCols[i] + r).setValue('nnnn');
        badRow = true;
        continue;
      }
      
      // TODO auto-format?
      spreadsheet.getRange(nextCols[i] + r).setNumberFormat('0,0');
      spreadsheet.getRange(nextCols[i] + r).setValue(data.statistics.pp);
      ppVals[i] = data.statistics.pp;
      bwsPpVals[i] = (ppVals[i] - bwsAdditive)*(exp(bwsMultiplier, data.badges.length*data.badges.length)) + bwsAdditive;
    }
    
    if (badRow || requiredPpl <= 0) {
      spreadsheet.getRange(firstCol + r + ':' + lastCol + r).setBackgrounds(backgrounds);
      continue;
    }
    
    // compute perf index
    // TODO idk how to sort arrays in google scripts >.<
    var perfIndex = 0;
    for (var i = 0; i < maxPlayers; i++) {
      var count = 0;
      for (var j = 0; j < maxPlayers; j++) {
        // if (ppVals[j] < ppVals[i]) count++;
        if (bwsPpVals[j] < bwsPpVals[i]) count++;
      }
      // if this is one of the top <highest> PP vals
      if (count >= maxPlayers - highest) {
        // perfIndex += ppVals[i] * ppVals[i];
        perfIndex += bwsPpVals[i] * bwsPpVals[i];
        spreadsheet.getRange(nextCols[i] + r).setBackground('#00FFFF');
      } else {
        spreadsheet.getRange(nextCols[i] + r).setBackground('#FFFFFF');
      }
    }
    
    spreadsheet.getRange(perfIndexCol + r).setNumberFormat('0,0');
    spreadsheet.getRange(perfIndexCol + r).setValue(perfIndex);
    
    if (perfIndex > maxPerfIndex || perfIndex < minPerfIndex) {
      spreadsheet.getRange(firstCol + r + ':' + lastCol + r).setBackgrounds(backgrounds2);
    } else {
      for (var i = 0; i < cols.length; i++) {
        spreadsheet.getRange(cols[i] + r).setBackground('#FFFFFF');
      }
      for (var i = 0; i < otherCols.length; i++) {
        spreadsheet.getRange(otherCols[i] + r).setBackground('#FFFFFF');
      }
      spreadsheet.getRange(perfIndexCol + r).setBackground('#FFFFFF');
    }
    
    spreadsheet.getRange(lastModifiedCol + r).setValue(Utilities.formatDate(new Date(), 'UTC', 'MM/dd HH:mm:ss'));
    spreadsheet.getRange('T' + (row - 1).toString());
  }
}

function computeCountries(e, spreadsheet) {
  var numRows = e.range.getNumRows();
  var startRow = e.range.getRow(), startCol = e.range.getColumn();
  
  for (var row = startRow; row < startRow + numRows; row++) {
    if (row <= 1) continue; // skip first row
    var r = row.toString();
    
    var playerCols = ['B', 'E', 'H'];
    var idCols = ['C', 'F', 'I'];
    var countryCols = ['D', 'G', 'J'];
    
    for (var i = 0; i < playerCols.length; i++) {
      var player = spreadsheet.getRange(playerCols[i] + r).getValue();
      var data = playerInfo(player);
      
      if (data == null) {
        spreadsheet.getRange(idCols[i] + r).setValue('');
        spreadsheet.getRange(countryCols[i] + r).setValue('');
      } else {
        spreadsheet.getRange(idCols[i] + r).setValue(data.id);
        spreadsheet.getRange(countryCols[i] + r).setValue(data.country.code);
      }
    }
  }
}