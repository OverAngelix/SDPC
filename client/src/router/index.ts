import { createRouter, createWebHistory } from 'vue-router'
import ConfigPage from '@/pages/ConfigPage.vue'
import GridPage from '@/pages/GridPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import { useAuthStore } from '@/stores/auth'
import { guardRoute } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { public: true } },
    // La grille et ses dossiers
    {
      path: '/',
      children: [
        { path: '', name: 'grid', component: GridPage },
        { path: 'folder/:id', name: 'folder', component: GridPage },
      ],
    },
    // La configuration de la grille et de ses dossiers, ouverte depuis le menu du compte
    {
      path: '/config',
      children: [
        { path: '', name: 'config', component: ConfigPage },
        { path: 'folder/:id', name: 'config-folder', component: ConfigPage },
      ],
    },
  ],
})

// Tout le reste demande d'être connecté ; on attend d'abord de savoir si une session est déjà ouverte
router.beforeEach(async to => {
  const auth = useAuthStore()
  if (!auth.ready) {
    await auth.restore()
  }
  return guardRoute(to, auth.user !== null)
})

export default router
