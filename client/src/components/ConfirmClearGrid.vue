<template>
  <v-dialog v-model="open" max-width="400" :persistent="loading">
    <v-card class="text-center px-4 py-6">
      <h2 class="text-h6 mb-4">Effacer toute la grille ?</h2>

      <v-alert
        class="mb-4"
        density="compact"
        type="warning"
        variant="tonal"
      >
        {{ count }} bouton{{ count > 1 ? 's' : '' }} supprimé{{ count > 1 ? 's' : '' }}, dossiers et contenus compris.
      </v-alert>

      <p class="text-medium-emphasis">Cette action est définitive.</p>

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
        <v-btn :disabled="loading" text="Annuler" @click="open = false" />

        <v-btn
          color="error"
          :loading="loading"
          text="Effacer la grille"
          variant="flat"
          @click="clear"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useButtonsStore } from '@/stores/buttons'
  import { useSettingsStore } from '@/stores/settings'
  import { describeApiError } from '@/utils/apiError'

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const emit = defineEmits<{
    /** La grille est effacée ; le nombre de boutons supprimés */
    cleared: [count: number]
  }>()

  const store = useButtonsStore()
  const settings = useSettingsStore()
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const error = ref<ApiErrorMessage | null>(null)
  const count = computed(() => store.buttons.length)

  // Une erreur d'une ouverture précédente ne doit pas réapparaître
  watch(open, isOpen => {
    if (isOpen) error.value = null
  })

  async function clear () {
    const removed = count.value
    loading.value = true
    error.value = null
    try {
      await store.clear()
      open.value = false
      settings.play('delete')
      // On revient à la racine, sur la même page (un dossier ouvert n'existe plus)
      await router.replace(route.path === '/config' || route.path.startsWith('/config/') ? '/config' : '/')
      emit('cleared', removed)
    } catch (error_) {
      error.value = describeApiError(error_)
    } finally {
      loading.value = false
    }
  }
</script>
