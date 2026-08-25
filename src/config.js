export const config = {
  apiKey: import.meta.env.VITE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  range: import.meta.env.VITE_SHEETS_RANGE,
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL,
  csvReferenceUrl: 'dados_transacoes_entrada_manual - referencia_servicos.csv',
}