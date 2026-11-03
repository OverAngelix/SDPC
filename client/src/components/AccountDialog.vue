<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="520"
    scrollable
  >
    <v-card>
      <v-toolbar density="comfortable">
        <v-toolbar-title>Mon compte</v-toolbar-title>

        <v-btn
          aria-label="Fermer"
          icon="mdi-close"
          @click="open = false"
        />
      </v-toolbar>

      <v-card-text class="pt-4">
        <p class="text-medium-emphasis text-truncate mb-4">{{ email }}</p>

        <h3 class="text-subtitle-1 mb-2">Mot de passe</h3>

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
            Mot de passe modifié. Les autres appareils sont déconnectés.
          </v-alert>

          <v-text-field
            v-model="currentPassword"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="current-password"
            label="Mot de passe actuel"
            :type="showPasswords ? 'text' : 'password'"
            @click:append-inner="showPasswords = !showPasswords"
          />

          <v-text-field
            v-model="newPassword"
            autocomplete="new-password"
            :error-messages="newPasswordError"
            hint="8 caractères au moins"
            label="Nouveau mot de passe"
            persistent-hint
            :type="showPasswords ? 'text' : 'password'"
          />

          <v-text-field
            v-model="confirmation"
            autocomplete="new-password"
            class="mt-2"
            :error-messages="confirmationError"
            label="Confirmer le nouveau mot de passe"
            :type="showPasswords ? 'text' : 'password'"
          />

          <v-btn
            block
            color="primary"
            :disabled="!canSubmit"
            :loading="changing"
            text="Changer le mot de passe"
            type="submit"
            variant="flat"
          />
        </v-form>

        <v-divider class="my-6" />

        <h3 class="text-subtitle-1 mb-1">Grille</h3>
        <p class="text-medium-emphasis mb-3">Supprime tous les boutons et dossiers de votre grille. Votre compte est conservé.</p>

        <v-btn
          block
          color="error"
          :disabled="gridEmpty"
          prepend-icon="mdi-delete-sweep"
          text="Effacer la grille"
          variant="outlined"
          @click="emit('clear')"
        />

        <v-divider class="my-6" />

        <h3 class="text-subtitle-1 text-error mb-1">Supprimer le compte</h3>
        <p class="text-medium-emphasis mb-3">Supprime définitivement votre compte, votre grille et vos réglages.</p>

        <v-btn
          block
          color="error"
          prepend-icon="mdi-account-remove"
          text="Supprimer mon compte"
          variant="outlined"
          @click="emit('delete')"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text="Fermer" @click="open = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import { computed, ref, watch } from 'vue'
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
  // Plein écran sur téléphone, comme les réglages
  const { xs } = useDisplay()

  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmation = ref('')
  const showPasswords = ref(false)
  const changing = ref(false)
  const passwordError = ref<ApiErrorMessage | null>(null)
  const passwordChanged = ref(false)

  // Rien n'est signalé tant que le champ est vide : on n'accuse pas une saisie qui n'a pas commencé
  const newPasswordError = computed(() => {
    if (newPassword.value === '') return []
    if (newPassword.value.length < PASSWORD_MIN_LENGTH) return [`${PASSWORD_MIN_LENGTH} caractères au moins`]
    if (newPassword.value.length > PASSWORD_MAX_LENGTH) return [`${PASSWORD_MAX_LENGTH} caractères au plus`]
    if (newPassword.value === currentPassword.value) return ['Doit être différent du mot de passe actuel']
    return []
  })
  const confirmationError = computed(() => {
    return confirmation.value !== '' && confirmation.value !== newPassword.value ? ['Les deux mots de passe sont différents'] : []
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
    showPasswords.value = false
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
