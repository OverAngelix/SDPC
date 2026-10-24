<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title>SDPC</v-app-bar-title>

      <v-tabs>
        <v-tab
          aria-label="Grille"
          prepend-icon="mdi-view-grid"
          :text="xs ? undefined : 'Grille'"
          to="/"
        />

        <v-tab
          aria-label="Configuration"
          prepend-icon="mdi-cog"
          :text="xs ? undefined : 'Configuration'"
          to="/config"
        />
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
  import { useDisplay } from 'vuetify'
  import { useSettingsStore } from '@/stores/settings'

  const settings = useSettingsStore()
  // Téléphone : les onglets se réduisent à leur icône pour que la barre tienne sur une ligne
  const { xs } = useDisplay()
</script>

<style>
  /* Pages Grille et Configuration : la grille est centrée dans l'écran sous la barre d'application
     (si elle est plus haute que l'écran, la page défile normalement) */
  .page-centered {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100vh - var(--v-layout-top, 56px));
    min-height: calc(100dvh - var(--v-layout-top, 56px));
  }

  /* Téléphone couché : la page prend toute la largeur, la grille défile en hauteur au lieu de rétrécir
     (voir ButtonGrid) ; la largeur maximale du conteneur Vuetify la bornerait à 700 px */
  @media (orientation: landscape) and (max-height: 500px) {
    .v-container {
      max-width: 100%;
    }
  }
</style>
