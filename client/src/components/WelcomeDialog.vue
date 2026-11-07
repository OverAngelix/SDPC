<template>
  <v-dialog v-model="open" max-width="440">
    <v-card class="text-center px-4 pt-6 pb-4">
      <v-window v-model="step">
        <v-window-item v-for="(slide, index) in SLIDES" :key="slide.key" :value="index">
          <v-icon class="mb-4" color="primary" :icon="slide.icon" size="72" />

          <h2 class="text-h6 mb-2">{{ t(`welcome.${slide.key}.title`) }}</h2>

          <p class="text-medium-emphasis welcome-text">{{ t(`welcome.${slide.key}.text`) }}</p>
        </v-window-item>
      </v-window>

      <!-- Points : la slide courante, et un raccourci vers les autres -->
      <div class="d-flex justify-center ga-1 mt-4">
        <v-btn
          v-for="(slide, index) in SLIDES"
          :key="slide.key"
          :aria-label="t('welcome.goTo', { number: index + 1 })"
          :color="index === step ? 'primary' : undefined"
          density="compact"
          :icon="index === step ? 'mdi-circle' : 'mdi-circle-outline'"
          size="small"
          variant="text"
          @click="step = index"
        />
      </div>

      <v-card-actions class="mt-2">
        <v-btn v-if="step === 0" :text="t('welcome.skip')" @click="open = false" />

        <v-btn v-else :text="t('welcome.previous')" @click="step--" />

        <v-spacer />

        <v-btn
          v-if="last"
          color="primary"
          :text="t('welcome.start')"
          variant="flat"
          @click="open = false"
        />

        <v-btn
          v-else
          color="primary"
          :text="t('welcome.next')"
          variant="flat"
          @click="step++"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  // Les slides, dans l'ordre : une icône et leurs textes `welcome.<key>.title` et `.text`
  const SLIDES = [
    { key: 'grid', icon: 'mdi-view-grid-outline' },
    { key: 'folders', icon: 'mdi-folder-outline' },
    { key: 'config', icon: 'mdi-pencil-outline' },
  ] as const

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const { t } = useI18n()
  const step = ref(0)
  const last = computed(() => step.value === SLIDES.length - 1)

  // Chaque ouverture repart de la première slide
  watch(open, isOpen => {
    if (isOpen) step.value = 0
  })
</script>

<style scoped>
  /* Les slides gardent la même hauteur : les boutons ne sautent pas d'une slide à l'autre */
  .welcome-text {
    min-height: 4.5em;
  }
</style>
