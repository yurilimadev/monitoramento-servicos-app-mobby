<template>
  <div class="p-3 border rounded shadow-sm service-entry overflow-hidden">
    <div class="row g-2">
      <div class="col-12">
        <label class="form-label fw-bold small">Serviço</label>
        <p class="form-control-plaintext bg-light p-2 rounded text-truncate">{{ servicoNome }}</p>
      </div>
    </div>
    <div class="row g-2 mt-1">
      <div class="col-4">
        <label class="form-label fw-bold small">Aberto</label>
        <input type="number" class="form-control" v-model.number="aberto" placeholder="0" min="0" required>
      </div>
      <div class="col-4">
        <label class="form-label fw-bold small">Andamento</label>
        <input type="number" class="form-control" v-model.number="andamento" placeholder="0" min="0" required>
      </div>
      <div class="col-4">
        <label class="form-label fw-bold small">Encerrado</label>
        <input type="number" class="form-control" v-model.number="encerrado" placeholder="0" min="0" required>
      </div>
    </div>
    <div class="row mt-2">
      <div class="col-12">
        <label class="form-label small">Observação</label>
        <textarea class="form-control" v-model="observacao" rows="2"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  props: {
    servicoNome: String,
    modelValue: Object,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const aberto = ref(0)
    const andamento = ref(0)
    const encerrado = ref(0)
    const observacao = ref('')

    watch([aberto, andamento, encerrado, observacao], () => {
      emit('update:modelValue', {
        aberto: aberto.value,
        andamento: andamento.value,
        encerrado: encerrado.value,
        observacao: observacao.value,
      })
    }, { immediate: true })

    watch(() => props.modelValue, (val) => {
      if (val) {
        aberto.value = val.aberto ?? 0
        andamento.value = val.andamento ?? 0
        encerrado.value = val.encerrado ?? 0
        observacao.value = val.observacao ?? ''
      }
    }, { deep: true })

    return { aberto, andamento, encerrado, observacao }
  }
}
</script>