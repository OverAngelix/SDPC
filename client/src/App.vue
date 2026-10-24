<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title>SDPC</v-app-bar-title>

      <v-tabs>
        <v-tab prepend-icon="mdi-view-grid" text="Grille" to="/" />
        <v-tab prepend-icon="mdi-cog" text="Configuration" to="/config" />
      </v-tabs>

      <v-spacer />

      <v-btn
        :aria-label="settings.soundEnabled ? 'Couper le son' : 'Activer le son'"
        :aria-pressed="settings.soundEnabled"
        :icon="settings.soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off'"
        :title="settings.soundEnabled ? 'Couper le son' : 'Activer le son'"
        @click="settings.toggleSound()"
      />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { useSettingsStore } from '@/stores/settings'

  const settings = useSettingsStore()
</script>
