<template>
  <v-dialog v-model="open" max-width="400">
    <v-card class="text-center px-4 py-6">
      <h2 class="text-h6 mb-4">{{ t('deleteGuestGrid.title') }}</h2>

      <p class="text-medium-emphasis">{{ t('common.irreversible') }}</p>

      <v-card-actions class="justify-center mt-4">
        <v-btn :text="t('common.cancel')" @click="open = false" />

        <v-btn
          color="error"
          :text="t('deleteGuestGrid.confirm')"
          variant="flat"
          @click="remove"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'
  import { useSettingsStore } from '@/stores/settings'
  import { clearGuestData } from '@/utils/guestStorage'

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const emit = defineEmits<{
    /** La grille d'invité est supprimée de ce navigateur */
    deleted: []
  }>()

  const { t } = useI18n()
  const settings = useSettingsStore()

  // Rien à demander au serveur : la grille d'invité n'existe que dans ce navigateur
  function remove () {
    clearGuestData()
    open.value = false
    settings.play('delete')
    emit('deleted')
  }
</script>
