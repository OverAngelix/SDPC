<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="560"
    :persistent="saving"
  >
    <v-form :class="{ 'h-100': xs }" novalidate @submit.prevent="submit">
      <v-card :class="{ 'h-100 d-flex flex-column': xs }" :title="button ? 'Modifier le bouton' : 'Nouveau bouton'">
        <v-card-text :class="{ 'flex-grow-1 overflow-y-auto': xs }">
          <v-btn-toggle
            v-model="values.type"
            class="mb-4"
            color="primary"
            divided
            mandatory
          >
            <v-btn prepend-icon="mdi-open-in-new" text="Action" value="action" />
            <v-btn prepend-icon="mdi-folder" text="Dossier" value="folder" />
          </v-btn-toggle>

          <v-text-field
            v-model="values.label"
            autofocus
            :counter="LABEL_MAX_LENGTH"
            :error-messages="shown.label"
            label="Libellé"
          />

          <icon-picker v-model="values.icon" :error-messages="shown.icon" />

          <color-picker v-model="values.color" class="mt-4" />

          <v-text-field
            v-if="values.type === 'action'"
            v-model="values.url"
            class="mt-4"
            :error-messages="shown.url"
            label="URL"
            placeholder="https://"
            type="url"
          />

          <v-alert
            v-if="serverError"
            class="mt-4"
            density="compact"
            type="error"
            variant="tonal"
          >
            {{ serverError.title }}
            <ul v-if="serverError.details.length > 0" class="ml-4">
              <li v-for="detail in serverError.details" :key="detail">{{ detail }}</li>
            </ul>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-btn
            v-if="button"
            :disabled="saving"
            prepend-icon="mdi-cursor-move"
            text="Déplacer"
            @click="emit('move', button)"
          />

          <v-spacer />
          <v-btn :disabled="saving" text="Annuler" @click="open = false" />

          <v-btn
            color="primary"
            :loading="saving"
            text="Enregistrer"
            type="submit"
            variant="flat"
          />
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ApiErrorMessage } from '@/interfaces/api'
  import type { Button, ButtonType } from '@/interfaces/button'
  import type { ButtonFormValues } from '@/interfaces/buttonForm'
  import { computed, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import ColorPicker from '@/components/ColorPicker.vue'
  import IconPicker from '@/components/IconPicker.vue'
  import { useButtonsStore } from '@/stores/buttons'
  import { describeApiError } from '@/utils/apiError'
  import { LABEL_MAX_LENGTH, toButtonInput, toButtonPatch, validateButtonForm } from '@/utils/buttonForm'
  import { colorOf, DEFAULT_COLOR } from '@/utils/colors'

  // Téléphone : le formulaire occupe tout l'écran, ses champs défilent au-dessus du clavier
  const { xs } = useDisplay()

  // Dialogue ouvert ou fermé
  const open = defineModel<boolean>({ required: true })

  const props = defineProps<{
    /** Le bouton à modifier ; null pour en créer un */
    button: Button | null
    /** Création : le dossier qui reçoit le bouton (null : la racine) */
    parentId: string | null
    /** Création : l'emplacement choisi */
    position: number
  }>()

  const emit = defineEmits<{
    /** Le serveur a enregistré le bouton ; le message est à afficher à l'utilisateur */
    saved: [message: string]
    /** L'utilisateur veut déplacer le bouton modifié : le dialogue est à fermer, la destination se choisit ensuite dans la grille */
    move: [button: Button]
  }>()

  // Icône proposée par défaut, tant que l'utilisateur n'en a pas choisi une autre
  const DEFAULT_ICONS: Record<ButtonType, string> = { action: 'mdi-web', folder: 'mdi-folder' }

  const store = useButtonsStore()

  const values = reactive<ButtonFormValues>({ type: 'action', label: '', icon: DEFAULT_ICONS.action, color: DEFAULT_COLOR, url: '' })
  const saving = ref(false)
  // Les erreurs de saisie n'apparaissent qu'après une première tentative d'envoi
  const submitted = ref(false)
  const serverError = ref<ApiErrorMessage | null>(null)

  const errors = computed(() => validateButtonForm(values))
  const shown = computed(() => submitted.value ? errors.value : {})

  // Repart d'un formulaire neuf à chaque ouverture
  watch(open, isOpen => {
    if (!isOpen) return
    Object.assign(values, props.button
      ? { type: props.button.type, label: props.button.label, icon: props.button.icon, color: colorOf(props.button), url: props.button.url ?? '' }
      : { type: 'action', label: '', icon: DEFAULT_ICONS.action, color: DEFAULT_COLOR, url: '' })
    submitted.value = false
    serverError.value = null
  })

  watch(() => values.type, (type, previous) => {
    if (values.icon === DEFAULT_ICONS[previous]) values.icon = DEFAULT_ICONS[type]
  })

  async function submit () {
    submitted.value = true
    serverError.value = null
    if (Object.keys(errors.value).length > 0) return

    saving.value = true
    try {
      await (props.button ? store.update(props.button.id, toButtonPatch(values)) : store.create(toButtonInput(values, props.parentId, props.position)))
      emit('saved', props.button ? 'Bouton modifié.' : 'Bouton créé.')
      open.value = false
    } catch (error) {
      // 400 et 409 : le serveur reste l'autorité, son message s'affiche dans le formulaire
      serverError.value = describeApiError(error)
    } finally {
      saving.value = false
    }
  }
</script>
