<template>
  <header class="shadow-lg">
    <div class="container">
      <h1 class="text-center py-3 text-white d-flex align-items-center justify-content-center gap-2">
        <img :src="logoUrl" height="40" alt="MobView">
        MobView
      </h1>
      <div class="d-flex justify-content-center gap-3 pb-3">
        <router-link to="/" class="btn fw-bold" :class="isUpdatePage ? 'btn-light' : 'btn-outline-light'">
          Atualizar Dados
        </router-link>
        <router-link to="/visao-geral" class="btn" :class="!isUpdatePage ? 'btn-light' : 'btn-outline-light'">
          Visão Geral
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'
import logoUrl from '/logo-mobview.png'
const route = useRoute()
const isUpdatePage = route.path === '/'
</script>

<style scoped>
header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
</style>