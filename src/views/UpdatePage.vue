<template>
  <div class="row g-4">
    <div class="d-grid gap-4 col-md-3 align-items-start">
      <FilterPanel mode="update" @filtrar="onFiltrar" />
      <div class="text-center d-none d-md-block">
        <img class="img-fluid" :src="logoPmn" alt="">
      </div>
    </div>
    <UpdateForm />
  </div>
</template>

<script>
import { useMonitorStore } from '../stores/monitorStore.js'
import FilterPanel from '../components/FilterPanel.vue'
import UpdateForm from '../components/UpdateForm.vue'
import logoPmn from '/logo-pmn.png'

export default {
  components: { FilterPanel, UpdateForm },
  setup() {
    const store = useMonitorStore()

    function onFiltrar() {
      store.filtrarServicos()
    }

    return { onFiltrar, logoPmn }
  }
}
</script>