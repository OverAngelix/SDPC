<template>
  <div class="d-flex align-center mb-4">
    <v-btn
      class="mr-2"
      icon="mdi-arrow-left"
      title="Retour au dossier précédent"
      :to="backTo"
      variant="tonal"
    />

    <v-breadcrumbs class="pa-0" :items="items">
      <template #divider>
        <v-icon icon="mdi-chevron-right" />
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import type { RouteLocationRaw } from 'vue-router'
  import { computed } from 'vue'

  const props = defineProps<{
    /** Les dossiers ouverts, de la racine jusqu'au dossier courant */
    path: Button[]
  }>()

  function folderRoute (folder: Button): RouteLocationRaw {
    return { name: 'folder', params: { id: folder.id } }
  }

  const items = computed(() => [
    { title: 'Accueil', to: { name: 'grid' } as RouteLocationRaw, disabled: props.path.length === 0 },
    ...props.path.map((folder, index) => ({
      title: folder.label,
      to: folderRoute(folder),
      disabled: index === props.path.length - 1,
    })),
  ])

  // Le retour mène au dossier parent, ou à l'accueil depuis un dossier de la racine
  const backTo = computed<RouteLocationRaw>(() => {
    const parent = props.path.at(-2)
    return parent ? folderRoute(parent) : { name: 'grid' }
  })
</script>
