<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="480"
    scrollable
  >
    <v-card>
      <v-toolbar density="comfortable">
        <v-toolbar-title>{{ t('settings.title') }}</v-toolbar-title>

        <v-btn
          :aria-label="t('common.close')"
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
          {{ t('settings.saveFailed', { reason: settings.error.title }) }}
        </v-alert>

        <h3 class="text-subtitle-1 mb-1">{{ t('settings.sound') }}</h3>

        <v-switch
          color="primary"
          density="comfortable"
          hide-details
          :label="t('settings.soundEnabled')"
          :model-value="settings.soundEnabled"
          @update:model-value="settings.change({ soundEnabled: $event === true })"
        />

        <v-slider
          v-model="volumeDraft"
          :aria-label="t('settings.volume')"
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

        <h3 class="text-subtitle-1 mb-1">{{ t('settings.effects') }}</h3>

        <v-switch
          color="primary"
          density="comfortable"
          hide-details
          :label="t('settings.effectsEnabled')"
          :model-value="settings.effectsEnabled"
          @update:model-value="settings.change({ effectsEnabled: $event === true })"
        />

        <v-divider class="my-4" />

        <h3 class="text-subtitle-1 mb-2">{{ t('settings.theme') }}</h3>

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
            :text="t('settings.themeLight')"
            value="light"
          />

          <v-btn
            prepend-icon="mdi-weather-night"
            :text="t('settings.themeDark')"
            value="dark"
          />

          <v-btn
            prepend-icon="mdi-theme-light-dark"
            :text="t('settings.device')"
            value="system"
          />
        </v-btn-toggle>

        <v-divider class="my-4" />

        <h3 class="text-subtitle-1 mb-2">{{ t('settings.language') }}</h3>

        <!-- Les noms des langues s'écrivent dans leur langue, pour qu'on retrouve la sienne dans une interface qu'on ne lit pas -->
        <v-btn-toggle
          block
          color="primary"
          density="comfortable"
          divided
          mandatory
          :model-value="settings.locale"
          variant="outlined"
          @update:model-value="changeLocale"
        >
          <v-btn
            v-for="locale in LOCALES"
            :key="locale"
            :text="t(`languages.${locale}`)"
            :value="locale"
          />

          <v-btn :text="t('settings.device')" value="system" />
        </v-btn-toggle>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn :text="t('common.close')" @click="open = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { LocaleSetting } from '@/interfaces/locale'
  import type { Theme } from '@/interfaces/settings'
  import { onBeforeUnmount, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import { LOCALES } from '@/locales/constants'
  import { useSettingsStore } from '@/stores/settings'

  const open = defineModel<boolean>({ default: false })

  const settings = useSettingsStore()
  const { t } = useI18n()
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

  function changeLocale (locale: LocaleSetting | null) {
    if (locale !== null) settings.change({ locale })
  }
</script>

<style scoped>
  .volume-value {
    min-width: 3.5em;
    text-align: end;
  }
</style>
