const SHEET_NAME = 'Prize Requests';

function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const parsed = params.data ? JSON.parse(params.data) : params;
  const claim = parsed.claim || parsed;

  sheet.appendRow([
    new Date(),
    claim.fullName || parsed.fullName || parsed.name || '',
    claim.country || parsed.country || '',
    parsed.countryCode || '',
    claim.phone || parsed.phone || parsed.whatsapp || '',
    claim.amount || parsed.amount || '',
    parsed.score || '',
    parsed.language || '',
    parsed.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Received At',
      'Full Name',
      'Country',
      'Country Code',
      'WhatsApp',
      'Amount / Prize',
      'Score',
      'Language',
      'Submitted At'
    ]);
  }

  return sheet;
}
