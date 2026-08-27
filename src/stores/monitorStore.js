import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchDadosDaPlanilha, fetchReferenceData } from '../services/sheetApi.js'

export const useMonitorStore = defineStore('monitor', () => {
  const referenceData = ref([])
  const selectedSecretaria = ref('')
  const selectedAgrupamento = ref('')
  const selectedResponsavel = ref('')
  const selectedData = ref('')
  const selectedServico = ref('')
  const servicesToRender = ref([])
  const allPlanilhaData = ref([])
  const loading = ref(false)

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

  async function loadReferenceData() {
    referenceData.value = await fetchReferenceData()
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
    try {
      allPlanilhaData.value = await fetchDadosDaPlanilha()
    } finally {
      loading.value = false
    }
  }

  function resetFilters(mode) {
    selectedSecretaria.value = ''
    selectedAgrupamento.value = ''
    selectedData.value = ''
    selectedServico.value = ''
    selectedResponsavel.value = ''
    if (mode === 'update') {
      servicesToRender.value = []
    }
  }

  return {
    referenceData, selectedSecretaria, selectedAgrupamento,
    selectedResponsavel, selectedData, selectedServico, servicesToRender,
    allPlanilhaData, loading,
    secretarias, agrupamentos, responsaveis,
    loadReferenceData, filtrarServicos, loadPlanilhaData, resetFilters,
  }
})