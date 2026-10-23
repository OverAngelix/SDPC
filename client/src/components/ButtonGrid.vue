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
      :class="{ 'tile-dragging': button !== null && button === dragged, 'tile-drop': index === overIndex }"
      :draggable="editable && button !== null"
      :editable="editable"
      @back="emit('back')"
      @create="emit('create', index)"
      @dragend="resetDrag"
      @dragleave="onDragLeave($event, index)"
      @dragover="onDragOver($event, index)"
      @dragstart="onDragStart($event, button)"
      @drop="onDrop($event, index)"
      @edit="emit('edit', $event)"
      @remove="emit('remove', $event)"
      @select="emit('select', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { Button } from '@/interfaces/button'
  import { ref } from 'vue'
  import ButtonTile from '@/components/ButtonTile.vue'
  import { BACK_SLOT, COLUMNS, ROWS } from '@/grid'

  const props = defineProps<{
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
    /** Un bouton est lâché sur un emplacement : libre, il s'y place ; occupé, les deux échangent leur place */
    move: [button: Button, position: number]
  }>()

  // Glisser-déposer : le bouton en cours de déplacement et l'emplacement survolé
  const dragged = ref<Button | null>(null)
  const overIndex = ref<number | null>(null)

  // La case 0 d'un dossier est le retour : elle ne reçoit aucun bouton
  function isDestination (index: number) {
    return props.editable && !(props.back && index === BACK_SLOT)
  }

  function resetDrag () {
    dragged.value = null
    overIndex.value = null
  }

  function onDragStart (event: DragEvent, button: Button | null) {
    if (!props.editable || button === null) return
    dragged.value = button
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      // Firefox ne lance pas le glisser sans donnée
      event.dataTransfer.setData('text/plain', button.id)
    }
  }

  function onDragOver (event: DragEvent, index: number) {
    // Sans preventDefault le navigateur refuse le dépôt : on ne l'appelle que pour une destination valide
    if (dragged.value === null || !isDestination(index)) return
    event.preventDefault()
    overIndex.value = index
  }

  // dragleave se déclenche aussi en entrant dans un enfant de la tuile : on ignore ce cas
  function onDragLeave (event: DragEvent, index: number) {
    const target = event.currentTarget as Node | null
    if (overIndex.value === index && !(event.relatedTarget instanceof Node && target?.contains(event.relatedTarget))) {
      overIndex.value = null
    }
  }

  function onDrop (event: DragEvent, index: number) {
    const button = dragged.value
    if (button === null || !isDestination(index)) return
    event.preventDefault()
    resetDrag()
    if (index !== button.position) emit('move', button, index)
  }
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

  .tile-dragging {
    opacity: 0.4;
  }

  .tile-drop {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }
</style>
