<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="520"
    scrollable
  >
    <v-card>
      <v-toolbar density="comfortable">
        <v-toolbar-title>{{ t('account.title') }}</v-toolbar-title>

        <v-btn
          :aria-label="t('common.close')"
          icon="mdi-close"
          @click="open = false"
        />
      </v-toolbar>

      <v-card-text class="pt-4">
        <p class="text-medium-emphasis text-truncate mb-4">{{ email }}</p>

        <h3 class="text-subtitle-1 mb-2">{{ t('account.password') }}</h3>

        <v-form @submit.prevent="submitPassword">
          <v-alert
            v-if="passwordError"
            class="mb-4"
            density="compact"
            type="error"
            variant="tonal"
          >
            {{ passwordError.title }}
          </v-alert>

          <v-alert
            v-if="passwordChanged"
            class="mb-4"
            density="compact"
            type="success"
            variant="tonal"
          >
            {{ t('account.passwordChanged') }}
          </v-alert>

          <v-text-field
            v-model="currentPassword"
            :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="current-password"
            :label="t('account.currentPassword')"
            :type="showCurrent ? 'text' : 'password'"
            @click:append-inner="showCurrent = !showCurrent"
          />

          <v-text-field
            v-model="newPassword"
            :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="new-password"
            :error-messages="newPasswordError"
            :hint="t('validation.minLength', { min: PASSWORD_MIN_LENGTH })"
            :label="t('account.newPassword')"
            persistent-hint
            :type="showNew ? 'text' : 'password'"
            @click:append-inner="showNew = !showNew"
          />

          <v-text-field
            v-model="confirmation"
            :append-inner-icon="showConfirmation ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="new-password"
            class="mt-2"
            :error-messages="confirmationError"
            :label="t('account.confirmPassword')"
            :type="showConfirmation ? 'text' : 'password'"
            @click:append-inner="showConfirmation = !showConfirmation"
          />

          <v-btn
            block
            color="primary"
            :disabled="!canSubmit"
            :loading="changing"
            :text="t('account.changePassword')"
            type="submit"
            variant="flat"
          />
        </v-form>

        <v-divider class="my-6" />

        <h3 class="text-subtitle-1 mb-1">{{ t('account.grid') }}</h3>
        <p class="text-medium-emphasis mb-3">{{ t('account.gridText') }}</p>

        <v-btn
          block
          color="error"
          :disabled="gridEmpty"
          prepend-icon="mdi-delete-sweep"
          :text="t('account.clearGrid')"
          variant="outlined"
          @click="emit('clear')"
        />

        <v-divider class="my-6" />

        <h3 class="text-subtitle-1 text-error mb-1">{{ t('account.deleteTitle') }}</h3>
        <p class="text-medium-emphasis mb-3">{{ t('account.deleteText') }}</p>

        <v-btn
          block
          color="error"
          prepend-icon="mdi-account-remove"
          :text="t('account.deleteAccount')"
          variant="outlined"
          @click="emit('delete')"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn :text="t('common.close')" @click="open = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import { changePassword } from '@/api/account'
  import { useSettingsStore } from '@/stores/settings'
  import { describeApiError } from '@/utils/apiError'

  // Mêmes bornes que le serveur (server/src/auth/validation.ts)
  const PASSWORD_MIN_LENGTH = 8
  const PASSWORD_MAX_LENGTH = 128

  const open = defineModel<boolean>({ default: false })

  defineProps<{
    email: string
    /** La grille n'a aucun bouton : « Effacer la grille » est grisée */
    gridEmpty?: boolean
  }>()

  const emit = defineEmits<{
    /** Ouvrir la confirmation de l'effacement de la grille */
    clear: []
    /** Ouvrir la confirmation de la suppression du compte */
    delete: []
  }>()

  const settings = useSettingsStore()
  const { t } = useI18n()
  // Plein écran sur téléphone, comme les réglages
  const { xs } = useDisplay()

  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmation = ref('')
  // Un œil par champ : on montre un mot de passe sans dévoiler les autres
  const showCurrent = ref(false)
  const showNew = ref(false)
  const showConfirmation = ref(false)
  const changing = ref(false)
  const passwordError = ref<ApiErrorMessage | null>(null)
  const passwordChanged = ref(false)

  // Rien n'est signalé tant que le champ est vide : on n'accuse pas une saisie qui n'a pas commencé
  const newPasswordError = computed(() => {
    if (newPassword.value === '') return []
    if (newPassword.value.length < PASSWORD_MIN_LENGTH) return [t('validation.minLength', { min: PASSWORD_MIN_LENGTH })]
    if (newPassword.value.length > PASSWORD_MAX_LENGTH) return [t('validation.maxLength', { max: PASSWORD_MAX_LENGTH })]
    if (newPassword.value === currentPassword.value) return [t('account.sameAsCurrent')]
    return []
  })
  const confirmationError = computed(() => {
    return confirmation.value !== '' && confirmation.value !== newPassword.value ? [t('account.mismatch')] : []
  })
  const canSubmit = computed(() => {
    return currentPassword.value !== '' && newPassword.value !== '' && confirmation.value !== ''
      && newPasswordError.value.length === 0 && confirmationError.value.length === 0
  })

  // Une saisie ou un message d'une ouverture précédente ne doit pas réapparaître
  watch(open, isOpen => {
    if (isOpen) resetForm()
  })

  // Une modification du formulaire efface le message de succès ou d'erreur devenu périmé
  watch([currentPassword, newPassword, confirmation], () => {
    passwordError.value = null
    passwordChanged.value = false
  })

  function resetForm () {
    currentPassword.value = ''
    newPassword.value = ''
    confirmation.value = ''
    showCurrent.value = false
    showNew.value = false
    showConfirmation.value = false
    passwordError.value = null
    passwordChanged.value = false
  }

  async function submitPassword () {
    if (!canSubmit.value || changing.value) return
    changing.value = true
    passwordError.value = null
    try {
      await changePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
      resetForm()
      passwordChanged.value = true
      settings.play('create')
    } catch (error) {
      passwordError.value = describeApiError(error)
      settings.play('refuse')
    } finally {
      changing.value = false
    }
  }
</script>
