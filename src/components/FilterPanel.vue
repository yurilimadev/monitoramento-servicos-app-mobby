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
      <input class="form-control shadow" type="text" v-model="store.selectedServico" placeholder="Digite o nome do serviço">
    </div>
    <div v-if="mode === 'overview'">
      <label class="form-label fw-bold">Data</label>
      <input class="form-control shadow" type="text" ref="dateInput" placeholder="Selecione a data">
    </div>
    <div class="d-flex justify-content-md-end align-items-start">
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
  emits: ['filtrar'],
  setup(props) {
    const store = useMonitorStore()
    const dateInput = ref(null)

    function onSecretariaChange() {
      store.selectedAgrupamento = ''
    }

    onMounted(() => {
      if (props.mode === 'overview' && dateInput.value) {
        flatpickr(dateInput.value, {
          locale: 'pt',
          dateFormat: 'd/m/Y',
          allowInput: true,
          onChange: (dates, dateStr) => { store.selectedData = dateStr },
        })
      }
    })

    watch(() => store.selectedData, (val) => {
      if (dateInput.value && dateInput.value._flatpickr) {
        dateInput.value._flatpickr.setDate(val || '', true)
      }
    })

    return { store, dateInput, onSecretariaChange }
  }
}
</script>