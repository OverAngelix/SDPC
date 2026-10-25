import type { Credentials, User } from '@/interfaces/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMe, login, logout, register } from '@/api/auth'
import { setUnauthorizedHandler } from '@/api/http'
import { useButtonsStore } from '@/stores/buttons'
import { useSettingsStore } from '@/stores/settings'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // Faux tant que le serveur n'a pas dit si une session est ouverte : le routeur attend avant de choisir la page
  const ready = ref(false)

  // Les boutons et les réglages appartiennent à la personne : ils ne doivent pas survivre à sa déconnexion
  function forget () {
    user.value = null
    useButtonsStore().reset()
    useSettingsStore().reset()
  }

  // Un échec ne bloque pas la connexion : l'application démarre avec les réglages par défaut
  async function loadSettings () {
    try {
      await useSettingsStore().load()
    } catch {
      useSettingsStore().reset()
    }
  }

  async function restore () {
    try {
      user.value = await fetchMe()
      await loadSettings()
    } catch {
      // Pas de session, ou serveur injoignable : la page de connexion s'affiche
      user.value = null
    } finally {
      ready.value = true
    }
  }

  // Les erreurs du serveur (400, 401, 409, 429) remontent au formulaire, qui les affiche
  async function signIn (credentials: Credentials) {
    user.value = await login(credentials)
    await loadSettings()
    ready.value = true
  }

  async function signUp (credentials: Credentials) {
    user.value = await register(credentials)
    await loadSettings()
    ready.value = true
  }

  // Si le serveur ne répond pas, la session reste ouverte (le cookie serait encore valable au rechargement) : l'erreur remonte
  async function signOut () {
    await logout()
    forget()
  }

  setUnauthorizedHandler(forget)

  return { user, ready, restore, signIn, signUp, signOut }
})
