<template>
  <div class="row g-4">
    <div class="d-grid gap-4 col-md-3 align-items-start">
      <FilterPanel mode="overview" @filtrar="onFiltrar" @limpar="onLimpar" />
      <div class="text-center d-none d-md-block mt-3">
        <img class="img-fluid" :src="logoPmn" alt="">
      </div>
    </div>
    <div class="col-md-9">
      <BarChart v-if="tableData.length > 0" :data="tableData" />
      <DataTable :data="tableData" :columns="tableColumns" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useMonitorStore } from '../stores/monitorStore.js'
import FilterPanel from '../components/FilterPanel.vue'
import DataTable from '../components/DataTable.vue'
import BarChart from '../components/BarChart.vue'
import logoPmn from '/logo-pmn.png'

export default {
  components: { FilterPanel, DataTable, BarChart },
  setup() {
    const store = useMonitorStore()
    const tableData = ref([])

    const tableColumns = [
      { key: 'dia_da_atualizacao', label: 'Data' },
      { key: 'secretaria', label: 'Secretaria' },
      { key: 'nome_agrupamento', label: 'Agrupamento' },
      { key: 'serviço', label: 'Serviço' },
      { key: 'aberto', label: 'Aberto' },
      { key: 'andamento', label: 'Andamento' },
      { key: 'encerrado', label: 'Encerrado' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'observacao', label: 'Observação', sortable: false },
    ]

    function flattenSheetData(raw) {
      return raw.map(row => ({
        dia_da_atualizacao: row.dia_da_atualizacao || row.dia || row.data || '',
        secretaria: row.secretaria || '',
        nome_agrupamento: row.nome_agrupamento || row.agrupamento || '',
        serviço: row.serviço || row.servico || '',
        aberto: row.aberto || '0',
        andamento: row.andamento || row.em_andamento || '0',
        encerrado: row.encerrado || '0',
        responsavel: row.responsavel || row.responsável || '',
        observacao: row.observacao || row.observação || '',
      }))
    }

    async function onFiltrar() {
      await store.loadPlanilhaData()
      let filtered = store.allPlanilhaData

      if (store.selectedSecretaria) {
        filtered = filtered.filter(r =>
          (r.secretaria || '').toLowerCase() === store.selectedSecretaria.toLowerCase()
        )
      }
      if (store.selectedAgrupamento) {
        filtered = filtered.filter(r =>
          (r.nome_agrupamento || r.agrupamento || '').toLowerCase() === store.selectedAgrupamento.toLowerCase()
        )
      }
      if (store.selectedDataInicio && store.selectedDataFim) {
        filtered = filtered.filter(r => {
          const data = r.dia_da_atualizacao || r.dia || r.data || ''
          const [d, m, a] = data.split('/')
          const dataComp = `${a}${m}${d}`
          const [di, mi, ai] = store.selectedDataInicio.split('/')
          const inicioComp = `${ai}${mi}${di}`
          const [df, mf, af] = store.selectedDataFim.split('/')
          const fimComp = `${af}${mf}${df}`
          return dataComp >= inicioComp && dataComp <= fimComp
        })
      }
      if (store.selectedServico) {
        filtered = filtered.filter(r => {
          const servico = (r.serviço || r.servico || '').toLowerCase()
          return servico === store.selectedServico.toLowerCase()
        })
      }

      tableData.value = flattenSheetData(filtered)
    }

    onMounted(() => {
      store.loadPlanilhaData().then(() => {
        tableData.value = flattenSheetData(store.allPlanilhaData)
      })
    })

    async function onLimpar() {
      store.resetFilters('overview')
      await store.loadPlanilhaData()
      tableData.value = flattenSheetData(store.allPlanilhaData)
    }

    return { tableData, tableColumns, onFiltrar, onLimpar, logoPmn }
  }
}
</script>