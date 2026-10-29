<template>
  <div id="app-root">
    <AppHeader />
    <main class="container-fluid">
      <div v-if="store.error" class="container-fluid mt-3">
        <div class="alert alert-danger d-flex flex-column flex-md-row align-items-md-center gap-2" role="alert">
          <span class="flex-grow-1">
            <strong>Falha ao carregar os dados da planilha.</strong>
            {{ store.error }}
          </span>
          <button type="button" class="btn btn-sm btn-outline-danger" @click="store.reloadAll()">
            Tentar novamente
          </button>
        </div>
      </div>
      <section class="container-fluid my-4">
        <router-view />
      </section>
    </main>
    <footer class="container-fluid text-center py-3">
      Desenvolvido por Yuri Dimitri - SEMPLA - 2026
    </footer>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import { onMounted } from 'vue'
import { useMonitorStore } from './stores/monitorStore.js'

const store = useMonitorStore()

onMounted(() => {
  store.loadReferenceData()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap');
body { font-family: 'Nunito', sans-serif; background: #f8f9fa; }
#app { min-height: 100vh; display: flex; flex-direction: column; }
#app-root { flex: 1; }
.accordion-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
}
.accordion-collapse.show {
  max-height: 2000px;
}
@media (min-width: 768px) {
  .w-md-auto { width: auto !important; }
}
</style>