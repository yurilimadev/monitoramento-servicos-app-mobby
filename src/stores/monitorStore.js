import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchDadosDaPlanilha, fetchReferenceData } from '../services/sheetApi.js'

export const useMonitorStore = defineStore('monitor', () => {
  const referenceData = ref([])
  const selectedSecretaria = ref('')
  const selectedAgrupamento = ref('')
  const selectedResponsavel = ref('')
  const selectedDataInicio = ref('')
  const selectedDataFim = ref('')
  const selectedServico = ref('')
  const servicesToRender = ref([])
  const allPlanilhaData = ref([])
  const loading = ref(false)
  const error = ref('')

  const secretarias = computed(() => {
    const secs = [...new Set(referenceData.value.map(i => i.secretaria))]
    return secs.sort()
  })

  const agrupamentos = computed(() => {
    if (!selectedSecretaria.value) return []
    const ags = [...new Set(
      referenceData.value
        .filter(i => i.secretaria === selectedSecretaria.value)
        .map(i => i.nome_agrupamento)
    )]
    return ags.sort()
  })

  const responsaveis = computed(() => {
    const resps = [...new Set(
      referenceData.value
        .map(i => i.responsavel)
        .filter(r => r && r.trim() !== '')
    )]
    return resps.sort()
  })

  const servicos = computed(() => {
    const svcs = [...new Set(
      allPlanilhaData.value
        .map(i => i.servico || i.serviço || '')
        .filter(s => s && s.trim() !== '')
    )]
    return svcs.sort()
  })

  async function loadReferenceData() {
    error.value = ''
    try {
      referenceData.value = await fetchReferenceData()
    } catch (err) {
      referenceData.value = []
      error.value = err?.message || String(err)
      console.error('Erro ao carregar referência:', err)
    }
  }

  function filtrarServicos() {
    const raw = referenceData.value.filter(i =>
      i.secretaria === selectedSecretaria.value &&
      i.nome_agrupamento === selectedAgrupamento.value
    )
    const seen = new Set()
    servicesToRender.value = raw.filter(i => {
      if (seen.has(i.servico)) return false
      seen.add(i.servico)
      return true
    })
  }

  async function loadPlanilhaData() {
    loading.value = true
    error.value = ''
    try {
      allPlanilhaData.value = await fetchDadosDaPlanilha()
    } catch (err) {
      allPlanilhaData.value = []
      error.value = err?.message || String(err)
      console.error('Erro ao carregar planilha:', err)
    } finally {
      loading.value = false
    }
  }

  async function reloadAll() {
    await Promise.all([loadReferenceData(), loadPlanilhaData()])
  }

  function limparErro() {
    error.value = ''
  }

  function resetFilters(mode) {
    selectedSecretaria.value = ''
    selectedAgrupamento.value = ''
    selectedDataInicio.value = ''
    selectedDataFim.value = ''
    selectedServico.value = ''
    selectedResponsavel.value = ''
    if (mode === 'update') {
      servicesToRender.value = []
    }
  }

  return {
    referenceData, selectedSecretaria, selectedAgrupamento,
    selectedResponsavel, selectedDataInicio, selectedDataFim, selectedServico, servicesToRender,
    allPlanilhaData, loading, error,
    secretarias, agrupamentos, responsaveis, servicos,
    loadReferenceData, filtrarServicos, loadPlanilhaData, reloadAll, limparErro, resetFilters,
  }
})