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
      size="small"
      :title="t('bigPicture.exit')"
      variant="tonal"
      @click="bigPicture.exit()"
    />

    <grid-status :home="{ name: 'grid' }" :path="path">
      <p v-if="isEmpty" class="text-medium-emphasis text-center mb-4">
        {{ t('grid.empty') }}
      </p>

      <button-grid
        :key="folderId ?? 'root'"
        :back="folderId !== null"
        :fill="bigPicture.active"
        :slots="slots"
        @back="goBack"
        @select="select"
      />
    </grid-status>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { onBeforeUnmount, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ButtonGrid from '@/components/ButtonGrid.vue'
  import GridStatus from '@/components/GridStatus.vue'
  import { useFolderNavigation } from '@/composables/folderNavigation'
  import { useBigPictureStore } from '@/stores/bigPicture'
  import { useButtonsStore } from '@/stores/buttons'
  import { useSettingsStore } from '@/stores/settings'
  import { isHttpUrl } from '@/utils/url'

  const store = useButtonsStore()
  const { t } = useI18n()
  const settings = useSettingsStore()
  const bigPicture = useBigPictureStore()
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

  function onKeydown (event: KeyboardEvent) {
    if (event.key === 'Escape' && bigPicture.active) bigPicture.exit()
  }

  // Recharge à chaque ouverture de l'onglet : la configuration a pu changer entre-temps
  onMounted(() => {
    store.load()
    window.addEventListener('keydown', onKeydown)
  })

  // Le big picture ne vaut que pour la grille : la quitter (retour du navigateur, déconnexion) en sort
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    bigPicture.exit()
  })
</script>

<style scoped>
  /* Big picture : une bande en haut pour le bouton de repli, qui ne recouvre ainsi jamais la case de retour
     (la réserve de hauteur de la grille, voir ButtonGrid, en tient compte) */
  .big-picture-page {
    padding: 56px 12px 12px;
  }

  .big-picture-exit {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 10;
  }

  @media (max-width: 599px) {
    .big-picture-page {
      padding: 56px 6px 6px;
    }
  }
</style>
