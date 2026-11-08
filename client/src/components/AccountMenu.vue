<template>
  <!-- Téléphone : un burger ouvre le tiroir (AccountDrawer, à la racine de l'application) -->
  <v-btn
    v-if="xs"
    :aria-label="t('menu.open')"
    icon="mdi-menu"
    @click="drawer = !drawer"
  />

  <!-- Ordinateur et tablette : un menu déroulant sous le bouton, qui se ferme après le choix -->
  <v-menu v-else>
    <template #activator="{ props: activator }">
      <v-btn
        v-bind="activator"
        prepend-icon="mdi-account-circle"
        :text="t('menu.account')"
        variant="text"
      />
    </template>

    <v-card min-width="280">
      <account-menu-items
        :email="email"
        :guest="guest"
        :on-config="onConfig"
        @select="emit('select', $event)"
      />
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import AccountMenuItems from '@/components/AccountMenuItems.vue'

  defineProps<{
    email: string
    guest: boolean
    onConfig: boolean
  }>()

  const emit = defineEmits<{ select: [action: AccountAction] }>()

  /** Tiroir ouvert (téléphone) : posé par le burger, lu par AccountDrawer */
  const drawer = defineModel<boolean>('drawer', { default: false })

  const { xs } = useDisplay()
  const { t } = useI18n()
</script>
