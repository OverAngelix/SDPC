<template>
  <v-dialog v-model="open" max-width="440" :persistent="loading">
    <v-card :title="button?.type === 'folder' ? 'Supprimer ce dossier ?' : 'Supprimer ce bouton ?'">
      <v-card-text>
        <v-alert
          v-if="count > 0"
          class="mb-4"
          density="compact"
          icon="mdi-alert"
          type="warning"
          variant="tonal"
        >
          Ce dossier contient {{ countText }}, sous-dossiers compris. Ils seront tous supprimés avec lui.
        </v-alert>

        <p v-if="button?.type === 'folder'">
          Le dossier « {{ button.label }} » sera supprimé<template v-if="count === 0"> : il est vide</template>.
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
          :text="confirmText"
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
  import { computed } from 'vue'

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const props = defineProps<{
    /** Le bouton à supprimer */
    button: Button | null
    /** Nombre de boutons que contient le dossier à supprimer, sous-dossiers compris (0 sinon) */
    contentCount?: number
    /** Suppression en cours */
    loading?: boolean
    /** Erreur de la dernière tentative */
    error?: ApiErrorMessage | null
  }>()

  const emit = defineEmits<{
    confirm: []
  }>()

  const count = computed(() => props.contentCount ?? 0)
  const countText = computed(() => `${count.value} bouton${count.value > 1 ? 's' : ''}`)
  // Le libellé du bouton rappelle ce qui disparaît : on ne confirme pas à l'aveugle
  const confirmText = computed(() => count.value > 0 ? `Supprimer le dossier et ses ${countText.value}` : 'Supprimer')
</script>
