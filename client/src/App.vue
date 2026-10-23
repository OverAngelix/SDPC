<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title>SDPC</v-app-bar-title>

      <v-tabs>
        <v-tab prepend-icon="mdi-view-grid" text="Grille" to="/" />
        <v-tab prepend-icon="mdi-cog" text="Configuration" to="/config" />
      </v-tabs>

      <v-chip
        class="mr-4"
        :color="statusColor"
        label
        link
        :prepend-icon="statusIcon"
        :text="statusText"
        title="Cliquer pour revérifier la connexion"
        @click="server.retry()"
      />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted } from 'vue'
  import { useServerStore } from '@/stores/server'

  const server = useServerStore()

  const statusColor = computed(() => ({ unknown: 'grey', online: 'success', offline: 'error' })[server.status])
  const statusIcon = computed(() => ({ unknown: 'mdi-help-circle', online: 'mdi-check-circle', offline: 'mdi-alert-circle' })[server.status])
  const statusText = computed(() => ({ unknown: 'Serveur : vérification…', online: 'Serveur connecté', offline: 'Serveur injoignable' })[server.status])

  onMounted(() => server.startPolling())
  onUnmounted(() => server.stopPolling())
</script>
