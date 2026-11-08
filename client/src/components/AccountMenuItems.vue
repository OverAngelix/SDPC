<template>
  <v-list density="comfortable" nav>
    <template v-if="part !== 'logout'">
      <v-list-subheader class="text-truncate">{{ guest ? t('guest.name') : email }}</v-list-subheader>

      <!-- Deux entrées fixes : un même emplacement ne change jamais de rôle ; celle de la page courante est surlignée -->
      <v-list-item
        :active="!onConfig"
        prepend-icon="mdi-view-grid"
        :title="t('menu.grid')"
        @click="emit('select', 'grid')"
      />

      <v-list-item
        :active="onConfig"
        prepend-icon="mdi-view-grid-plus"
        :title="t('menu.gridConfig')"
        @click="emit('select', 'config')"
      />

      <v-list-item
        prepend-icon="mdi-tune"
        :title="t('menu.appSettings')"
        @click="emit('select', 'settings')"
      />

      <!-- Invité : pas de compte à gérer, seulement sa grille à effacer -->
      <v-list-item
        v-if="guest"
        prepend-icon="mdi-delete-sweep"
        :title="t('menu.clearGrid')"
        @click="emit('select', 'clear')"
      />

      <v-list-item
        v-else
        prepend-icon="mdi-account-cog"
        :title="t('menu.accountWindow')"
        @click="emit('select', 'account')"
      />

      <v-list-item
        prepend-icon="mdi-fullscreen"
        :title="t('menu.bigPicture')"
        @click="emit('select', 'bigPicture')"
      />
    </template>

    <v-divider v-if="part === 'all'" class="my-1" />

    <template v-if="part !== 'main' && guest">
      <v-list-item
        prepend-icon="mdi-account-plus"
        :title="t('menu.register')"
        @click="emit('select', 'register')"
      />

      <v-list-item
        prepend-icon="mdi-login"
        :title="t('menu.login')"
        @click="emit('select', 'login')"
      />

      <v-list-item
        prepend-icon="mdi-exit-run"
        :title="t('menu.leaveGuest')"
        @click="emit('select', 'leaveGuest')"
      />
    </template>

    <v-list-item
      v-else-if="part !== 'main'"
      prepend-icon="mdi-logout"
      :title="t('menu.logout')"
      @click="emit('select', 'logout')"
    />
  </v-list>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import { useI18n } from 'vue-i18n'

  withDefaults(defineProps<{
    email: string
    /** Mode invité : pas de compte, mais de quoi en créer un ou se connecter */
    guest?: boolean
    /** On est sur la page de configuration de la grille (sinon sur la grille) : son entrée est surlignée */
    onConfig: boolean
    /** `main` : les entrées ; `logout` : la déconnexion seule (ancrée en bas du tiroir) ; `all` : tout, pour le menu déroulant */
    part?: 'main' | 'logout' | 'all'
  }>(), { guest: false, part: 'all' })

  const emit = defineEmits<{ select: [action: AccountAction] }>()

  const { t } = useI18n()
</script>
