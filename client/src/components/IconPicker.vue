<template>
  <div>
    <!-- L'icône du site n'existe que pour une action, qui a une URL -->
    <div v-if="favicon" class="mb-2">
      <v-btn-toggle
        color="primary"
        density="compact"
        divided
        mandatory
        :model-value="model === FAVICON_ICON ? 'site' : 'library'"
        variant="outlined"
        @update:model-value="choose"
      >
        <v-btn size="small" :text="t('pickers.favicon')" value="site">
          <template #prepend>
            <button-icon :icon="FAVICON_ICON" size="18px" :url="url" />
          </template>
        </v-btn>

        <v-btn prepend-icon="mdi-shape" size="small" :text="t('pickers.library')" value="library" />
      </v-btn-toggle>
    </div>

    <!-- Toutes les icônes, sur plusieurs lignes : la liste défile en hauteur, aucune n'est coupée au bord -->
    <div :aria-label="t('pickers.icon')" class="icon-list" :class="{ 'icon-list-muted': model === FAVICON_ICON }" role="group">
      <v-btn
        v-for="icon in COMMON_ICONS"
        :key="icon"
        :aria-label="icon"
        :color="icon === model ? 'primary' : undefined"
        density="comfortable"
        :icon="icon"
        :title="icon"
        :variant="icon === model ? 'tonal' : 'text'"
        @click="model = icon"
      />
    </div>

    <div v-if="errorMessages" class="text-error text-caption mt-1">{{ errorMessages }}</div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ButtonIcon from '@/components/ButtonIcon.vue'
  import { FAVICON_FALLBACK_ICON, FAVICON_ICON } from '@/utils/constants'
  import { COMMON_ICONS } from '@/utils/icons'

  const model = defineModel<string>({ required: true })
  const { t } = useI18n()

  defineProps<{
    errorMessages?: string
    /** Propose l'icône du site (action uniquement) */
    favicon?: boolean
    /** URL de l'action, pour l'aperçu de son favicon */
    url?: string
  }>()

  // Dernière icône de la bibliothèque : on la retrouve en revenant de l'icône du site
  const lastLibraryIcon = ref(FAVICON_FALLBACK_ICON)
  watch(model, icon => {
    if (icon !== FAVICON_ICON) lastLibraryIcon.value = icon
  }, { immediate: true })

  function choose (source: string) {
    model.value = source === 'site' ? FAVICON_ICON : lastLibraryIcon.value
  }
</script>

<style scoped>
  .icon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    /* Deux lignes entières visibles, jamais une ligne coupée à mi-hauteur */
    grid-auto-rows: 40px;
    align-items: center;
    justify-items: center;
    max-height: 80px;
    overflow-y: auto;
    transition: opacity 0.15s ease;
  }

  /* Icône du site choisie : la bibliothèque reste là, en retrait, un clic suffit pour y revenir */
  .icon-list-muted {
    opacity: 0.6;
  }
</style>
