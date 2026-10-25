<template>
  <v-list density="comfortable" nav>
    <template v-if="part !== 'logout'">
      <v-list-subheader class="text-truncate">{{ email }}</v-list-subheader>

      <v-list-item
        :prepend-icon="onConfig ? 'mdi-view-grid' : 'mdi-view-grid-plus'"
        :title="onConfig ? 'Retour à la grille' : 'Configuration de la grille'"
        @click="emit('select', 'grid')"
      />
    </template>

    <v-divider v-if="part === 'all'" class="my-1" />

    <v-list-item
      v-if="part !== 'main'"
      prepend-icon="mdi-logout"
      title="Déconnexion"
      @click="emit('select', 'logout')"
    />
  </v-list>
</template>

<script lang="ts" setup>
  import type { AccountAction } from '@/interfaces/account'

  withDefaults(defineProps<{
    email: string
    /** On est sur la page de configuration de la grille : la première entrée ramène à la grille */
    onConfig: boolean
    /** `main` : les entrées ; `logout` : la déconnexion seule (ancrée en bas du tiroir) ; `all` : tout, pour le menu déroulant */
    part?: 'main' | 'logout' | 'all'
  }>(), { part: 'all' })

  const emit = defineEmits<{ select: [action: AccountAction] }>()
</script>
