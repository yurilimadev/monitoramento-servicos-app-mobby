<template>
  <div class="d-grid gap-3">
    <div>
      <label class="form-label fw-bold">Secretaria</label>
      <select class="form-select shadow" v-model="store.selectedSecretaria" @change="onSecretariaChange">
        <option disabled value="">Selecione...</option>
        <option v-for="s in store.secretarias" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
    <div>
      <label class="form-label fw-bold">Agrupamento</label>
      <select class="form-select shadow" v-model="store.selectedAgrupamento" :disabled="!store.selectedSecretaria">
        <option disabled value="">Selecione uma secretaria</option>
        <option v-for="a in store.agrupamentos" :key="a" :value="a">{{ a }}</option>
      </select>
    </div>
    <div v-if="mode === 'overview'">
      <label class="form-label fw-bold">Serviço</label>
      <input class="form-control shadow" list="servicos-list" v-model="store.selectedServico" placeholder="Digite ou selecione um serviço">
      <datalist id="servicos-list">
        <option v-for="s in store.servicos" :key="s" :value="s"></option>
      </datalist>
    </div>
    <div v-if="mode === 'overview'">
      <label class="form-label fw-bold">Período</label>
      <input class="form-control shadow" type="text" ref="dateInput" placeholder="Selecione o período">
    </div>
    <div class="d-flex gap-2 justify-content-md-end align-items-start">
      <button class="btn btn-outline-secondary w-100 w-md-auto" @click="$emit('limpar')">Limpar</button>
      <button class="btn btn-primary w-100 w-md-auto" @click="$emit('filtrar')">Filtrar</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useMonitorStore } from '../stores/monitorStore.js'

export default {
  props: {
    mode: { type: String, default: 'update' },
  },
  emits: ['filtrar', 'limpar'],
  setup(props, { emit }) {
    const store = useMonitorStore()
    const dateInput = ref(null)
    let fpInstance = null

    function onSecretariaChange() {
      store.selectedAgrupamento = ''
    }

    onMounted(() => {
      if (props.mode === 'overview' && dateInput.value) {
        fpInstance = flatpickr(dateInput.value, {
          locale: 'pt',
          dateFormat: 'd/m/Y',
          mode: 'range',
          allowInput: true,
          onChange: (dates, dateStr) => {
            if (dates.length === 2) {
              const parts = dateStr.split(' até ')
              store.selectedDataInicio = parts[0]
              store.selectedDataFim = parts[1] || parts[0]
            } else {
              store.selectedDataInicio = ''
              store.selectedDataFim = ''
            }
          },
        })
      }
    })

    watch(() => [store.selectedDataInicio, store.selectedDataFim], ([inicio, fim]) => {
      if (fpInstance && !inicio && !fim) {
        fpInstance.clear()
      }
    })

    return { store, dateInput, onSecretariaChange }
  }
}
</script>