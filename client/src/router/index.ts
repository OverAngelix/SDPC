import { createRouter, createWebHistory } from 'vue-router'
import ConfigPage from '@/pages/ConfigPage.vue'
import GridPage from '@/pages/GridPage.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'grid', component: GridPage },
    { path: '/config', name: 'config', component: ConfigPage },
  ],
})
