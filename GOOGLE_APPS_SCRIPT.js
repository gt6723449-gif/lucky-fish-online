const SHEET_NAME = 'Prize Requests';

function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const data = params.data ? JSON.parse(params.data) : params;

  sheet.appendRow([
    data.date ? new Date(data.date) : new Date(),
    data.fullName || '',
    data.country || '',
    data.phone || '',
    data.amount || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('Lucky Fish Apps Script is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const headers = ['Date', 'Full Name', 'Country', 'Phone', 'Amount'];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = currentHeaders.some((value) => value);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}