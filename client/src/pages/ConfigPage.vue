<template>
  <v-container>
    <grid-status :home="{ name: 'config' }" :path="path">
      <p class="text-medium-emphasis text-center mb-4">
        Un emplacement vide permet de créer un bouton, un dossier de configurer son contenu.
        Glissez un bouton sur un autre emplacement pour le déplacer : s'il est occupé, les deux boutons échangent leur place.
      </p>

      <button-grid
        :key="folderId ?? 'root'"
        :back="folderId !== null"
        editable
        :slots="slots"
        @back="goBack"
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
  import { onMounted, ref } from 'vue'
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

  const removeOpen = ref(false)
  const removing = ref<Button | null>(null)
  // Compté à l'ouverture : la liste change dès que le serveur a supprimé, avant la fermeture du dialogue
  const removeCount = ref(0)
  const removeLoading = ref(false)
  const removeError = ref<ApiErrorMessage | null>(null)

  const snackbar = ref(false)
  const message = ref('')

  function startCreate (slot: number) {
    editing.value = null
    position.value = slot
    formOpen.value = true
  }

  function startEdit (button: Button) {
    editing.value = button
    formOpen.value = true
  }

  function startRemove (button: Button) {
    removing.value = button
    removeCount.value = countContent(store.buttons, button.id)
    removeError.value = null
    removeOpen.value = true
  }

  // Un clic sur un dossier y entre ; un clic sur une action la modifie
  function select (button: Button) {
    if (button.type === 'folder') {
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
