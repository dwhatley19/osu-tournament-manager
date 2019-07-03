// main.gs: controller for all sheets
// delegates work to other functions upon spreadsheet edit / form submit

function specialOnFormSubmit(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(spreadsheet.getSheetName);
  if (spreadsheet.getSheetName() == "registrations") {
    handlePlayers(e, spreadsheet, false);
  }
  // TODO add more stuff here
}

function specialOnEdit(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(spreadsheet.getSheetName());
  // force compute?
  if (spreadsheet.getSheetName() == "registrations") {
    var forceComputeRow = 1;
    var forceComputeCol = 11;
    Logger.log(e.range.getRow());
    if (
      e.range.getRow() == forceComputeRow &&
      e.range.getColumn() == forceComputeCol
    ) {
      // uncomment this line to enable force-computing
      // tbh I don't wanna cuz then stuff might time out :/
      // handlePlayers(e, spreadsheet, true);
    } else {
      handlePlayers(e, spreadsheet, false);
    }
  } else if (spreadsheet.getSheetName() == "badge data") {
    computeCountries(e, spreadsheet);
  } else if (spreadsheet.getSheetName() == "Qualifiers schedules") {
    onQualsEdit(e, spreadsheet.getSheetByName("Qualifiers schedules"));
  } else if (spreadsheet.getSheetName().indexOf("schedules") != -1) {
    setMatchResults(e, spreadsheet);
  }
  // TODO add more stuff here
}

// Run this to create a new edit trigger.
// Only do it once upon creating a new sheet.
function createSpreadsheetEditTrigger() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("specialOnEdit")
    .forSpreadsheet(ss)
    .onEdit()
    .create();
}

// Run this to create a new form submit trigger.
// Only do it once upon creating a new sheet.
function createSpreadsheetFormSubmitTrigger() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("specialOnFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
}
