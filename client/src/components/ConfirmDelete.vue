<template>
  <v-dialog v-model="open" max-width="400" :persistent="loading">
    <v-card class="text-center px-4 py-6">
      <h2 class="text-h6 mb-4">{{ title }}</h2>

      <v-alert
        v-if="count > 0"
        class="mb-4"
        density="compact"
        type="warning"
        variant="tonal"
      >
        {{ countText }}
      </v-alert>

      <p class="text-medium-emphasis">{{ t('common.irreversible') }}</p>

      <v-alert
        v-if="error"
        class="mt-4 text-start"
        density="compact"
        type="error"
        variant="tonal"
      >
        {{ error.title }}
      </v-alert>

      <v-card-actions class="justify-center mt-4">
        <v-btn :disabled="loading" :text="t('common.cancel')" @click="open = false" />

        <v-btn
          color="error"
          :loading="loading"
          :text="isFolder ? t('deleteButton.confirmFolder') : t('deleteButton.confirmButton')"
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
  import { useI18n } from 'vue-i18n'

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

  const { t } = useI18n()

  const isFolder = computed(() => props.button?.type === 'folder')
  const count = computed(() => props.contentCount ?? 0)
  // Le nom de l'élément est dans le titre : la fenêtre n'a pas besoin d'une phrase de plus
  const title = computed(() => t(isFolder.value ? 'deleteButton.titleFolder' : 'deleteButton.titleButton', { label: props.button?.label }))
  const countText = computed(() => t('deleteButton.contentCount', count.value))
</script>
