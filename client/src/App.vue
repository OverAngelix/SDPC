<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title>
        <router-link class="app-title" to="/">SDPC</router-link>
      </v-app-bar-title>

      <v-spacer />

      <!-- Sans connexion (pages Connexion et Créer un compte) : le titre seul -->
      <account-menu
        v-if="auth.user"
        v-model:drawer="drawer"
        :email="auth.user.email"
        :on-config="onConfig"
        @select="onAccountAction"
      />
    </v-app-bar>

    <account-drawer
      v-if="auth.user"
      v-model="drawer"
      :email="auth.user.email"
      :on-config="onConfig"
      @select="onAccountAction"
    />

    <v-main>
      <router-view />
    </v-main>

    <settings-dialog v-if="auth.user" v-model="settingsOpen" />

    <v-snackbar v-model="signOutFailed" color="error" timeout="5000">
      Déconnexion impossible : le serveur est injoignable.
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import AccountDrawer from '@/components/AccountDrawer.vue'
  import AccountMenu from '@/components/AccountMenu.vue'
  import SettingsDialog from '@/components/SettingsDialog.vue'
  import { guardRoute } from '@/router/guard'
  import { useAuthStore } from '@/stores/auth'
  import { useSettingsStore } from '@/stores/settings'

  const auth = useAuthStore()
  const settings = useSettingsStore()
  const route = useRoute()
  const router = useRouter()
  const signOutFailed = ref(false)
  // Tiroir du compte (téléphone) : ouvert par le burger de la barre, affiché hors de la barre
  const drawer = ref(false)
  const settingsOpen = ref(false)
  const theme = useTheme()

  // Thème du compte (les effets sont lus par les cases elles-mêmes, voir ButtonTile)
  watch(() => settings.theme, name => theme.change(name), { immediate: true })

  // Déconnexion (ici ou session perdue, voir api/http.ts) : retour à la page de connexion
  watch(() => auth.user, user => {
    if (user === null) {
      const destination = guardRoute(route, false)
      if (destination !== true) router.replace(destination)
    }
  })

  // La page de configuration de la grille (dossiers compris) : l'entrée du menu y devient « Retour à la grille »
  const onConfig = computed(() => route.path === '/config' || route.path.startsWith('/config/'))

  function onAccountAction (action: AccountAction) {
    if (action === 'grid') router.push(onConfig.value ? '/' : '/config')
    else if (action === 'settings') settingsOpen.value = true
    else signOut()
  }

  async function signOut () {
    try {
      await auth.signOut()
    } catch {
      signOutFailed.value = true
    }
  }
</script>

<style>
  /* Titre de la barre : un lien vers la grille, qui garde l'allure d'un titre */
  .app-title {
    color: inherit;
    text-decoration: none;
  }

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
