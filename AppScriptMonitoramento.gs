const SPREADSHEET_ID = '1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I';
const ABA_TRANSACOES = 'transacoes';
const ABA_ETL = 'etl_protocolos';
const HEADERS_PADRAO = [
  'codigo_unico',
  'dia_da_atualizacao',
  'secretaria',
  'nome_agrupamento',
  'serviço',
  'aberto',
  'em andamento',
  'encerrado',
  'responsavel',
  'observacao',
];

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const acao = params.action || 'upsert';

    let resultado;
    if (acao === 'registrar_etl') {
      resultado = registrarEtl();
    } else {
      const aba = params.target || ABA_TRANSACOES;
      const sheet = garantirAba(aba);
      resultado = upsertLinhas(sheet, params.data || []);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, ...resultado }))
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

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
}

function garantirAba(nome) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_PADRAO);
  }
  return sheet;
}

function mapearParaHeaders(headers, row) {
  return headers.map(h => {
    const chave = removerAcentos(h);
    return row[chave] ?? row[chave.replace(/\s+/g, '_')] ?? row[h] ?? '';
  });
}

function upsertLinhas(sheet, body) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxCodigo = headers.indexOf('codigo_unico');

  const results = body.map(row => {
    const codigo = row.codigo_unico;
    const existingRowIndex = data.findIndex((r, i) => i > 0 && r[idxCodigo] === codigo);
    const newRow = mapearParaHeaders(headers, row);

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex + 1, 1, 1, headers.length).setValues([newRow]);
      return { codigo_unico: codigo, status: 'updated' };
    }
    sheet.appendRow(newRow);
    return { codigo_unico: codigo, status: 'created' };
  });

  return { results };
}

function registrarEtl() {
  const abaEtl = garantirAba(ABA_ETL);
  const abaTransacoes = garantirAba(ABA_TRANSACOES);

  const dadosEtl = abaEtl.getDataRange().getValues();
  const headers = dadosEtl[0];
  const idxCodigo = headers.indexOf('codigo_unico');

  const dadosTrans = abaTransacoes.getDataRange().getValues();
  const idxCodigoTrans = dadosTrans[0].indexOf('codigo_unico');
  const codigosExistentes = new Set(dadosTrans.slice(1).map(r => r[idxCodigoTrans]));

  const novasLinhas = [];
  const results = dadosEtl.slice(1).map(r => {
    const codigo = r[idxCodigo];
    if (codigosExistentes.has(codigo)) {
      return { codigo_unico: codigo, status: 'skipped' };
    }
    codigosExistentes.add(codigo);
    novasLinhas.push(r);
    return { codigo_unico: codigo, status: 'registered' };
  });

  if (novasLinhas.length > 0) {
    abaTransacoes
      .getRange(abaTransacoes.getLastRow() + 1, 1, novasLinhas.length, headers.length)
      .setValues(novasLinhas);
  }

  return { results, criadas: novasLinhas.length, ignoradas: results.length - novasLinhas.length };
}

function removerAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
