import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useButtonsStore } from '@/stores/buttons'
import { useSettingsStore } from '@/stores/settings'

/**
 * Le dossier affiché selon l'URL (`:id`, la racine sinon) et la navigation entre dossiers.
 * Les noms de routes sont ceux de la page : la grille et la configuration ont chacune les leurs.
 */
export function useFolderNavigation (routes: { root: string, folder: string }) {
  const route = useRoute()
  const router = useRouter()
  const store = useButtonsStore()
  const settings = useSettingsStore()

  // null : la racine
  const folderId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)

  // Les dossiers ouverts jusqu'à celui-ci ([] à la racine), null si le dossier n'existe pas
  const path = computed(() => folderId.value === null ? [] : store.pathTo(folderId.value))

  const slots = computed(() => store.slotsOf(folderId.value))
  const isEmpty = computed(() => slots.value.every(slot => slot === null))

  function openFolder (id: string) {
    settings.play('open')
    router.push({ name: routes.folder, params: { id } })
  }

  // Le bouton retour (première case d'un dossier) mène au dossier parent, ou à la racine
  function goBack () {
    settings.play('back')
    const parent = path.value?.at(-2)
    router.push(parent ? { name: routes.folder, params: { id: parent.id } } : { name: routes.root })
  }

  return { folderId, path, slots, isEmpty, openFolder, goBack }
}
