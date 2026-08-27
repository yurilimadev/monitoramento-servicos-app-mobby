/**
 * Google Apps Script — Web App de upsert para o Monitoramento de Serviços
 *
 * Como usar:
 *   1. No Google Sheets, vá em Extensões → Apps Script
 *   2. Cole este código
 *   3. Implante → Novo deployment → Web App
 *      - Executar como: "Eu"
 *      - Quem tem acesso: "Qualquer pessoa" (para uso público via API key)
 *   4. Copie a URL gerada e use como VITE_APPS_SCRIPT_URL no .env
 *
 * A planilha precisa de duas abas:
 *   - transacoes: dados lançados (colunas: dia_da_atualizacao, secretaria, ...)
 *   - referencia_servicos: catálogo de servios (secretaria, agrupamento, servico, ...)
 *
 * O upsert usa a coluna 'codigo_unico' como chave primria.
 * Se j existe, atualiza a linha; se no, adiciona ao final.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('transacoes');
    if (!sheet) throw new Error('Aba "transacoes" no encontrada');

    const payload = JSON.parse(e.postData.contents);
    const rows = payload.data; // array de objetos

    // Pega cabealho existente na planilha
    const headers = sheet.getDataRange().getValues()[0] || [];
    const codigoUnicoColIdx = headers.indexOf('codigo_unico');
    if (codigoUnicoColIdx === -1) throw new Error('Coluna 'codigo_unico' no encontrada na aba transacoes');

    // Lee todos os dados existentes para buscar duplicatas
    const existingData = sheet.getDataRange().getValues();
    const updateRows = []; // linhas para atualizar (1-indexed)
    const insertRows = []; // objetos para inserir

    rows.forEach(row => {
      const codigo = row.codigo_unico || '';
      if (!codigo) {
        insertRows.push(row);
        return;
      }

      // Procura por codigo_unico existente
      let found = false;
      for (let i = 0; i < existingData.length; i++) {
        if (existingData[i][codigoUnicoColIdx] === codigo) {
          updateRows.push({ index: i + 1, data: row }); // +1 porque sheet 1-indexed
          found = true;
          break;
        }
      }
      if (!found) {
        insertRows.push(row);
      }
    });

    // Atualiza linhas existentes
    updateRows.forEach(({ index, data }) => {
      const rowValues = headers.map(h => data[h] || '');
      sheet.getRange(index, 1, 1, headers.length).setValues([rowValues]);
    });

    // Insere novas linhas no final
    if (insertRows.length > 0) {
      const newRows = insertRows.map(row => headers.map(h => row[h] || ''));
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, updated: updateRows.length, inserted: insertRows.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}