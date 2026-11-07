<template>
  <v-container class="page-centered pa-2 pa-sm-4">
    <v-card class="mx-auto w-100" max-width="420">
      <v-form @submit.prevent="submit">
        <v-card-title class="pt-4">{{ isRegister ? t('auth.registerTitle') : t('auth.loginTitle') }}</v-card-title>

        <v-card-text>
          <v-alert
            v-if="error"
            class="mb-4"
            density="compact"
            type="error"
            variant="tonal"
          >
            {{ error.title }}
            <ul v-if="error.details.length > 0" class="ps-4">
              <li v-for="detail in error.details" :key="detail">{{ detail }}</li>
            </ul>
          </v-alert>

          <v-text-field
            v-model="email"
            autocomplete="username"
            :autofocus="savedLogin === null"
            :label="t('auth.email')"
            :rules="[required]"
            type="email"
          />

          <v-text-field
            v-model="password"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            :autofocus="savedLogin !== null"
            :hint="isRegister ? t('validation.minLength', { min: MIN_PASSWORD_LENGTH }) : undefined"
            :label="t('auth.password')"
            :persistent-hint="isRegister"
            :rules="isRegister ? [required, minLength] : [required]"
            :type="showPassword ? 'text' : 'password'"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-checkbox
            v-model="remember"
            density="compact"
            hide-details
            :label="t('auth.remember')"
            :title="t('auth.rememberHint')"
          />
        </v-card-text>

        <v-card-actions class="flex-column ga-2 pb-4 px-4">
          <v-btn
            block
            color="primary"
            :loading="loading"
            :text="isRegister ? t('auth.submitRegister') : t('auth.submitLogin')"
            type="submit"
            variant="flat"
          />

          <v-btn
            block
            :text="isRegister ? t('auth.haveAccount') : t('auth.createAccount')"
            :to="{ name: isRegister ? 'login' : 'register', query: route.query }"
            variant="text"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import type { SubmitEventPromise } from 'vuetify'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { safeRedirect } from '@/router/guard'
  import { useAuthStore } from '@/stores/auth'
  import { describeApiError } from '@/utils/apiError'
  import { readRememberedLogin, writeRememberedLogin } from '@/utils/rememberedLogin'

  const props = defineProps<{ mode: 'login' | 'register' }>()

  const MIN_PASSWORD_LENGTH = 8

  const auth = useAuthStore()
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const isRegister = computed(() => props.mode === 'register')
  // « Se souvenir de moi » garde l'adresse e-mail sur cet appareil (la session, elle, dure 90 jours dans tous les cas)
  const savedLogin = readRememberedLogin()
  const email = ref(savedLogin ?? '')
  const password = ref('')
  const showPassword = ref(false)
  const remember = ref(savedLogin !== null)
  const loading = ref(false)
  const error = ref<ApiErrorMessage | null>(null)

  const required = (value: string) => value.trim() !== '' || t('validation.required')
  const minLength = (value: string) => value.length >= MIN_PASSWORD_LENGTH || t('validation.minLength', { min: MIN_PASSWORD_LENGTH })

  async function submit (event: SubmitEventPromise) {
    // Vuetify valide les champs avant de rendre la main
    if (!(await event).valid) return

    loading.value = true
    error.value = null
    try {
      const credentials = { email: email.value, password: password.value }
      await (isRegister.value ? auth.signUp(credentials) : auth.signIn(credentials))
      writeRememberedLogin(remember.value ? email.value.trim() : null)
      await router.replace(safeRedirect(route.query.redirect))
    } catch (error_) {
      error.value = describeApiError(error_)
    } finally {
      loading.value = false
    }
  }
</script>
