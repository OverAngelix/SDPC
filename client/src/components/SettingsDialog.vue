<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="480"
    scrollable
  >
    <v-card>
      <v-toolbar density="comfortable">
        <v-toolbar-title>Configuration de l'application</v-toolbar-title>

        <v-btn
          aria-label="Fermer"
          icon="mdi-close"
          @click="open = false"
        />
      </v-toolbar>

      <v-card-text class="pt-4">
        <v-alert
          v-if="settings.error"
          class="mb-4"
          density="compact"
          type="error"
          variant="tonal"
        >
          Réglage non enregistré : {{ settings.error.title }}
        </v-alert>

        <h3 class="text-subtitle-1 mb-1">Son</h3>

        <v-switch
          color="primary"
          density="comfortable"
          hide-details
          label="Son activé"
          :model-value="settings.soundEnabled"
          @update:model-value="settings.change({ soundEnabled: $event === true })"
        />

        <v-slider
          v-model="volumeDraft"
          aria-label="Volume"
          class="mt-2"
          color="primary"
          :disabled="!settings.soundEnabled"
          hide-details
          :max="100"
          :min="0"
          prepend-icon="mdi-volume-low"
          :step="1"
          @end="saveVolume"
        >
          <template #append>
            <span class="volume-value text-body-2">{{ volumeDraft }} %</span>
          </template>
        </v-slider>

        <v-divider class="my-4" />

        <h3 class="text-subtitle-1 mb-1">Effets</h3>

        <v-switch
          color="primary"
          density="comfortable"
          hide-details
          label="Effets visuels (survol, animations)"
          :model-value="settings.effectsEnabled"
          @update:model-value="settings.change({ effectsEnabled: $event === true })"
        />

        <v-divider class="my-4" />

        <h3 class="text-subtitle-1 mb-2">Thème</h3>

        <v-btn-toggle
          block
          color="primary"
          density="comfortable"
          divided
          mandatory
          :model-value="settings.theme"
          variant="outlined"
          @update:model-value="changeTheme"
        >
          <v-btn
            prepend-icon="mdi-white-balance-sunny"
            text="Clair"
            value="light"
          />

          <v-btn
            prepend-icon="mdi-weather-night"
            text="Sombre"
            value="dark"
          />

          <v-btn
            prepend-icon="mdi-theme-light-dark"
            text="Appareil"
            value="system"
          />
        </v-btn-toggle>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text="Fermer" @click="open = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Theme } from '@/interfaces/settings'
  import { onBeforeUnmount, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useSettingsStore } from '@/stores/settings'

  const open = defineModel<boolean>({ default: false })

  const settings = useSettingsStore()
  // Plein écran sur téléphone, comme le formulaire d'un bouton
  const { xs } = useDisplay()

  // Le curseur se déplace librement ; le volume n'est enregistré qu'une fois le geste fini (un appel, pas un par pixel) :
  // au relâchement de la souris ou du doigt, ou après une courte pause (le clavier n'a pas de relâchement)
  const SAVE_DELAY_MS = 350
  const volumeDraft = ref(settings.volume)
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  watch(() => settings.volume, volume => {
    volumeDraft.value = volume
  })

  watch(volumeDraft, volume => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveVolume(volume), SAVE_DELAY_MS)
  })

  // Une erreur d'une ouverture précédente ne doit pas réapparaître
  watch(open, isOpen => {
    if (isOpen) settings.error = null
  })

  onBeforeUnmount(() => clearTimeout(saveTimer))

  function saveVolume (volume: number) {
    clearTimeout(saveTimer)
    if (volume === settings.volume) return
    settings.change({ volume })
    // Un son d'essai au nouveau volume (sans effet si le son est coupé)
    settings.play('move')
  }

  function changeTheme (theme: Theme | null) {
    if (theme !== null) settings.change({ theme })
  }
</script>

<style scoped>
  .volume-value {
    min-width: 3.5em;
    text-align: end;
  }
</style>
