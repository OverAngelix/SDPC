<template>
  <div>
    <div class="text-body-2 text-medium-emphasis mb-2">Couleur</div>

    <div aria-label="Couleur" class="swatches" role="radiogroup">
      <button
        v-for="color in BUTTON_COLORS"
        :key="color.value"
        :aria-checked="color.value === model"
        :aria-label="color.label"
        class="swatch"
        :class="[`bg-${solidColor(color.value)}`, { 'swatch-selected': color.value === model, 'swatch-still': !settings.effectsEnabled }]"
        role="radio"
        :title="color.label"
        type="button"
        @click="model = color.value"
      >
        <v-icon v-if="color.value === model" color="white" icon="mdi-check" size="20" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ButtonColor } from '@/interfaces/button'
  import { useSettingsStore } from '@/stores/settings'
  import { BUTTON_COLORS, solidColor } from '@/utils/colors'

  const model = defineModel<ButtonColor>({ required: true })
  const settings = useSettingsStore()
</script>

<style scoped>
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .swatch {
    align-items: center;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    height: 36px;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    width: 36px;
  }

  .swatch:hover {
    transform: scale(1.12);
  }

  /* Anneau écarté de la pastille : visible sur fond clair comme sombre */
  .swatch-selected {
    box-shadow:
      0 0 0 3px rgb(var(--v-theme-surface)),
      0 0 0 5px rgb(var(--v-theme-on-surface));
  }

  .swatch:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 4px;
  }

  /* Effets coupés dans les réglages */
  .swatch.swatch-still {
    transition: none;
  }

  .swatch.swatch-still:hover {
    transform: none;
  }

  /* Le système demande moins de mouvement */
  @media (prefers-reduced-motion: reduce) {
    .swatch {
      transition: none;
    }

    .swatch:hover {
      transform: none;
    }
  }
</style>
