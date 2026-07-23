function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const data = params.data ? JSON.parse(params.data) : params;

  ensureHeaders(sheet);

  sheet.appendRow([
    data.date ? new Date(data.date) : new Date(),
    data.number || data.phone || '',
    data.country || '',
    data.score || 0
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
  const headers = ['Date', 'Number', 'Country', 'Score'];
  const sheets = spreadsheet.getSheets();

  const matchingSheet = sheets.find((sheet) => {
    const values = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    return headers.every((header, index) => values[index] === header);
  });

  return matchingSheet || spreadsheet.getActiveSheet() || sheets[0];
}

function ensureHeaders(sheet) {
  const headers = ['Date', 'Number', 'Country', 'Score'];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((header, index) => currentHeaders[index] === header);

  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}