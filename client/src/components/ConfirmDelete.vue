<template>
  <v-dialog v-model="open" max-width="440" :persistent="loading">
    <v-card title="Supprimer ce bouton ?">
      <v-card-text>
        <p v-if="button?.type === 'folder'">
          Le dossier « {{ button.label }} » et tout son contenu seront supprimés.
        </p>

        <p v-else>
          Le bouton « {{ button?.label }} » sera supprimé.
        </p>

        <p class="mt-2">Cette action est définitive.</p>

        <v-alert
          v-if="error"
          class="mt-4"
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ error.title }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loading" text="Annuler" @click="open = false" />

        <v-btn
          color="error"
          :loading="loading"
          text="Supprimer"
          variant="flat"
          @click="emit('confirm')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import type { Button } from '@/interfaces/button'

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  defineProps<{
    /** Le bouton à supprimer */
    button: Button | null
    /** Suppression en cours */
    loading?: boolean
    /** Erreur de la dernière tentative */
    error?: ApiErrorMessage | null
  }>()

  const emit = defineEmits<{
    confirm: []
  }>()
</script>
