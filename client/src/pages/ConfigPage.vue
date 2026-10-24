<template>
  <v-container class="page-centered pa-2 pa-sm-4">
    <grid-status :home="{ name: 'config' }" :path="path">
      <p class="text-medium-emphasis text-center mb-4">
        Un emplacement vide permet de créer un bouton, un dossier de configurer son contenu.
        Glissez un bouton sur un autre emplacement pour le déplacer : s'il est occupé, les deux boutons échangent leur place.
        Sans souris, ouvrez le bouton puis touchez « Déplacer ».
      </p>

      <v-alert
        v-if="moving"
        class="mb-4"
        density="compact"
        icon="mdi-cursor-move"
        variant="tonal"
      >
        Déplacement de « {{ moving.label }} » : touchez l'emplacement de destination (un bouton occupé échange sa place).
        <template #append>
          <v-btn size="small" text="Annuler" variant="outlined" @click="moving = null" />
        </template>
      </v-alert>

      <button-grid
        :key="folderId ?? 'root'"
        :back="folderId !== null"
        editable
        :moving="moving"
        :slots="slots"
        @back="onBack"
        @create="startCreate"
        @edit="startEdit"
        @move="move"
        @remove="startRemove"
        @reserved="refuseReserved"
        @select="select"
      />
    </grid-status>

    <button-form
      v-model="formOpen"
      :button="editing"
      :parent-id="folderId"
      :position="position"
      @move="startMove"
      @saved="onSaved"
    />

    <confirm-delete
      v-model="removeOpen"
      :button="removing"
      :content-count="removeCount"
      :error="removeError"
      :loading="removeLoading"
      @confirm="confirmRemove"
    />

    <v-snackbar v-model="snackbar" timeout="3000">{{ message }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import type { Button } from '@/interfaces/button'
  import { onMounted, ref, watch } from 'vue'
  import ButtonForm from '@/components/ButtonForm.vue'
  import ButtonGrid from '@/components/ButtonGrid.vue'
  import ConfirmDelete from '@/components/ConfirmDelete.vue'
  import GridStatus from '@/components/GridStatus.vue'
  import { useFolderNavigation } from '@/composables/folderNavigation'
  import { countContent } from '@/grid'
  import { useButtonsStore } from '@/stores/buttons'
  import { useSettingsStore } from '@/stores/settings'
  import { describeApiError } from '@/utils/apiError'

  const store = useButtonsStore()
  const settings = useSettingsStore()
  const { folderId, path, slots, openFolder, goBack } = useFolderNavigation({ root: 'config', folder: 'config-folder' })

  const formOpen = ref(false)
  // Le bouton modifié ; null pour une création
  const editing = ref<Button | null>(null)
  // L'emplacement du bouton à créer
  const position = ref(0)

  // Déplacement au doigt, sans glisser-déposer : le bouton choisi dans le formulaire, en attente de sa destination
  const moving = ref<Button | null>(null)

  // Un autre dossier ouvert (retour du navigateur compris) annule le déplacement en attente
  watch(folderId, () => {
    moving.value = null
  })

  const removeOpen = ref(false)
  const removing = ref<Button | null>(null)
  // Compté à l'ouverture : la liste change dès que le serveur a supprimé, avant la fermeture du dialogue
  const removeCount = ref(0)
  const removeLoading = ref(false)
  const removeError = ref<ApiErrorMessage | null>(null)

  const snackbar = ref(false)
  const message = ref('')

  function startCreate (slot: number) {
    if (moving.value) {
      void moveTo(slot)
      return
    }
    editing.value = null
    position.value = slot
    formOpen.value = true
  }

  function startEdit (button: Button) {
    moving.value = null
    editing.value = button
    formOpen.value = true
  }

  function startRemove (button: Button) {
    moving.value = null
    removing.value = button
    removeCount.value = countContent(store.buttons, button.id)
    removeError.value = null
    removeOpen.value = true
  }

  function startMove (button: Button) {
    formOpen.value = false
    moving.value = button
  }

  // Le bouton en déplacement va à l'emplacement touché : libre, il s'y place ; occupé, les deux échangent
  async function moveTo (slot: number) {
    const button = moving.value
    moving.value = null
    if (button && slot !== button.position) await move(button, slot)
  }

  // Le retour d'un dossier ne reçoit aucun bouton : pendant un déplacement, le toucher explique le refus
  function onBack () {
    if (moving.value) {
      moving.value = null
      refuseReserved()
    } else {
      goBack()
    }
  }

  // Un clic sur un dossier y entre ; un clic sur une action la modifie
  function select (button: Button) {
    if (moving.value) {
      void moveTo(button.position)
    } else if (button.type === 'folder') {
      openFolder(button.id)
    } else {
      startEdit(button)
    }
  }

  // Lâché sur la tuile de retour : rien n'est envoyé au serveur, on explique le refus
  function refuseReserved () {
    settings.play('refuse')
    notify('La première case d\'un dossier est réservée au bouton retour : on ne peut pas y placer un bouton.')
  }

  async function move (button: Button, slot: number) {
    try {
      await store.move(button.id, slot)
      settings.play('move')
    } catch (error) {
      settings.play('refuse')
      notify(`Déplacement impossible : ${describeApiError(error).title}`)
    }
  }

  async function confirmRemove () {
    if (!removing.value) return
    removeLoading.value = true
    removeError.value = null
    try {
      await store.remove(removing.value.id)
      removeOpen.value = false
      settings.play('delete')
      notify('Bouton supprimé.')
    } catch (error) {
      removeError.value = describeApiError(error)
    } finally {
      removeLoading.value = false
    }
  }

  // Une création sonne comme une création ; une modification, plus discrète, comme un déplacement
  function onSaved (text: string) {
    settings.play(editing.value === null ? 'create' : 'move')
    notify(text)
  }

  function notify (text: string) {
    message.value = text
    snackbar.value = true
  }

  // Recharge à chaque ouverture de l'onglet : un autre onglet a pu modifier la configuration
  onMounted(() => store.load())
</script>
