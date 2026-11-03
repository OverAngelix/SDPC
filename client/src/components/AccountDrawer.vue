<template>
  <!-- Téléphone : même contenu que le menu déroulant, la déconnexion est ancrée en bas -->
  <v-navigation-drawer
    v-model="open"
    location="right"
    temporary
    width="288"
  >
    <account-menu-items
      :email="email"
      :on-config="onConfig"
      part="main"
      @select="choose"
    />

    <template #append>
      <account-menu-items
        :email="email"
        :on-config="onConfig"
        part="logout"
        @select="choose"
      />
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'
  import AccountMenuItems from '@/components/AccountMenuItems.vue'

  defineProps<{
    email: string
    onConfig: boolean
  }>()

  const emit = defineEmits<{ select: [action: AccountAction] }>()

  const open = defineModel<boolean>({ default: false })

  // Le tiroir se ferme après le choix, y compris quand l'entrée ouvre une fenêtre
  function choose (action: AccountAction) {
    open.value = false
    emit('select', action)
  }
</script>
