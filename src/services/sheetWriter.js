import { config } from '../config.js'
import { normalizar } from './csvParser.js'

export async function upsertDados(dataToSend) {
  const payload = {
    data: dataToSend.map(row => {
      const obj = {}
      Object.keys(row).forEach(key => {
        obj[normalizar(key).replace(/\s+/g, '_')] = row[key]
      })
      return obj
    }),
  }

  const resp = await fetch(config.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) throw new Error(`Erro ao enviar: ${resp.status}`)
  return resp.json()
}