<template>
  <div
    class="grid"
    :style="{ '--columns': COLUMNS, '--rows': ROWS }"
  >
    <button-tile
      v-for="(button, index) in slots"
      :key="button?.id ?? `empty-${index}`"
      :button="button"
      @select="emit('select', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import ButtonTile from '@/components/ButtonTile.vue'
  import { COLUMNS, ROWS } from '@/grid'

  defineProps<{
    /** Un élément par emplacement, dans l'ordre : le bouton ou null */
    slots: (Button | null)[]
  }>()

  const emit = defineEmits<{
    select: [button: Button]
  }>()
</script>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    gap: 12px;
    margin-inline: auto;
    /* La grille entière tient dans la hauteur de l'écran, sans dépasser la largeur disponible */
    max-width: min(100%, calc((100vh - 200px) * var(--columns) / var(--rows)));
  }
</style>
