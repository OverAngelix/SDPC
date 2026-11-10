<template>
  <img
    v-if="src && !failed"
    alt=""
    class="button-icon-image"
    loading="lazy"
    referrerpolicy="no-referrer"
    :src="src"
    :style="{ width: size, height: size }"
    @error="failed = true"
    @load="onLoad"
  >

  <v-icon v-else :icon="icon === FAVICON_ICON ? FAVICON_FALLBACK_ICON : icon" :size="size" />
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import { FAVICON_FALLBACK_ICON, FAVICON_ICON, FAVICON_MISSING_SIZE } from '@/utils/constants'
  import { faviconUrl } from '@/utils/favicon'

  const props = defineProps<{
    /** Nom d'icône MDI, ou `FAVICON_ICON` pour le favicon du site de `url` */
    icon: string
    /** URL de l'action : seulement utile avec `FAVICON_ICON` */
    url?: string
    /** Taille CSS de l'icône, ex. "38cqw" */
    size: string
  }>()

  const src = computed(() => props.icon === FAVICON_ICON ? faviconUrl(props.url) : null)

  // Image injoignable (hors ligne, service bloqué) ou générique (site sans icône) : repli sur l'icône du web
  const failed = ref(false)
  watch(src, () => {
    failed.value = false
  })

  function onLoad (event: Event) {
    const image = event.target as HTMLImageElement
    if (image.naturalWidth <= FAVICON_MISSING_SIZE) {
      failed.value = true
    }
  }
</script>

<style scoped>
  .button-icon-image {
    border-radius: 12%;
    object-fit: contain;
  }
</style>
