<template>
  <div class="col-md-9 h-100 overflow-hidden">
    <form @submit.prevent="onSubmit">
      <FilterPanel @filtrar="onFiltrar" />
      <div class="p-4 border shadow overflow-hidden mt-4">
        <div class="text-center">
          <h5>{{ store.selectedSecretaria || '[SECRETARIA]' }}</h5>
          <p>{{ store.selectedAgrupamento || '[Agrupamento]' }}</p>
          <button type="button" class="btn btn-outline-info btn-sm mt-2" :class="{ 'd-none': !showPuxarDados }"
            @click="puxarDados" :disabled="loading">
            <i class="bi bi-cloud-download"></i> Puxar dados já salvos desta data
          </button>
        </div>
        <div class="d-grid gap-4 mt-4 overflow-hidden w-100">
          <p v-if="store.servicesToRender.length === 0" class="text-center text-muted">
            Selecione os filtros e clique em "Filtrar" para carregar os serviços.
          </p>
          <ServiceCard
            v-for="(svc, idx) in store.servicesToRender"
            :key="idx"
            :servicoNome="svc.serviço"
            v-model="serviceData[idx]"
          />
        </div>
        <hr>
        <div class="row mt-4">
          <div class="col-12 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Enviando...' : 'Atualizar' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useMonitorStore } from '../stores/monitorStore.js'
import FilterPanel from './FilterPanel.vue'
import ServiceCard from './ServiceCard.vue'
import { buscarDadosSalvos } from '../services/sheetApi.js'
import { upsertDados } from '../services/sheetWriter.js'

export default {
  components: { FilterPanel, ServiceCard },
  setup() {
    const store = useMonitorStore()
    const serviceData = ref({})
    const submitting = ref(false)
    const loading = ref(false)

    const showPuxarDados = computed(() => store.servicesToRender.length > 0)

    function onFiltrar() {
      store.filtrarServicos()
      serviceData.value = {}
    }

    async function puxarDados() {
      if (!store.selectedData) {
        alert('Por favor, selecione a "Data Atualização" primeiro.')
        return
      }
      loading.value = true
      try {
        const dados = await buscarDadosSalvos(
          store.selectedSecretaria,
          store.selectedAgrupamento,
          store.selectedData
        )
        dados.forEach(reg => {
          const idx = store.servicesToRender.findIndex(s =>
            s.serviço.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() ===
            (reg.servico || reg.serviço || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
          )
          if (idx >= 0) {
            serviceData.value[idx] = {
              aberto: parseInt(reg.aberto) || 0,
              andamento: parseInt(reg.em_andamento || reg.andamento) || 0,
              encerrado: parseInt(reg.encerrado) || 0,
              observacao: reg.observacao || '',
              codigoUnico: reg.codigo_unico || '',
            }
          }
        })
        alert(dados.length > 0
          ? `Foram carregados ${dados.length} registros para a data ${store.selectedData}!`
          : 'Nenhum dado prévio encontrado para esta seleção.')
      } catch (err) {
        console.error(err)
        alert('Erro ao buscar dados na planilha.')
      } finally {
        loading.value = false
      }
    }

    async function gerarHashSHA256(mensagem) {
      const msgBuffer = new TextEncoder().encode(mensagem)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    async function onSubmit() {
      if (!store.selectedResponsavel || !store.selectedData) {
        alert('Preencha o Responsável e a Data de Atualização.')
        return
      }
      if (store.servicesToRender.length === 0) {
        alert('Filtre e carregue os serviços antes de atualizar.')
        return
      }

      submitting.value = true
      const dataToSend = []

      for (let i = 0; i < store.servicesToRender.length; i++) {
        const svc = store.servicesToRender[i]
        const dados = serviceData.value[i] || {}
        let codigoUnico = dados.codigoUnico || ''
        if (!codigoUnico) {
          const temp = store.selectedData + store.selectedSecretaria + store.selectedAgrupamento + svc.serviço
          codigoUnico = await gerarHashSHA256(temp)
        }
        dataToSend.push({
          codigo_unico: codigoUnico,
          dia_da_atualizacao: store.selectedData,
          secretaria: store.selectedSecretaria,
          nome_agrupamento: store.selectedAgrupamento,
          serviço: svc.serviço,
          aberto: dados.aberto || 0,
          andamento: dados.andamento || 0,
          encerrado: dados.encerrado || 0,
          responsavel: store.selectedResponsavel,
          observacao: dados.observacao || '',
        })
      }

      try {
        const result = await upsertDados(dataToSend)
        console.log('Sucesso:', result)
        alert('Dados salvos com sucesso!')
        window.location.reload()
      } catch (err) {
        console.error('Erro:', err)
        alert('Erro ao salvar dados.')
      } finally {
        submitting.value = false
      }
    }

    return { store, serviceData, submitting, loading, showPuxarDados, onFiltrar, puxarDados, onSubmit }
  }
}
</script>