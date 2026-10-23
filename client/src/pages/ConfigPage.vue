<template>
  <v-container>
    <grid-status :home="{ name: 'config' }" :path="path">
      <p class="text-medium-emphasis text-center mb-4">
        Un emplacement vide permet de créer un bouton, un dossier de configurer son contenu.
        Glissez un bouton sur un autre emplacement pour le déplacer : s'il est occupé, les deux boutons échangent leur place.
      </p>

      <button-grid
        :back="folderId !== null"
        editable
        :slots="slots"
        @back="goBack"
        @create="startCreate"
        @edit="startEdit"
        @move="move"
        @remove="startRemove"
        @select="select"
      />
    </grid-status>

    <button-form
      v-model="formOpen"
      :button="editing"
      :parent-id="folderId"
      :position="position"
      @saved="notify"
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
  import { describeApiError } from '@/utils/apiError'

  const store = useButtonsStore()
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

  async function move (button: Button, slot: number) {
    try {
      await store.move(button.id, slot)
    } catch (error) {
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
      notify('Bouton supprimé.')
    } catch (error) {
      removeError.value = describeApiError(error)
    } finally {
      removeLoading.value = false
    }
  }

  function notify (text: string) {
    message.value = text
    snackbar.value = true
  }

  // Recharge à chaque ouverture de l'onglet : un autre onglet a pu modifier la configuration
  onMounted(() => store.load())
</script>
