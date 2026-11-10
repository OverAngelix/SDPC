import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Recherche rapide (⌘F / Ctrl+F) : la fenêtre est affichée par la page grille, ouverte par le raccourci
 * ou par le menu « Mon compte ». Pas retenue : un rechargement la referme.
 */
export const useQuickSearchStore = defineStore('quickSearch', () => {
  const open = ref(false)

  function show () {
    open.value = true
  }

  function hide () {
    open.value = false
  }

  return { open, show, hide }
})
