function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const data = params.data ? JSON.parse(params.data) : params;
  const rawAmount = data.amount || 0;
  const amount = String(rawAmount).includes('$') ? String(rawAmount) : `${rawAmount}$`;
  const status = data.status || data.resultStatus || '';

  ensureHeaders(sheet);

  const headers = getHeaders(sheet);
  const row = new Array(headers.length).fill('');

  setCell(row, headers, 'Date', data.date ? new Date(data.date) : new Date());
  setCell(row, headers, 'Number', data.number || data.phone || '');
  setCell(row, headers, 'Country', data.country || '');
  setCell(row, headers, 'Age', data.age || '');
  setCell(row, headers, 'Amount', amount);
  setCell(row, headers, 'Status', status);

  sheet.appendRow(row);

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
  const headers = ['Date', 'Number', 'Country', 'Age', 'Amount', 'Status'];
  const sheets = spreadsheet.getSheets();

  const matchingSheet = sheets.find((sheet) => {
    const values = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    return headers.every((header) => values.includes(header));
  });

  return matchingSheet || spreadsheet.getActiveSheet() || sheets[0];
}

function ensureHeaders(sheet) {
  const requiredHeaders = ['Date', 'Number', 'Country', 'Age', 'Amount', 'Status'];
  const lastColumn = Math.max(requiredHeaders.length, sheet.getLastColumn());
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  requiredHeaders.forEach((header) => {
    if (!currentHeaders.includes(header)) {
      currentHeaders.push(header);
    }
  });

  sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function setCell(row, headers, header, value) {
  const index = headers.indexOf(header);
  if (index >= 0) {
    row[index] = value;
  }
}