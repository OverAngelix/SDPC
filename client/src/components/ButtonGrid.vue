<template>
  <div
    class="grid"
    :style="{ '--columns': shape.columns, '--rows': shape.rows }"
  >
    <button-tile
      v-for="(button, index) in slots"
      :key="button?.id ?? `empty-${index}`"
      :back="back && index === BACK_SLOT"
      :button="button"
      :class="{
        'tile-dragging': button !== null && button === dragged,
        'tile-moving': button !== null && button === moving,
        'tile-drop': index === overIndex && !isReserved(index),
        'tile-forbidden': index === overIndex && isReserved(index),
      }"
      :draggable="editable && button !== null"
      :editable="editable"
      :effect="effectOf(button, index)"
      :style="{ '--wave': wave(index) }"
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
  import { onBeforeUnmount, ref, watch } from 'vue'
  import ButtonTile from '@/components/ButtonTile.vue'
  import { useGridShape } from '@/composables/gridShape'
  import { BACK_SLOT, placedIds, waveStep } from '@/grid'

  const props = defineProps<{
    /** Un élément par emplacement, dans l'ordre : le bouton ou null */
    slots: (Button | null)[]
    /** Affiche le bouton retour à la première case (dans un dossier) */
    back?: boolean
    /** Mode configuration : les emplacements libres se remplissent, les boutons se modifient et se suppriment */
    editable?: boolean
    /** Déplacement au doigt : le bouton en attente de sa destination, marqué dans la grille */
    moving?: Button | null
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
    /** Un bouton est lâché sur la tuile de retour, qui ne peut pas le recevoir */
    reserved: [button: Button]
  }>()

  // 7 × 4 en paysage, 4 × 7 en portrait : les mêmes emplacements, rangés selon l'orientation de l'écran
  const shape = useGridShape()

  // Glisser-déposer : le bouton en cours de déplacement et l'emplacement survolé
  const dragged = ref<Button | null>(null)
  const overIndex = ref<number | null>(null)

  // La case 0 d'un dossier est le retour : elle ne reçoit aucun bouton
  function isReserved (index: number) {
    return props.back && index === BACK_SLOT
  }

  // Effets ponctuels : les boutons qui viennent d'être posés, et la tuile de retour dont le dépôt est refusé
  const EFFECT_MS = 500
  const placed = ref<Set<string>>(new Set())
  const refused = ref(false)
  let placedTimer: ReturnType<typeof setTimeout> | undefined
  let refusedTimer: ReturnType<typeof setTimeout> | undefined

  // Création, déplacement et échange. Un changement de dossier remplace la grille entière (clé de la page), il ne passe pas ici
  watch(() => props.slots, (next, previous) => {
    const ids = placedIds(previous, next)
    if (ids.length === 0) return
    clearTimeout(placedTimer)
    placed.value = new Set(ids)
    placedTimer = setTimeout(() => {
      placed.value = new Set()
    }, EFFECT_MS)
  })

  onBeforeUnmount(() => {
    clearTimeout(placedTimer)
    clearTimeout(refusedTimer)
  })

  function effectOf (button: Button | null, index: number) {
    if (button !== null && placed.value.has(button.id)) return 'pop'
    if (refused.value && isReserved(index)) return 'shake'
    return undefined
  }

  // Les cases apparaissent en vague, de la case en haut à gauche vers celle en bas à droite
  function wave (index: number) {
    return waveStep(index, shape.value.columns)
  }

  function refuse () {
    clearTimeout(refusedTimer)
    refused.value = true
    refusedTimer = setTimeout(() => {
      refused.value = false
    }, EFFECT_MS)
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
    // Sans preventDefault le navigateur refuse le dépôt. La tuile de retour l'accepte aussi,
    // pour pouvoir expliquer le refus au lâcher plutôt que de laisser le bouton revenir sans rien dire
    if (dragged.value === null || !props.editable) return
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
    if (button === null || !props.editable) return
    event.preventDefault()
    resetDrag()
    if (isReserved(index)) {
      refuse()
      emit('reserved', button)
    } else if (index !== button.position) {
      emit('move', button, index)
    }
  }
</script>

<style scoped>
  .grid {
    /* Hauteur prise par la barre d'application et les marges autour de la grille */
    --reserve: 200px;
    --gap: 12px;
    /* Taille maximale d'une case : sur un grand écran, la grille garde à peu près la place qu'elle avait
       avec plus de cases, sans que celles-ci ne grandissent démesurément */
    --tile-max: 124px;
    --max-width: calc(var(--columns) * var(--tile-max) + (var(--columns) - 1) * var(--gap));
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    gap: var(--gap);
    margin-inline: auto;
    /* La grille entière tient dans la hauteur de l'écran (dvh : la barre d'adresse mobile ne la fausse pas),
       sans dépasser la largeur disponible */
    max-width: min(100%, var(--max-width), calc((100vh - var(--reserve)) * var(--columns) / var(--rows)));
  }

  @supports (height: 100dvh) {
    .grid {
      max-width: min(100%, var(--max-width), calc((100dvh - var(--reserve)) * var(--columns) / var(--rows)));
    }
  }

  /* Téléphone : moins de marges, cases plus serrées donc plus grandes */
  @media (max-width: 599px) {
    .grid {
      --reserve: 84px;
      --gap: 6px;
    }
  }

  /* Téléphone couché : la hauteur est trop courte pour y faire tenir la grille, on la laisse défiler
     plutôt que de réduire les cases à quelques pixels */
  @media (orientation: landscape) and (max-height: 500px) {
    .grid {
      max-width: 100%;
    }
  }

  .tile-dragging {
    opacity: 0.4;
  }

  /* Déplacement au doigt : le bouton choisi attend un emplacement */
  .tile-moving {
    outline: 2px dashed rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }

  .tile-drop {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }

  /* Destination refusée : la tuile de retour */
  .tile-forbidden {
    outline: 2px solid rgb(var(--v-theme-error));
    outline-offset: -2px;
    cursor: not-allowed;
  }
</style>
