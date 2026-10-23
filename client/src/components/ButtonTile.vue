<template>
  <v-card
    v-if="button"
    :aria-label="button.label"
    class="tile d-flex flex-column align-center justify-center pa-2"
    link
    variant="tonal"
    @click="emit('select', button)"
  >
    <v-icon class="tile-icon" :icon="button.icon" size="38cqw" />
    <span class="tile-label text-center">{{ button.label }}</span>

    <v-icon
      v-if="button.type === 'folder'"
      class="tile-folder"
      icon="mdi-folder"
      size="14cqw"
    />
  </v-card>

  <div v-else class="tile tile-empty" />
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'

  defineProps<{
    /** null : emplacement libre, affiché vide pour que la grille garde sa forme */
    button: Button | null
  }>()

  const emit = defineEmits<{
    select: [button: Button]
  }>()
</script>

<style scoped>
  .tile {
    aspect-ratio: 1;
    container-type: size;
    min-width: 0;
    position: relative;
  }

  .tile-label {
    font-size: clamp(0.65rem, 11cqw, 1rem);
    line-height: 1.15;
    max-width: 100%;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .tile-folder {
    position: absolute;
    top: 6px;
    right: 6px;
    opacity: 0.6;
  }

  .tile-empty {
    border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
  }
</style>
