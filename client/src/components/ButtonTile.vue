<template>
  <v-card
    v-if="back || button"
    :aria-label="label"
    class="tile d-flex flex-column align-center justify-center pa-2"
    link
    variant="tonal"
    @click="onClick"
  >
    <v-icon class="tile-icon" :icon="icon" size="38cqw" />
    <span class="tile-label text-center">{{ label }}</span>

    <v-icon
      v-if="isFolder"
      class="tile-folder"
      icon="mdi-folder"
      size="14cqw"
    />

    <div v-if="editable && !back && button" class="tile-actions">
      <v-btn
        aria-label="Modifier"
        density="comfortable"
        icon="mdi-pencil"
        size="x-small"
        variant="text"
        @click.stop="emit('edit', button)"
      />

      <v-btn
        aria-label="Supprimer"
        density="comfortable"
        icon="mdi-delete"
        size="x-small"
        variant="text"
        @click.stop="emit('remove', button)"
      />
    </div>
  </v-card>

  <v-card
    v-else-if="editable"
    aria-label="Ajouter un bouton"
    class="tile tile-empty d-flex align-center justify-center text-medium-emphasis"
    link
    variant="text"
    @click="emit('create')"
  >
    <v-icon icon="mdi-plus" size="20cqw" />
  </v-card>

  <div v-else class="tile tile-empty" />
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { computed } from 'vue'

  const props = defineProps<{
    /** null : emplacement libre, affiché vide pour que la grille garde sa forme */
    button: Button | null
    /** Tuile de retour au dossier parent (première case d'un dossier) : `button` est ignoré */
    back?: boolean
    /** Mode configuration : un emplacement libre propose la création, un bouton sa modification et sa suppression */
    editable?: boolean
  }>()

  const emit = defineEmits<{
    select: [button: Button]
    back: []
    create: []
    edit: [button: Button]
    remove: [button: Button]
  }>()

  const icon = computed(() => props.back ? 'mdi-arrow-left' : props.button?.icon)
  const label = computed(() => props.back ? 'Retour' : props.button?.label)
  const isFolder = computed(() => !props.back && props.button?.type === 'folder')

  function onClick () {
    if (props.back) {
      emit('back')
    } else if (props.button) {
      emit('select', props.button)
    }
  }
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

  .tile-actions {
    position: absolute;
    top: 2px;
    left: 2px;
    display: flex;
    opacity: 0.7;
  }

  .tile-empty {
    border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
  }
</style>
