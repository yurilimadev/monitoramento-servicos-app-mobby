import { config, validarConfigLeitura } from '../config.js'
import { normalizar } from './csvParser.js'

async function fetchAba(range, rotulo) {
  validarConfigLeitura()
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?key=${config.apiKey}`
  const resp = await fetch(url)
  if (!resp.ok) {
    const detalhe = await extrairErro(resp)
    const dica = resp.status === 403
      ? ' Verifique se a planilha está compartilhada como "Qualquer pessoa com o link → Leitor".'
      : ''
    throw new Error(`Erro ao ler ${rotulo} (${resp.status})${detalhe ? ': ' + detalhe : ''}.${dica}`)
  }
  const json = await resp.json()
  return parseSheetData(json)
}

async function extrairErro(resp) {
  try {
    const json = await resp.json()
    return json?.error?.message || ''
  } catch {
    return ''
  }
}

export async function fetchDadosDaPlanilha() {
  return fetchAba(config.range, 'planilha')
}

export async function fetchReferenceData() {
  return fetchAba(config.referenceRange, 'referência')
}

function dataParaComp(valor) {
  const m = String(valor || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? Number(m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0')) : null
}

export async function buscarDadosSalvos(secretaria, agrupamento, dataInicio, dataFim) {
  const dados = await fetchDadosDaPlanilha()
  return dados.filter(row => {
    const matchSec = normalizar(row.secretaria) === normalizar(secretaria)
    const matchAgrup = normalizar(row.nome_agrupamento) === normalizar(agrupamento)
    let matchData = true
    if (dataInicio && dataFim) {
      const rowData = dataParaComp(row.dia_da_atualizacao)
      const inicioComp = dataParaComp(dataInicio)
      const fimComp = dataParaComp(dataFim)
      matchData = rowData !== null && rowData >= inicioComp && rowData <= fimComp
    }
    return matchSec && matchAgrup && matchData
  })
}

function parseSheetData(json) {
  const rows = json.values || []
  if (rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => {
      const key = normalizar(h).replace(/\s+/g, '_')
      obj[key] = row[i] ?? ''
    })
    return obj
  })
}
