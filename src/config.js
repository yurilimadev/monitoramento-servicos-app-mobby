export const config = {
  apiKey: import.meta.env.VITE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  range: import.meta.env.VITE_SHEETS_RANGE,
  referenceRange: 'referencia_servicos',
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL,
}