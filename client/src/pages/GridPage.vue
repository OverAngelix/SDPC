<template>
  <v-container>
    <div v-if="store.loading && !store.loaded" class="text-center pa-12">
      <v-progress-circular indeterminate />
      <p class="text-medium-emphasis mt-4">Chargement des boutons…</p>
    </div>

    <v-alert
      v-else-if="store.error && !store.loaded"
      icon="mdi-alert-circle"
      type="error"
      variant="tonal"
    >
      Impossible de charger les boutons : le serveur est injoignable.
      <template #append>
        <v-btn text="Réessayer" variant="outlined" @click="store.load()" />
      </template>
    </v-alert>

    <v-alert
      v-else-if="store.loaded && path === null"
      icon="mdi-folder-question"
      type="warning"
      variant="tonal"
    >
      Ce dossier est introuvable : il a peut-être été supprimé.
      <template #append>
        <v-btn text="Retour à l'accueil" :to="{ name: 'grid' }" variant="outlined" />
      </template>
    </v-alert>

    <template v-else-if="store.loaded">
      <folder-breadcrumb v-if="path && path.length > 0" :path="path" />

      <v-alert
        v-if="store.error"
        class="mb-4"
        density="compact"
        type="warning"
        variant="tonal"
      >
        Impossible d'actualiser les boutons : le serveur est injoignable.
        <template #append>
          <v-btn size="small" text="Réessayer" variant="outlined" @click="store.load()" />
        </template>
      </v-alert>

      <p v-if="isEmpty" class="text-medium-emphasis text-center mb-4">
        Aucun bouton ici. Ajoutez-en depuis l'onglet Configuration.
      </p>

      <button-grid :slots="slots" @select="select" />
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ButtonGrid from '@/components/ButtonGrid.vue'
  import FolderBreadcrumb from '@/components/FolderBreadcrumb.vue'
  import { useButtonsStore } from '@/stores/buttons'
  import { isHttpUrl } from '@/utils/url'

  const route = useRoute()
  const router = useRouter()
  const store = useButtonsStore()

  // null : la racine
  const folderId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)

  // Les dossiers ouverts jusqu'à celui-ci ([] à la racine), null si le dossier n'existe pas
  const path = computed(() => folderId.value === null ? [] : store.pathTo(folderId.value))

  const slots = computed(() => store.slotsOf(folderId.value))
  const isEmpty = computed(() => slots.value.every(slot => slot === null))

  function select (button: Button) {
    if (button.type === 'folder') {
      router.push({ name: 'folder', params: { id: button.id } })
    } else if (button.url && isHttpUrl(button.url)) {
      window.location.assign(button.url)
    }
  }

  // Recharge à chaque ouverture de l'onglet : la configuration a pu changer entre-temps
  onMounted(() => store.load())
</script>
