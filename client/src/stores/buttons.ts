import type { Button, ButtonInput, ButtonPatch } from '@/interfaces/button'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createButton, deleteButton, fetchButtons, updateButton } from '@/api/buttons'
import { buildSlots, collectSubtree } from '@/grid'

export const useButtonsStore = defineStore('buttons', () => {
  const buttons = ref<Button[]>([])
  const loading = ref(false)
  const error = ref(false)
  // Faux tant qu'aucun chargement n'a réussi : on ne peut pas dire « introuvable » avant
  const loaded = ref(false)

  const byId = computed(() => new Map(buttons.value.map(button => [button.id, button])))

  async function load () {
    loading.value = true
    error.value = false
    try {
      buttons.value = await fetchButtons()
      loaded.value = true
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  // Les 35 emplacements d'un dossier (null = la racine)
  function slotsOf (parentId: string | null) {
    return buildSlots(buttons.value, parentId)
  }

  /**
   * Les dossiers à traverser pour arriver au dossier demandé, de la racine jusqu'à lui.
   * Renvoie null si l'identifiant est inconnu ou n'est pas un dossier.
   */
  function pathTo (folderId: string): Button[] | null {
    const path: Button[] = []
    let current = byId.value.get(folderId)
    while (current) {
      if (current.type !== 'folder' || path.includes(current)) {
        return null
      }
      path.unshift(current)
      current = current.parentId === null ? undefined : byId.value.get(current.parentId)
    }
    return path.length > 0 && path[0]!.parentId === null ? path : null
  }

  // Les écritures laissent remonter l'erreur du serveur (400, 409…) : c'est le formulaire qui l'affiche.
  // La réponse du serveur met la liste à jour, sans recharger tous les boutons.
  async function create (input: ButtonInput) {
    const created = await createButton(input)
    buttons.value = [...buttons.value, created]
    return created
  }

  async function update (id: string, patch: ButtonPatch) {
    const updated = await updateButton(id, patch)
    buttons.value = buttons.value.map(button => button.id === id ? updated : button)
    return updated
  }

  async function remove (id: string) {
    await deleteButton(id)
    // Le serveur supprime aussi le contenu d'un dossier
    const removed = collectSubtree(buttons.value, id)
    buttons.value = buttons.value.filter(button => !removed.has(button.id))
  }

  return { buttons, loading, error, loaded, load, slotsOf, pathTo, create, update, remove }
})
