<template>
  <div>
    <v-text-field
      v-model="model"
      autocomplete="off"
      :error-messages="errorMessages"
      :hide-details="!errorMessages"
      label="Icône"
      placeholder="Choisir ci-dessous ou saisir un nom d'icône MDI (mdi-youtube)"
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
  /* Deux lignes qui défilent horizontalement : le sélecteur reste bas dans le formulaire */
  .icon-list {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(2, 48px);
    grid-auto-columns: 48px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
</style>
