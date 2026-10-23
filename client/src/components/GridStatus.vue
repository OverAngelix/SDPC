<template>
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
      <v-btn text="Retour à l'accueil" :to="home" variant="outlined" />
    </template>
  </v-alert>

  <template v-else-if="store.loaded">
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

    <slot />
  </template>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import type { RouteLocationRaw } from 'vue-router'
  import { useButtonsStore } from '@/stores/buttons'

  /**
   * Les états communs à la grille et à la configuration : chargement, erreur, dossier introuvable.
   * Le contenu (slot) n'apparaît qu'une fois les boutons chargés et le dossier trouvé.
   */
  defineProps<{
    /** Les dossiers ouverts jusqu'au dossier courant, null si ce dossier n'existe pas */
    path: Button[] | null
    /** Destination du bouton « Retour à l'accueil » d'un dossier introuvable */
    home: RouteLocationRaw
  }>()

  const store = useButtonsStore()
</script>
