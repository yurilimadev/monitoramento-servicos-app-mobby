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
    <div v-if="showResponsavel">
      <label class="form-label fw-bold">Responsável</label>
      <select class="form-select shadow" v-model="store.selectedResponsavel" required>
        <option disabled value="">Selecione...</option>
        <option v-for="r in store.responsaveis" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>
    <div v-if="showData">
      <label class="form-label fw-bold">Data Atualização</label>
      <input class="form-control shadow" type="text" ref="dateInput" placeholder="Selecione a data" required>
    </div>
    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
      <button class="btn btn-primary" @click="$emit('filtrar')">Filtrar</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useMonitorStore } from '../stores/monitorStore.js'

export default {
  props: {
    showResponsavel: { type: Boolean, default: true },
    showData: { type: Boolean, default: true },
  },
  emits: ['filtrar'],
  setup(props, { emit }) {
    const store = useMonitorStore()
    const dateInput = ref(null)

    function onSecretariaChange() {
      store.selectedAgrupamento = ''
    }

    onMounted(() => {
      if (dateInput.value) {
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