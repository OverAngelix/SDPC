import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readGuestActive, writeGuestActive } from '@/utils/guestStorage'

/** Le mode invité : l'application sans compte, la grille et les réglages gardés dans le navigateur (fiche 16). */
export const useGuestStore = defineStore('guest', () => {
  // Retenu sur l'appareil : un rechargement de la page reste en mode invité
  const active = ref(readGuestActive())

  function enter () {
    active.value = true
    writeGuestActive(true)
  }

  /** Quitte le mode invité ; sa grille et ses réglages restent pour la prochaine fois. */
  function leave () {
    active.value = false
    writeGuestActive(false)
  }

  return { active, enter, leave }
})
