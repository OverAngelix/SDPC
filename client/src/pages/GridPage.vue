<template>
  <v-container class="page-centered pa-2 pa-sm-4">
    <grid-status :home="{ name: 'grid' }" :path="path">
      <p v-if="isEmpty" class="text-medium-emphasis text-center mb-4">
        Aucun bouton ici. Ajoutez-en depuis « Mon compte », Configuration de la grille.
      </p>

      <button-grid
        :key="folderId ?? 'root'"
        :back="folderId !== null"
        :slots="slots"
        @back="goBack"
        @select="select"
      />
    </grid-status>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { onMounted } from 'vue'
  import ButtonGrid from '@/components/ButtonGrid.vue'
  import GridStatus from '@/components/GridStatus.vue'
  import { useFolderNavigation } from '@/composables/folderNavigation'
  import { useButtonsStore } from '@/stores/buttons'
  import { useSettingsStore } from '@/stores/settings'
  import { isHttpUrl } from '@/utils/url'

  const store = useButtonsStore()
  const settings = useSettingsStore()
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

  // Recharge à chaque ouverture de l'onglet : la configuration a pu changer entre-temps
  onMounted(() => store.load())
</script>
