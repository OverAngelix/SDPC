<template>
  <v-container class="page-centered pa-2 pa-sm-4">
    <v-card class="mx-auto w-100" max-width="420">
      <v-form @submit.prevent="submit">
        <v-card-title class="pt-4">{{ isRegister ? 'Créer un compte' : 'Connexion' }}</v-card-title>

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
            autofocus
            label="Adresse e-mail"
            :rules="[required]"
            type="email"
          />

          <v-text-field
            v-model="password"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            :hint="isRegister ? '8 caractères au moins' : undefined"
            label="Mot de passe"
            :persistent-hint="isRegister"
            :rules="isRegister ? [required, minLength] : [required]"
            type="password"
          />

          <v-checkbox
            v-model="remember"
            density="compact"
            hide-details
            label="Se souvenir de moi"
          />
        </v-card-text>

        <v-card-actions class="flex-column ga-2 pb-4 px-4">
          <v-btn
            block
            color="primary"
            :loading="loading"
            :text="isRegister ? 'Créer mon compte' : 'Se connecter'"
            type="submit"
            variant="flat"
          />

          <v-btn
            block
            :text="isRegister ? 'J\'ai déjà un compte' : 'Créer un compte'"
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
  import { useRoute, useRouter } from 'vue-router'
  import { safeRedirect } from '@/router/guard'
  import { useAuthStore } from '@/stores/auth'
  import { describeApiError } from '@/utils/apiError'

  const props = defineProps<{ mode: 'login' | 'register' }>()

  const MIN_PASSWORD_LENGTH = 8

  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  const isRegister = computed(() => props.mode === 'register')
  const email = ref('')
  const password = ref('')
  const remember = ref(false)
  const loading = ref(false)
  const error = ref<ApiErrorMessage | null>(null)

  const required = (value: string) => value.trim() !== '' || 'Champ requis'
  const minLength = (value: string) => value.length >= MIN_PASSWORD_LENGTH || `${MIN_PASSWORD_LENGTH} caractères au moins`

  async function submit (event: SubmitEventPromise) {
    // Vuetify valide les champs avant de rendre la main
    if (!(await event).valid) return

    loading.value = true
    error.value = null
    try {
      const credentials = { email: email.value, password: password.value, remember: remember.value }
      await (isRegister.value ? auth.signUp(credentials) : auth.signIn(credentials))
      await router.replace(safeRedirect(route.query.redirect))
    } catch (error_) {
      error.value = describeApiError(error_)
    } finally {
      loading.value = false
    }
  }
</script>
