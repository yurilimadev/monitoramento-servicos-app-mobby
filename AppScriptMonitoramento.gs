const SPREADSHEET_ID = '1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I';
const SHEET_NAME = 'transacoes';

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const headers = sheet.getDataRange().getValues()[0];
    const data = sheet.getDataRange().getValues();
    const body = params.data || [];

    const results = body.map(row => {
      const codigo = row.codigo_unico;
      const existingRowIndex = data.findIndex((r, i) => i > 0 && r[headers.indexOf('codigo_unico')] === codigo);

      const newRow = headers.map(h => {
        const chave = removerAcentos(h);
        return row[chave] ?? row[chave.replace(/\s+/g, '_')] ?? row[h] ?? '';
      });

      if (existingRowIndex > 0) {
        sheet.getRange(existingRowIndex + 1, 1, 1, headers.length).setValues([newRow]);
        return { codigo_unico: codigo, status: 'updated' };
      } else {
        sheet.appendRow(newRow);
        return { codigo_unico: codigo, status: 'created' };
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true, results }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ error: 'Use POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function removerAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
}
