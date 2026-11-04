<template>
  <v-dialog v-model="open" max-width="400" :persistent="loading">
    <v-card class="px-4 py-6">
      <v-form @submit.prevent="remove">
        <h2 class="text-h6 text-center mb-4">{{ t('deleteAccount.title') }}</h2>

        <v-alert
          class="mb-4"
          density="compact"
          type="warning"
          variant="tonal"
        >
          {{ t('deleteAccount.warning', count) }}
        </v-alert>

        <v-text-field
          v-model="password"
          autocomplete="current-password"
          autofocus
          :label="t('deleteAccount.password')"
          type="password"
        />

        <v-alert
          v-if="error"
          class="mb-2"
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ error.title }}
        </v-alert>

        <v-card-actions class="justify-center mt-2">
          <v-btn :disabled="loading" :text="t('common.cancel')" @click="open = false" />

          <v-btn
            color="error"
            :disabled="password === ''"
            :loading="loading"
            :text="t('deleteAccount.confirm')"
            type="submit"
            variant="flat"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'
  import { useButtonsStore } from '@/stores/buttons'
  import { describeApiError } from '@/utils/apiError'

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const emit = defineEmits<{
    /** Le compte est supprimé et la session fermée */
    deleted: []
  }>()

  const auth = useAuthStore()
  const { t } = useI18n()
  const buttons = useButtonsStore()

  const password = ref('')
  const loading = ref(false)
  const error = ref<ApiErrorMessage | null>(null)
  const count = computed(() => buttons.buttons.length)

  // Le mot de passe et l'erreur d'une ouverture précédente ne doivent pas réapparaître
  watch(open, isOpen => {
    if (isOpen) {
      password.value = ''
      error.value = null
    }
  })

  async function remove () {
    if (password.value === '' || loading.value) return
    loading.value = true
    error.value = null
    try {
      await auth.removeAccount(password.value)
      open.value = false
      emit('deleted')
    } catch (error_) {
      error.value = describeApiError(error_)
    } finally {
      loading.value = false
      password.value = ''
    }
  }
</script>
