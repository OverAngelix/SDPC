<template>
  <!-- Une barre de recherche en haut de l'écran, au-dessus de la grille floutée, dans l'esprit de Spotlight -->
  <v-dialog
    v-model="quickSearch.open"
    class="quick-search"
    max-width="640"
    :transition="animated ? 'slide-y-transition' : false"
  >
    <v-card class="quick-search-card" rounded="xl">
      <v-text-field
        v-model="query"
        :aria-label="t('search.label')"
        autofocus
        bg-color="transparent"
        class="quick-search-field flex-grow-0"
        flat
        hide-details
        :placeholder="t('search.placeholder')"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        @keydown="onKeydown"
      >
        <template #append-inner>
          <kbd class="quick-search-key">{{ t('search.escape') }}</kbd>
        </template>
      </v-text-field>

      <template v-if="query.trim() !== ''">
        <v-divider />

        <v-list
          v-if="results.length > 0"
          ref="list"
          bg-color="transparent"
          class="quick-search-results pa-2"
          color="primary"
        >
          <v-list-item
            v-for="(result, index) in results"
            :key="result.button.id"
            :active="index === selected"
            rounded="lg"
            @click="choose(result)"
            @mousemove="selected = index"
          >
            <template #prepend>
              <v-avatar class="mr-3" :color="solidColor(colorOf(result.button))" rounded="lg" size="36">
                <button-icon :icon="result.button.icon" size="22px" :url="result.button.url" />
              </v-avatar>
            </template>

            <v-list-item-title>{{ result.button.label }}</v-list-item-title>

            <v-list-item-subtitle v-if="details(result)">{{ details(result) }}</v-list-item-subtitle>

            <template v-if="result.button.type === 'folder'" #append>
              <v-icon icon="mdi-folder" size="small" />
            </template>
          </v-list-item>
        </v-list>

        <p v-else class="text-medium-emphasis text-center py-6">{{ t('search.empty') }}</p>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import type { SearchResult } from '@/interfaces/search'
  import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ButtonIcon from '@/components/ButtonIcon.vue'
  import { useButtonsStore } from '@/stores/buttons'
  import { useQuickSearchStore } from '@/stores/quickSearch'
  import { useSettingsStore } from '@/stores/settings'
  import { colorOf, solidColor } from '@/utils/colors'
  import { searchButtons } from '@/utils/search'

  const emit = defineEmits<{ choose: [button: Button] }>()

  const { t } = useI18n()
  const quickSearch = useQuickSearchStore()
  const store = useButtonsStore()
  const settings = useSettingsStore()
  const list = useTemplateRef('list')

  const query = ref('')
  // Le résultat surligné, que Entrée ouvre
  const selected = ref(0)
  const results = computed(() => searchButtons(store.buttons, query.value))

  // Apparition animée, sauf si les effets sont coupés ou si le système demande moins de mouvement (lu à chaque ouverture)
  const reducedMotion = ref(false)
  const animated = computed(() => settings.effectsEnabled && !reducedMotion.value)

  // Chaque ouverture repart d'une saisie vide
  watch(() => quickSearch.open, isOpen => {
    if (isOpen) {
      query.value = ''
      selected.value = 0
      reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    }
  })

  // Une nouvelle saisie surligne le meilleur résultat
  watch(query, () => {
    selected.value = 0
  })

  /** Sous le libellé : les dossiers qui le contiennent (« Google › Outils ») et le domaine de l'URL */
  function details (result: SearchResult): string {
    const folders = result.path.map(folder => folder.label).join(' › ')
    return [folders, result.domain].filter(Boolean).join(' · ')
  }

  function choose (result: SearchResult) {
    quickSearch.hide()
    emit('choose', result.button)
  }

  // ↑ / ↓ déplacent la sélection, en boucle ; Entrée ouvre le résultat ; Échap est géré par la fenêtre
  function onKeydown (event: KeyboardEvent) {
    const count = results.value.length
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (count === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      selected.value = (selected.value + step + count) % count
      revealSelected()
    } else if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault()
      const result = results.value[selected.value]
      if (result) choose(result)
    }
  }

  // Sur un petit écran, la liste défile : le résultat surligné reste visible
  async function revealSelected () {
    await nextTick()
    const element = list.value?.$el as HTMLElement | undefined
    element?.querySelector('.v-list-item--active')?.scrollIntoView({ block: 'nearest' })
  }
</script>

<style>
  /* Fenêtre téléportée hors du composant : styles globaux, tous sous .quick-search */

  /* En haut de l'écran plutôt qu'au centre : la liste s'allonge vers le bas sans faire sauter le champ */
  .quick-search.v-dialog {
    align-items: flex-start;
  }

  .quick-search > .v-overlay__content {
    margin-top: max(24px, 15vh);
    max-height: calc(100% - max(24px, 15vh) - 24px);
  }

  /* Voile assombri et flouté derrière la fenêtre ; son opacité reste animée par Vuetify */
  .quick-search {
    --v-overlay-opacity: 1;
  }

  .quick-search > .v-overlay__scrim {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
  }

  /* Fond translucide et flouté, comme Spotlight */
  .quick-search .quick-search-card {
    background: rgba(var(--v-theme-surface), 0.82);
    backdrop-filter: blur(24px) saturate(1.6);
  }

  .quick-search .quick-search-field input {
    font-size: 1.25rem;
  }

  .quick-search .quick-search-results {
    min-height: 0;
    overflow-y: auto;
  }

  /* Rappel de la touche Échap, à droite du champ */
  .quick-search .quick-search-key {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.25);
    border-radius: 6px;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-family: inherit;
    font-size: 0.75rem;
    padding: 1px 6px;
  }
</style>
