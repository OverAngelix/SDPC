<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="720"
    :persistent="saving"
  >
    <v-form :class="{ 'h-100': xs }" novalidate @submit.prevent="submit">
      <v-card
        class="form-card d-flex flex-column"
        :class="{ 'h-100 form-card-full': xs }"
        :title="button ? t('buttonForm.editTitle') : t('buttonForm.newTitle')"
      >
        <!-- Seul le contenu défile : les boutons du bas restent toujours visibles -->
        <v-card-text class="flex-grow-1 overflow-y-auto">
          <v-btn-toggle
            v-model="values.type"
            class="mb-4"
            color="primary"
            divided
            mandatory
          >
            <v-btn prepend-icon="mdi-open-in-new" :text="t('buttonForm.typeAction')" value="action" />
            <v-btn prepend-icon="mdi-folder" :text="t('buttonForm.typeFolder')" value="folder" />
          </v-btn-toggle>

          <v-text-field
            v-model="values.label"
            autofocus
            :error-messages="shown.label"
            :hide-details="!shown.label"
            :label="t('buttonForm.label')"
            :maxlength="LABEL_MAX_LENGTH"
          />

          <!-- Un dossier n'a pas d'URL : le champ garde sa place, invisible, pour que le dialogue ne change pas de taille -->
          <v-text-field
            v-model="values.url"
            class="mt-4"
            :class="{ 'url-hidden': values.type !== 'action' }"
            :disabled="values.type !== 'action'"
            :error-messages="shown.url"
            :hide-details="!shown.url"
            :label="t('buttonForm.url')"
            placeholder="https://"
            type="url"
          />

          <v-row class="mt-4">
            <!-- La case telle qu'elle sera dans la grille : simple aperçu, ni cliquable ni lue deux fois.
                 Téléphone : en dessous des choix, comme leur résultat -->
            <v-col class="d-flex justify-center order-last order-sm-first" cols="12" sm="auto">
              <div class="preview" inert>
                <button-tile :button="preview" />
              </div>
            </v-col>

            <v-col class="d-flex flex-column ga-4" cols="12" sm>
              <icon-picker
                v-model="values.icon"
                :error-messages="shown.icon"
                :favicon="values.type === 'action'"
                :url="values.url"
              />

              <color-picker v-model="values.color" />
            </v-col>
          </v-row>

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
            :text="t('buttonForm.move')"
            @click="emit('move', button)"
          />

          <v-spacer />
          <v-btn :disabled="saving" :text="t('common.cancel')" @click="open = false" />

          <v-btn
            color="primary"
            :loading="saving"
            :text="t('buttonForm.save')"
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
  import type { Button } from '@/interfaces/button'
  import type { ButtonFormValues } from '@/interfaces/buttonForm'
  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import ButtonTile from '@/components/ButtonTile.vue'
  import ColorPicker from '@/components/ColorPicker.vue'
  import IconPicker from '@/components/IconPicker.vue'
  import { useButtonsStore } from '@/stores/buttons'
  import { describeApiError } from '@/utils/apiError'
  import { iconAfterTypeChange, LABEL_MAX_LENGTH, toButtonInput, toButtonPatch, validateButtonForm } from '@/utils/buttonForm'
  import { colorOf, DEFAULT_COLOR } from '@/utils/colors'
  import { DEFAULT_ICONS } from '@/utils/constants'

  // Téléphone : le formulaire occupe tout l'écran, ses champs défilent au-dessus du clavier
  const { xs } = useDisplay()
  const { t } = useI18n()

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

  const store = useButtonsStore()

  const values = reactive<ButtonFormValues>({ type: 'action', label: '', icon: DEFAULT_ICONS.action, color: DEFAULT_COLOR, url: '' })
  const saving = ref(false)
  // Les erreurs de saisie n'apparaissent qu'après une première tentative d'envoi
  const submitted = ref(false)
  const serverError = ref<ApiErrorMessage | null>(null)

  // Le bouton tel qu'il sera enregistré, pour l'aperçu
  const preview = computed<Button>(() => ({
    id: props.button?.id ?? '',
    parentId: props.parentId,
    position: props.position,
    type: values.type,
    label: values.label.trim(),
    icon: values.icon,
    color: values.color,
    url: values.url.trim(),
  }))

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
    values.icon = iconAfterTypeChange(values.icon, previous, type)
  })

  async function submit () {
    submitted.value = true
    serverError.value = null
    if (Object.keys(errors.value).length > 0) return

    saving.value = true
    try {
      await (props.button ? store.update(props.button.id, toButtonPatch(values)) : store.create(toButtonInput(values, props.parentId, props.position)))
      emit('saved', props.button ? t('buttonForm.updated') : t('buttonForm.created'))
      open.value = false
    } catch (error) {
      // 400 et 409 : le serveur reste l'autorité, son message s'affiche dans le formulaire
      serverError.value = describeApiError(error)
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
  .form-card {
    /* Le dialogue ne dépasse jamais la fenêtre (dvh : la barre d'adresse mobile ne la fausse pas) */
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
  }

  /* Assez grande pour que l'icône et le libellé se lisent comme dans la grille */
  .preview {
    width: 132px;
  }

  .url-hidden {
    visibility: hidden;
  }

  .form-card-full {
    max-height: none;
  }
</style>
