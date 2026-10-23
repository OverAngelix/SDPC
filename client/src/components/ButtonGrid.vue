<template>
  <div
    class="grid"
    :style="{ '--columns': COLUMNS, '--rows': ROWS }"
  >
    <button-tile
      v-for="(button, index) in slots"
      :key="button?.id ?? `empty-${index}`"
      :back="back && index === BACK_SLOT"
      :button="button"
      :editable="editable"
      @back="emit('back')"
      @create="emit('create', index)"
      @edit="emit('edit', $event)"
      @remove="emit('remove', $event)"
      @select="emit('select', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import ButtonTile from '@/components/ButtonTile.vue'
  import { BACK_SLOT, COLUMNS, ROWS } from '@/grid'

  defineProps<{
    /** Un élément par emplacement, dans l'ordre : le bouton ou null */
    slots: (Button | null)[]
    /** Affiche le bouton retour à la première case (dans un dossier) */
    back?: boolean
    /** Mode configuration : les emplacements libres se remplissent, les boutons se modifient et se suppriment */
    editable?: boolean
  }>()

  const emit = defineEmits<{
    select: [button: Button]
    back: []
    /** Un emplacement libre est choisi pour y créer un bouton */
    create: [position: number]
    edit: [button: Button]
    remove: [button: Button]
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
