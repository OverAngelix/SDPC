<template>
  <v-container
    class="page-centered"
    :class="bigPicture.active ? 'big-picture-page' : 'pa-2 pa-sm-4'"
    :fluid="bigPicture.active"
  >
    <v-btn
      v-if="bigPicture.active"
      :aria-label="t('bigPicture.exit')"
      class="big-picture-exit"
      icon="mdi-fullscreen-exit"
      :title="t('bigPicture.exit')"
      @click="bigPicture.exit()"
    />

    <grid-status :home="{ name: 'grid' }" :path="path">
      <p v-if="isEmpty && !bigPicture.active" class="text-medium-emphasis text-center mb-4">
        {{ t('grid.empty') }}
      </p>

      <button-grid
        :key="folderId ?? 'root'"
        ref="grid"
        :back="folderId !== null"
        :fill="bigPicture.active"
        :shortcuts="bigPicture.active"
        :slots="slots"
        @back="goBack"
        @select="select"
      />
    </grid-status>

    <!-- Recherche rapide (⌘F / Ctrl+F) : un résultat s'ouvre comme un clic sur sa case -->
    <quick-search @choose="select" />
  </v-container>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ButtonGrid from '@/components/ButtonGrid.vue'
  import GridStatus from '@/components/GridStatus.vue'
  import QuickSearch from '@/components/QuickSearch.vue'
  import { useFolderNavigation } from '@/composables/folderNavigation'
  import { useBigPictureStore } from '@/stores/bigPicture'
  import { useButtonsStore } from '@/stores/buttons'
  import { useQuickSearchStore } from '@/stores/quickSearch'
  import { useSettingsStore } from '@/stores/settings'
  import { isQuickSearchShortcut, isTypingTarget, shortcutSlot } from '@/utils/keyboard'
  import { isHttpUrl } from '@/utils/url'

  const store = useButtonsStore()
  const grid = useTemplateRef('grid')
  const { t } = useI18n()
  const settings = useSettingsStore()
  const bigPicture = useBigPictureStore()
  const search = useQuickSearchStore()
  const { folderId, path, slots, isEmpty, openFolder, goBack } = useFolderNavigation({ root: 'grid', folder: 'folder' })

  function select (button: Button) {
    if (button.type === 'folder') {
      openFolder(button.id)
    } else if (button.url && isHttpUrl(button.url)) {
      settings.play('launch')
      // Nouvel onglet : la grille reste ouverte. noopener coupe le lien entre les deux onglets
      window.open(button.url, '_blank', 'noopener,noreferrer')
    }
  }

  // ⌘F / Ctrl+F ouvre la recherche rapide, en mode normal comme en big picture. B bascule le mode,
  // Échap en sort ; en big picture, 1 à 7 déclenchent les 7 premières cases. Tous sont ignorés
  // pendant une saisie ou quand une fenêtre ou un menu est ouvert (Échap ferme alors la fenêtre seule)
  function onKeydown (event: KeyboardEvent) {
    if (isQuickSearchShortcut(event)) {
      // La recherche ouverte, le raccourci la referme ; une autre fenêtre ouverte, il revient au navigateur.
      // preventDefault : le navigateur ouvrirait sinon sa recherche dans la page
      if (search.open) {
        event.preventDefault()
        search.hide()
      } else if (!isTypingTarget(event)) {
        event.preventDefault()
        search.show()
      }
      return
    }
    if (event.key === 'Escape' && bigPicture.active && !isTypingTarget(event)) {
      bigPicture.exit()
      return
    }
    if (isTypingTarget(event)) return
    if (event.key.toLowerCase() === 'b' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
      bigPicture.toggle()
    } else if (bigPicture.active) {
      const slot = shortcutSlot(event)
      if (slot !== null) {
        event.preventDefault()
        grid.value?.press(slot)
      }
    }
  }

  // Recharge à chaque ouverture de l'onglet : la configuration a pu changer entre-temps
  onMounted(() => {
    store.load()
    window.addEventListener('keydown', onKeydown)
  })

  // Le big picture et la recherche ne valent que pour la grille : la quitter (retour du navigateur, déconnexion) en sort
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    bigPicture.exit()
    search.hide()
  })
</script>

<style scoped>
  /* Big picture : une bande en haut pour le bouton de repli, qui ne recouvre ainsi jamais une case
     (la réserve de hauteur de la grille, voir ButtonGrid, en tient compte) */
  .big-picture-page {
    padding: 56px 12px 12px;
  }

  .big-picture-exit {
    /* En haut à droite, là où s'ouvre le menu « Mon compte » qui active le mode */
    position: fixed;
    top: 4px;
    right: 12px;
    z-index: 10;
  }

  @media (max-width: 599px) {
    .big-picture-page {
      padding: 56px 6px 6px;
    }
  }
</style>
