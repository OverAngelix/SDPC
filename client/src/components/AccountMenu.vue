<template>
  <!-- Téléphone : un burger ouvre le tiroir (AccountDrawer, à la racine de l'application) -->
  <v-btn
    v-if="xs"
    aria-label="Menu"
    icon="mdi-menu"
    @click="drawer = !drawer"
  />

  <!-- Ordinateur et tablette : un menu déroulant sous le bouton, qui se ferme après le choix -->
  <v-menu v-else>
    <template #activator="{ props: activator }">
      <v-btn
        v-bind="activator"
        prepend-icon="mdi-account-circle"
        text="Mon compte"
        variant="text"
      />
    </template>

    <v-card min-width="280">
      <account-menu-items
        :email="email"
        :on-config="onConfig"
        @select="emit('select', $event)"
      />
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import { useDisplay } from 'vuetify'
  import AccountMenuItems from '@/components/AccountMenuItems.vue'

  defineProps<{
    email: string
    onConfig: boolean
  }>()

  const emit = defineEmits<{ select: [action: AccountAction] }>()

  /** Tiroir ouvert (téléphone) : posé par le burger, lu par AccountDrawer */
  const drawer = defineModel<boolean>('drawer', { default: false })

  const { xs } = useDisplay()
</script>
