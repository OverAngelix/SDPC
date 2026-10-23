<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-title>SDPC</v-app-bar-title>

      <v-tabs>
        <v-tab prepend-icon="mdi-view-grid" text="Grille" to="/" />
        <v-tab prepend-icon="mdi-cog" text="Configuration" to="/config" />
      </v-tabs>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
