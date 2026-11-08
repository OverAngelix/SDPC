<template>
  <v-app>
    <!-- Big picture : la grille seule, sans barre -->
    <v-app-bar v-if="!bigPictureOn" density="comfortable">
      <v-app-bar-title>
        <router-link class="app-title" to="/">SDPC</router-link>
      </v-app-bar-title>

      <v-spacer />

      <!-- Mode invité : un rappel, et de quoi garder sa grille en créant un compte -->
      <template v-if="guest.active">
        <v-chip
          class="me-2 d-none d-sm-flex"
          prepend-icon="mdi-incognito"
          size="small"
          :text="t('guest.badge')"
        />

        <!-- Téléphone : l'icône seule -->
        <v-btn
          v-if="route.name !== 'register'"
          :aria-label="t('guest.register')"
          class="me-1"
          color="primary"
          :icon="xs ? 'mdi-account-plus' : false"
          :prepend-icon="xs ? undefined : 'mdi-account-plus'"
          :text="xs ? undefined : t('guest.register')"
          :to="{ name: 'register' }"
          variant="tonal"
        />
      </template>

      <!-- Sans connexion (pages Connexion et Créer un compte) : le titre seul -->
      <account-menu
        v-if="signedIn"
        v-model:drawer="drawer"
        :email="auth.user?.email ?? ''"
        :guest="guest.active"
        :on-config="onConfig"
        @select="onAccountAction"
      />
    </v-app-bar>

    <account-drawer
      v-if="signedIn && !bigPictureOn"
      v-model="drawer"
      :email="auth.user?.email ?? ''"
      :guest="guest.active"
      :on-config="onConfig"
      @select="onAccountAction"
    />

    <v-main>
      <router-view />
    </v-main>

    <settings-dialog v-if="signedIn" v-model="settingsOpen" />

    <welcome-dialog v-if="signedIn" v-model="welcomeOpen" />

    <account-dialog
      v-if="auth.user"
      v-model="accountOpen"
      :email="auth.user.email"
      :grid-empty="gridEmpty"
      @clear="clearOpen = true"
      @delete="deleteOpen = true"
    />

    <confirm-clear-grid
      v-if="signedIn"
      v-model="clearOpen"
      @cleared="onCleared"
    />

    <!-- Sans v-if : la confirmation survit à la fermeture de la session qu'elle provoque -->
    <confirm-delete-account v-model="deleteOpen" @deleted="onAccountDeleted" />

    <v-snackbar v-model="signOutFailed" color="error" timeout="5000">
      {{ t('notices.signOutFailed') }}
    </v-snackbar>

    <v-snackbar v-model="notice" timeout="3000">{{ noticeText }}</v-snackbar>

    <!-- La grille de l'invité n'est pas partie sur le nouveau compte : elle attend dans le navigateur -->
    <v-snackbar
      v-model="auth.migrationFailed"
      color="error"
      timeout="-1"
    >
      {{ t('guest.migrationFailed') }}

      <template #actions>
        <v-btn :loading="retrying" :text="t('guest.retry')" @click="retryMigration" />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
  import AccountDialog from '@/components/AccountDialog.vue'
  import AccountDrawer from '@/components/AccountDrawer.vue'
  import AccountMenu from '@/components/AccountMenu.vue'
  import ConfirmClearGrid from '@/components/ConfirmClearGrid.vue'
  import ConfirmDeleteAccount from '@/components/ConfirmDeleteAccount.vue'
  import SettingsDialog from '@/components/SettingsDialog.vue'
  import WelcomeDialog from '@/components/WelcomeDialog.vue'
  import { guardRoute } from '@/router/guard'
  import { useAuthStore } from '@/stores/auth'
  import { useBigPictureStore } from '@/stores/bigPicture'
  import { useButtonsStore } from '@/stores/buttons'
  import { useGuestStore } from '@/stores/guest'
  import { useSettingsStore } from '@/stores/settings'
  import { readWelcomeSeen, writeWelcomeSeen } from '@/utils/rememberedWelcome'

  const auth = useAuthStore()
  const guest = useGuestStore()
  // Une personne connectée ou un invité : la grille, ses dossiers et le menu sont accessibles
  const signedIn = computed(() => auth.user !== null || guest.active)
  const { xs } = useDisplay()
  const retrying = ref(false)
  const { t } = useI18n()
  const settings = useSettingsStore()
  const route = useRoute()
  const router = useRouter()
  const signOutFailed = ref(false)
  // Tiroir du compte (téléphone) : ouvert par le burger de la barre, affiché hors de la barre
  const drawer = ref(false)
  const settingsOpen = ref(false)
  const accountOpen = ref(false)
  const clearOpen = ref(false)
  const deleteOpen = ref(false)
  const welcomeOpen = ref(false)
  const notice = ref(false)
  const noticeText = ref('')
  const buttons = useButtonsStore()
  const bigPicture = useBigPictureStore()
  // Rien à effacer : une fois les boutons chargés, une grille vide grise le bouton de la fenêtre « Mon compte »
  const gridEmpty = computed(() => buttons.loaded && buttons.buttons.length === 0)
  const theme = useTheme()

  // Thème du compte (les effets sont lus par les cases elles-mêmes, voir ButtonTile)
  watch(() => settings.theme, name => theme.change(name), { immediate: true })

  // Déconnexion (ici ou session perdue, voir api/http.ts) ou sortie du mode invité : retour à la page de connexion
  watch(signedIn, isSignedIn => {
    if (!isSignedIn) {
      const destination = guardRoute(route, false)
      if (destination !== true) router.replace(destination)
    }
  })

  // Écran de bienvenue : une fois connecté (ou invité), une seule fois par appareil ; toute fermeture vaut « vu »
  watch(signedIn, isSignedIn => {
    if (isSignedIn && !readWelcomeSeen()) welcomeOpen.value = true
  }, { immediate: true })
  watch(welcomeOpen, isOpen => {
    if (!isOpen) writeWelcomeSeen()
  })

  // La grille et ses dossiers : le big picture ne vaut que là, même retenu d'une visite précédente
  const onGrid = computed(() => route.name === 'grid' || route.name === 'folder')
  const bigPictureOn = computed(() => bigPicture.active && onGrid.value)

  // La page de configuration de la grille (dossiers compris) : son entrée du menu est surlignée
  const onConfig = computed(() => route.path === '/config' || route.path.startsWith('/config/'))

  function onAccountAction (action: AccountAction) {
    switch (action) {
      case 'grid': {
        router.push('/')
        break
      }
      case 'config': {
        router.push('/config')
        break
      }
      case 'settings': {
        settingsOpen.value = true
        break
      }
      case 'account': {
        accountOpen.value = true
        break
      }
      case 'bigPicture': {
        enterBigPicture()
        break
      }
      case 'logout': {
        signOut()
        break
      }
      case 'clear': {
        clearOpen.value = true
        break
      }
      case 'register': {
        router.push({ name: 'register' })
        break
      }
      case 'login': {
        router.push({ name: 'login' })
        break
      }
      case 'leaveGuest': {
        auth.leaveGuest()
        break
      }
    }
  }

  // Le mode ne vaut que pour la grille : depuis la configuration, on l'ouvre d'abord
  async function enterBigPicture () {
    if (onConfig.value) {
      await router.push('/')
    }
    bigPicture.enter()
  }

  function onCleared (count: number) {
    noticeText.value = t('notices.gridCleared', count)
    notice.value = true
  }

  // La session est déjà fermée : la page de connexion s'affiche (voir plus haut), le message l'accompagne
  function onAccountDeleted () {
    accountOpen.value = false
    noticeText.value = t('notices.accountDeleted')
    notice.value = true
  }

  async function retryMigration () {
    retrying.value = true
    try {
      if (await auth.retryMigration()) {
        noticeText.value = t('guest.migrated')
        notice.value = true
      }
    } finally {
      retrying.value = false
    }
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
