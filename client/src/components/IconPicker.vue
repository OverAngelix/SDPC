<template>
  <div>
    <v-text-field
      v-model="model"
      autocomplete="off"
      :error-messages="errorMessages"
      hint="Choisir une icône ci-dessous ou saisir un nom d'icône MDI"
      label="Icône"
      persistent-hint
      placeholder="mdi-youtube"
      :prepend-inner-icon="preview"
    />

    <div class="icon-list mt-2">
      <v-btn
        v-for="icon in COMMON_ICONS"
        :key="icon"
        :aria-label="icon"
        :color="icon === model ? 'primary' : undefined"
        :icon="icon"
        :title="icon"
        :variant="icon === model ? 'tonal' : 'text'"
        @click="model = icon"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { ICON_PATTERN } from '@/utils/buttonForm'
  import { COMMON_ICONS } from '@/utils/icons'

  const model = defineModel<string>({ required: true })

  defineProps<{
    errorMessages?: string
  }>()

  // Aperçu dans le champ : seulement quand le nom a la forme d'une icône MDI
  const preview = computed(() => ICON_PATTERN.test(model.value) ? model.value : undefined)
</script>

<style scoped>
  .icon-list {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    max-height: 168px;
    overflow-y: auto;
  }
</style>
