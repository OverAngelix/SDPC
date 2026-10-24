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

    <!-- Les flèches signalent que la liste défile et la font défiler d'un coup, sans molette horizontale -->
    <div class="d-flex align-center mt-2">
      <v-btn
        aria-label="Icônes précédentes"
        density="comfortable"
        :disabled="!canScrollBack"
        icon="mdi-chevron-left"
        variant="text"
        @click="scrollList(-1)"
      />

      <div ref="list" class="icon-list" @scroll="updateArrows">
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

      <v-btn
        aria-label="Icônes suivantes"
        density="comfortable"
        :disabled="!canScrollForward"
        icon="mdi-chevron-right"
        variant="text"
        @click="scrollList(1)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { ICON_PATTERN } from '@/utils/buttonForm'
  import { COMMON_ICONS } from '@/utils/icons'

  const model = defineModel<string>({ required: true })

  defineProps<{
    errorMessages?: string
  }>()

  // Liste défilante : les flèches se grisent aux extrémités
  const list = ref<HTMLElement | null>(null)
  const canScrollBack = ref(false)
  const canScrollForward = ref(false)

  function updateArrows () {
    const element = list.value
    if (!element) return
    canScrollBack.value = element.scrollLeft > 0
    canScrollForward.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
  }

  function scrollList (direction: -1 | 1) {
    const element = list.value
    element?.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' })
  }

  // Le dialogue s'affiche après le montage du composant : on attend que la liste ait sa largeur
  onMounted(() => nextTick(updateArrows))

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
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .icon-list::-webkit-scrollbar {
    display: none;
  }
</style>
