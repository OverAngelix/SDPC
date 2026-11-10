<template>
  <div>
    <div class="text-body-2 text-medium-emphasis mb-2">{{ t('pickers.color') }}</div>

    <div :aria-label="t('pickers.color')" class="swatches" role="radiogroup">
      <button
        v-for="color in BUTTON_COLORS"
        :key="color"
        :aria-checked="color === model"
        :aria-label="t(`colors.${color}`)"
        class="swatch"
        :class="[`bg-${solidColor(color)}`, { 'swatch-selected': color === model, 'swatch-still': !settings.effectsEnabled }]"
        role="radio"
        :title="t(`colors.${color}`)"
        type="button"
        @click="model = color"
      >
        <v-icon v-if="color === model" color="white" icon="mdi-check" size="16" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ButtonColor } from '@/interfaces/button'
  import { useI18n } from 'vue-i18n'
  import { useSettingsStore } from '@/stores/settings'
  import { BUTTON_COLORS, solidColor } from '@/utils/colors'

  const model = defineModel<ButtonColor>({ required: true })
  const settings = useSettingsStore()
  const { t } = useI18n()
</script>

<style scoped>
  /* Les dix pastilles toujours sur une ligne, même sur téléphone */
  .swatches {
    display: grid;
    grid-template-columns: repeat(10, 28px);
    justify-content: space-between;
    max-width: 400px;
    padding: 5px;
  }

  .swatch {
    align-items: center;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    height: 28px;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    width: 28px;
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
