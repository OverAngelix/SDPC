import { computed, onBeforeUnmount, ref } from 'vue'
import { gridShape } from '@/grid'

/** La forme courante de la grille : suit l'orientation de l'écran, y compris quand il pivote */
export function useGridShape () {
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: portrait)') : null
  const portrait = ref(query?.matches ?? false)

  function update (event: MediaQueryListEvent) {
    portrait.value = event.matches
  }

  query?.addEventListener('change', update)
  onBeforeUnmount(() => query?.removeEventListener('change', update))

  return computed(() => gridShape(portrait.value))
}
