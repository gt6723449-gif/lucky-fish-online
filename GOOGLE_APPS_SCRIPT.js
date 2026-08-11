function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const data = params.data ? JSON.parse(params.data) : params;

  ensureHeaders(sheet);

  if (data.action === 'checkPhone') {
    return jsonResponse({ ok: true, exists: phoneExists(sheet, data.number || data.phone || '') });
  }

  saveSubmission(sheet, data);
  return jsonResponse({ ok: true });
}

function doGet(e) {
  const params = e.parameter || {};

  if (params.action === 'checkPhone') {
    const sheet = getSheet();
    ensureHeaders(sheet);
    const payload = { ok: true, exists: phoneExists(sheet, params.number || '') };

    if (params.callback) {
      return ContentService
        .createTextOutput(params.callback + '(' + JSON.stringify(payload) + ');')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    return jsonResponse(payload);
  }

  return ContentService
    .createTextOutput('Lucky Fish Apps Script is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

function saveSubmission(sheet, data) {
  const headers = getHeaders(sheet);
  const number = data.number || data.phone || '';
  const rowNumber = findPhoneRow(sheet, number);
  const targetRow = rowNumber || sheet.getLastRow() + 1;
  const existingRow = rowNumber
    ? sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0]
    : new Array(headers.length).fill('');
  const row = existingRow.slice();
  const rawAmount = data.amount;
  const amount = rawAmount === undefined || rawAmount === null || rawAmount === ''
    ? ''
    : String(rawAmount).includes('$') ? String(rawAmount) : String(rawAmount) + '$';
  const status = data.status || data.resultStatus || '';

  if (!getCell(row, headers, 'Date')) {
    setCell(row, headers, 'Date', data.date ? new Date(data.date) : new Date());
  }

  setCell(row, headers, 'Number', number);
  setCell(row, headers, 'Country', data.country || getCell(row, headers, 'Country') || '');
  setCell(row, headers, 'Age', data.age || getCell(row, headers, 'Age') || '');

  if (amount !== '') {
    setCell(row, headers, 'Amount', amount);
  }

  if (status) {
    setCell(row, headers, 'Status', status);
  }

  sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);
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

function getCell(row, headers, header) {
  const index = headers.indexOf(header);
  return index >= 0 ? row[index] : '';
}

function phoneExists(sheet, number) {
  return Boolean(findPhoneRow(sheet, number));
}

function findPhoneRow(sheet, number) {
  const normalizedNumber = normalizePhone(number);
  if (!normalizedNumber) return null;

  const headers = getHeaders(sheet);
  const numberColumnIndex = headers.indexOf('Number') + 1;
  if (numberColumnIndex <= 0 || sheet.getLastRow() < 2) return null;

  const values = sheet.getRange(2, numberColumnIndex, sheet.getLastRow() - 1, 1).getValues();
  const foundIndex = values.findIndex((row) => normalizePhone(row[0]) === normalizedNumber);
  return foundIndex >= 0 ? foundIndex + 2 : null;
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}