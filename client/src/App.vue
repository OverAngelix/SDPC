<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title v-if="!xs">SDPC</v-app-bar-title>

      <v-tabs v-if="auth.user">
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

      <span v-if="auth.user && !xs" class="text-body-2 text-medium-emphasis me-2">{{ auth.user.email }}</span>

      <v-btn
        :aria-label="settings.soundEnabled ? 'Couper le son' : 'Activer le son'"
        :aria-pressed="settings.soundEnabled"
        :icon="settings.soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off'"
        :title="settings.soundEnabled ? 'Couper le son' : 'Activer le son'"
        @click="settings.toggleSound()"
      />

      <v-btn
        v-if="auth.user"
        aria-label="Se déconnecter"
        icon="mdi-logout"
        title="Se déconnecter"
        @click="signOut"
      />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-snackbar v-model="signOutFailed" color="error" timeout="5000">
      Déconnexion impossible : le serveur est injoignable.
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { guardRoute } from '@/router/guard'
  import { useAuthStore } from '@/stores/auth'
  import { useSettingsStore } from '@/stores/settings'

  const auth = useAuthStore()
  const settings = useSettingsStore()
  const route = useRoute()
  const router = useRouter()
  const signOutFailed = ref(false)

  // Déconnexion (ici ou session perdue, voir api/http.ts) : retour à la page de connexion
  watch(() => auth.user, user => {
    if (user === null) {
      const destination = guardRoute(route, false)
      if (destination !== true) router.replace(destination)
    }
  })

  async function signOut () {
    try {
      await auth.signOut()
    } catch {
      signOutFailed.value = true
    }
  }
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
