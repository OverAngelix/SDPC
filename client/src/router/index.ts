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
    // Parent commun : l'onglet Grille reste actif dans un dossier
    {
      path: '/',
      children: [
        { path: '', name: 'grid', component: GridPage },
        { path: 'folder/:id', name: 'folder', component: GridPage },
      ],
    },
    // Même principe : l'onglet Configuration reste actif dans un dossier
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
