<template>
  <v-list density="comfortable" nav>
    <template v-if="part !== 'logout'">
      <v-list-subheader class="text-truncate">{{ email }}</v-list-subheader>

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

      <v-list-item
        prepend-icon="mdi-account-cog"
        :title="t('menu.accountWindow')"
        @click="emit('select', 'account')"
      />
    </template>

    <v-divider v-if="part === 'all'" class="my-1" />

    <v-list-item
      v-if="part !== 'main'"
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
    /** On est sur la page de configuration de la grille (sinon sur la grille) : son entrée est surlignée */
    onConfig: boolean
    /** `main` : les entrées ; `logout` : la déconnexion seule (ancrée en bas du tiroir) ; `all` : tout, pour le menu déroulant */
    part?: 'main' | 'logout' | 'all'
  }>(), { part: 'all' })

  const emit = defineEmits<{ select: [action: AccountAction] }>()

  const { t } = useI18n()
</script>
