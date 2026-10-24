<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-1">Couleur</div>

    <v-btn-toggle
      v-model="model"
      class="color-list"
      density="compact"
      mandatory
      rounded="lg"
      variant="outlined"
    >
      <v-btn
        v-for="color in BUTTON_COLORS"
        :key="color.value"
        :aria-label="color.label"
        class="color-swatch"
        :title="color.label"
        :value="color.value"
      >
        <v-icon
          :color="color.value"
          :icon="color.value === model ? 'mdi-check-circle' : 'mdi-circle'"
        />
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script lang="ts" setup>
  import type { ButtonColor } from '@/interfaces/button'
  import { BUTTON_COLORS } from '@/utils/colors'

  const model = defineModel<ButtonColor>({ required: true })
</script>

<style scoped>
  .color-list {
    flex-wrap: wrap;
    height: auto;
  }

  .color-swatch {
    min-width: 40px;
  }
</style>
