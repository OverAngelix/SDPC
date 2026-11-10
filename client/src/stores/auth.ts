import type { Credentials, User } from '@/interfaces/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deleteAccount } from '@/api/account'
import { fetchMe, login, logout, register } from '@/api/auth'
import { importButtons } from '@/api/buttons'
import { setUnauthorizedHandler } from '@/api/http'
import { updateSettings } from '@/api/settings'
import { useButtonsStore } from '@/stores/buttons'
import { useGuestStore } from '@/stores/guest'
import { useSettingsStore } from '@/stores/settings'
import { clearGuestData, readGuestButtons, readGuestSettings } from '@/utils/guestStorage'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // Faux tant que le serveur n'a pas dit si une session est ouverte : le routeur attend avant de choisir la page
  const ready = ref(false)
  // La grille de l'invité n'a pas pu partir sur le compte qu'il vient de créer : elle reste dans le navigateur
  const migrationFailed = ref(false)
  const guest = useGuestStore()

  // Les boutons et les réglages appartiennent à la personne : ils ne doivent pas survivre à sa déconnexion
  function forget () {
    user.value = null
    migrationFailed.value = false
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
      // Une session ouverte l'emporte sur un mode invité oublié
      guest.leave()
      await loadSettings()
    } catch {
      // Pas de session, ou serveur injoignable : la page de connexion s'affiche, ou la grille de l'invité
      user.value = null
      if (guest.active) {
        await loadSettings()
      }
    } finally {
      ready.value = true
    }
  }

  /** Mode invité : la grille et les réglages restent dans le navigateur. Un premier passage part de la grille d'exemple (api/guestButtons). */
  async function enterGuest () {
    guest.enter()
    useButtonsStore().reset()
    await loadSettings()
    ready.value = true
  }

  /** Quitte le mode invité, sans rien effacer : « Entrer en mode invité » retrouvera la grille. */
  function leaveGuest () {
    guest.leave()
    forget()
  }

  // Les erreurs du serveur (400, 401, 409, 429) remontent au formulaire, qui les affiche
  async function signIn (credentials: Credentials) {
    const signedIn = await login(credentials)
    // La grille du compte s'affiche ; celle de l'invité reste dans le navigateur (supprimable depuis « Mon compte »)
    guest.leave()
    useButtonsStore().reset()
    user.value = signedIn
    await loadSettings()
    ready.value = true
  }

  // Un invité qui crée son compte l'emporte avec sa grille et ses réglages
  async function signUp (credentials: Credentials) {
    const created = await register(credentials)
    if (guest.active) {
      guest.leave()
      await migrateGuest()
    }
    useButtonsStore().reset()
    user.value = created
    await loadSettings()
    ready.value = true
  }

  // La grille d'exemple posée par le serveur à la création du compte est remplacée par celle de l'invité
  async function migrateGuest () {
    try {
      await importButtons(readGuestButtons() ?? [])
      await updateSettings(readGuestSettings())
      clearGuestData()
      migrationFailed.value = false
    } catch {
      migrationFailed.value = true
    }
  }

  /** Nouvel essai d'envoi de la grille de l'invité sur le compte ; renvoie vrai s'il a réussi. */
  async function retryMigration (): Promise<boolean> {
    await migrateGuest()
    if (migrationFailed.value) {
      return false
    }
    await useButtonsStore().load()
    await loadSettings()
    return true
  }

  // Si le serveur ne répond pas, la session reste ouverte (le cookie serait encore valable au rechargement) : l'erreur remonte
  async function signOut () {
    await logout()
    forget()
  }

  // Un mot de passe refusé (403) remonte à la fenêtre et laisse la session ouverte ; sinon tout est remis à zéro comme à la déconnexion
  async function removeAccount (password: string) {
    await deleteAccount(password)
    // Le son avant la remise à zéro : il suit les réglages de la personne qui part
    useSettingsStore().play('delete')
    forget()
  }

  setUnauthorizedHandler(forget)

  return { user, ready, migrationFailed, restore, enterGuest, leaveGuest, signIn, signUp, retryMigration, signOut, removeAccount }
})
