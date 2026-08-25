import { createRouter, createWebHashHistory } from 'vue-router'
import UpdatePage from '../views/UpdatePage.vue'
import OverviewPage from '../views/OverviewPage.vue'

const routes = [
  { path: '/', name: 'update', component: UpdatePage },
  { path: '/visao-geral', name: 'overview', component: OverviewPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router