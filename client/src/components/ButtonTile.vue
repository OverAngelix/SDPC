<template>
  <v-card
    v-if="back || button"
    :aria-label="label"
    class="tile tile-live d-flex flex-column align-center justify-center pa-2"
    :class="[effect && `tile-${effect}`, { 'tile-launch': launching }]"
    :color="color"
    link
    variant="flat"
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
    :class="effect && `tile-${effect}`"
    link
    variant="text"
    @click="emit('create')"
  >
    <v-icon icon="mdi-plus" size="20cqw" />
  </v-card>

  <div v-else class="tile tile-empty" :class="effect && `tile-${effect}`" />
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { computed, onBeforeUnmount, ref } from 'vue'
  import { colorOf, DEFAULT_COLOR, solidColor } from '@/utils/colors'

  const props = defineProps<{
    /** null : emplacement libre, affiché vide pour que la grille garde sa forme */
    button: Button | null
    /** Tuile de retour au dossier parent (première case d'un dossier) : `button` est ignoré */
    back?: boolean
    /** Mode configuration : un emplacement libre propose la création, un bouton sa modification et sa suppression */
    editable?: boolean
    /** Effet ponctuel : la case vient d'être posée (pop) ou son dépôt est refusé (shake) */
    effect?: 'pop' | 'shake'
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
  // Case pleine, texte et icônes en blanc ; la tuile de retour est toujours grise
  const color = computed(() => solidColor(props.back ? DEFAULT_COLOR : colorOf(props.button)))
  const isFolder = computed(() => !props.back && props.button?.type === 'folder')

  // Lancement d'une action : l'animation joue pendant que l'onglet s'ouvre, sans jamais le retarder
  const LAUNCH_MS = 500
  const launching = ref(false)
  let launchTimer: ReturnType<typeof setTimeout> | undefined

  function launch () {
    clearTimeout(launchTimer)
    launching.value = true
    launchTimer = setTimeout(() => {
      launching.value = false
    }, LAUNCH_MS)
  }

  onBeforeUnmount(() => clearTimeout(launchTimer))

  function onClick () {
    if (props.back) {
      emit('back')
    } else if (props.button) {
      emit('select', props.button)
      if (props.button.type === 'action' && !props.editable) launch()
    }
  }
</script>

<style scoped>
  .tile {
    aspect-ratio: 1;
    container-type: size;
    min-width: 0;
    position: relative;
    /* Apparition en vague : --wave est la diagonale de la case, posée par la grille. `backwards` rend
       la main aux états survol et appui une fois l'animation finie */
    animation: tile-enter 0.3s ease-out backwards;
    animation-delay: calc(var(--wave, 0) * 35ms);
  }

  /* Cases qui réagissent sous le doigt, comme les touches d'un vrai Stream Deck */
  .tile-live {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  /* Au doigt, le survol resterait collé après un toucher : il est réservé aux appareils qui survolent */
  @media (hover: hover) {
    .tile-live:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
    }
  }

  .tile-live:active {
    transform: scale(0.93);
    box-shadow: none;
    transition-duration: 0.05s;
  }

  .tile-launch {
    animation: tile-launch 0.5s ease-out;
  }

  .tile-pop {
    animation: tile-pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .tile-shake {
    animation: tile-shake 0.4s ease-in-out;
  }

  @keyframes tile-enter {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.85);
    }
  }

  @keyframes tile-launch {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.6);
    }
    35% {
      transform: scale(0.9);
    }
    65% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 18px rgba(var(--v-theme-primary), 0);
    }
  }

  @keyframes tile-pop {
    0% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    60% {
      transform: scale(1.12);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes tile-shake {
    20%, 60% {
      transform: translateX(-7px);
    }
    40%, 80% {
      transform: translateX(7px);
    }
  }

  /* Le système demande moins de mouvement : plus aucune animation ni transformation */
  @media (prefers-reduced-motion: reduce) {
    .tile,
    .tile-live,
    .tile-launch,
    .tile-pop,
    .tile-shake {
      animation: none;
      transition: none;
    }

    .tile-live:hover,
    .tile-live:active {
      transform: none;
    }
  }

  .tile-label {
    font-size: clamp(0.75rem, 11cqw, 1rem);
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

  /* Au doigt : boutons Modifier et Supprimer plus faciles à toucher, sans masquer le badge dossier */
  @media (pointer: coarse) {
    .tile-actions {
      opacity: 1;
    }

    .tile-actions :deep(.v-btn) {
      width: 26px;
      height: 26px;
    }
  }

  .tile-empty {
    border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
  }
</style>
