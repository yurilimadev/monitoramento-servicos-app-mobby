<template>
  <div class="row g-4">
    <div class="d-grid gap-4 col-md-3 h-740">
      <div class="d-grid order-2 order-md-1">
        <FilterPanel @filtrar="onFiltrar" />
      </div>
      <div class="text-center order-1 order-md-2">
        <img class="img-fluid" :src="logoPmn" alt="">
      </div>
    </div>
    <UpdateForm ref="updateForm" />
  </div>
</template>

<script>
import FilterPanel from '../components/FilterPanel.vue'
import UpdateForm from '../components/UpdateForm.vue'
import logoPmn from '/logo-pmn.png'

export default {
  components: { FilterPanel, UpdateForm },
  setup() {
    function onFiltrar() {
    }
    return { onFiltrar, logoPmn }
  }
}
</script>