export const config = {
  apiKey: import.meta.env.VITE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  range: import.meta.env.VITE_SHEETS_RANGE || 'transacoes',
  referenceRange: import.meta.env.VITE_REFERENCE_RANGE || 'referencia_servicos',
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL,
}

export function validarConfigLeitura() {
  const faltando = []
  if (!config.apiKey) faltando.push('VITE_SHEETS_API_KEY')
  if (!config.spreadsheetId) faltando.push('VITE_SPREADSHEET_ID')
  if (!config.range) faltando.push('VITE_SHEETS_RANGE')
  if (!config.referenceRange) faltando.push('VITE_REFERENCE_RANGE')
  if (faltando.length > 0) {
    throw new Error(`Configuração ausente: ${faltando.join(', ')}. Crie/ajuste o .env.local.`)
  }
}

export function validarConfigEscrita() {
  if (!config.appsScriptUrl) {
    throw new Error('Configuração ausente: VITE_APPS_SCRIPT_URL. Crie/ajuste o .env.local.')
  }
}
