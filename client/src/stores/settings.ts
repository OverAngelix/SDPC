import type { ApiErrorMessage } from '@/interfaces/api'
import type { Settings } from '@/interfaces/settings'
import type { SoundName } from '@/interfaces/sound'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { fetchSettings, updateSettings } from '@/api/settings'
import { setLocale } from '@/plugins/i18n'
import { useGuestStore } from '@/stores/guest'
import { describeApiError } from '@/utils/apiError'
import { readGuestSettings, writeGuestSettings } from '@/utils/guestStorage'
import { resolveLocale } from '@/utils/locale'
import { playSound } from '@/utils/sounds'

/** Valeurs avant connexion et pour un compte qui n'a rien enregistré (les mêmes que celles du serveur) */
export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: 100,
  effectsEnabled: true,
  theme: 'system',
  locale: 'system',
}

/** Réglages de l'application : ceux du compte connecté, communs à tous ses appareils, ou ceux de l'invité, dans le navigateur. */
export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(DEFAULT_SETTINGS.soundEnabled)
  const volume = ref(DEFAULT_SETTINGS.volume)
  const effectsEnabled = ref(DEFAULT_SETTINGS.effectsEnabled)
  const theme = ref(DEFAULT_SETTINGS.theme)
  const locale = ref(DEFAULT_SETTINGS.locale)
  // Dernier échec d'enregistrement, pour que la fenêtre des réglages l'affiche
  const error = ref<ApiErrorMessage | null>(null)

  function current (): Settings {
    return { soundEnabled: soundEnabled.value, volume: volume.value, effectsEnabled: effectsEnabled.value, theme: theme.value, locale: locale.value }
  }

  function apply (settings: Partial<Settings>) {
    if (settings.soundEnabled !== undefined) {
      soundEnabled.value = settings.soundEnabled
    }
    if (settings.volume !== undefined) {
      volume.value = settings.volume
    }
    if (settings.effectsEnabled !== undefined) {
      effectsEnabled.value = settings.effectsEnabled
    }
    if (settings.theme !== undefined) {
      theme.value = settings.theme
    }
    if (settings.locale !== undefined) {
      locale.value = settings.locale
    }
  }

  // La langue des textes suit le réglage tout de suite (chargement, changement, retour arrière, déconnexion)
  watch(locale, value => setLocale(resolveLocale(value)), { immediate: true, flush: 'sync' })

  /** Reprend les réglages du compte connecté, ou ceux de l'invité. */
  async function load () {
    if (useGuestStore().active) {
      apply({ ...DEFAULT_SETTINGS, ...readGuestSettings() })
      return
    }
    apply(await fetchSettings())
  }

  /** Déconnexion : retour aux valeurs par défaut. */
  function reset () {
    apply(DEFAULT_SETTINGS)
    error.value = null
  }

  /**
   * Applique un changement tout de suite, puis l'enregistre. Si le serveur le refuse ou ne répond pas,
   * la valeur précédente revient et `error` l'explique. Renvoie vrai si c'est enregistré.
   */
  async function change (patch: Partial<Settings>): Promise<boolean> {
    const before = current()
    const previous = Object.fromEntries(Object.keys(patch).map(key => [key, before[key as keyof Settings]])) as Partial<Settings>
    error.value = null
    apply(patch)
    if (useGuestStore().active) {
      writeGuestSettings(current())
      return true
    }
    try {
      await updateSettings(patch)
      return true
    } catch (error_) {
      apply(previous)
      error.value = describeApiError(error_)
      return false
    }
  }

  /** Joue le son d'un geste, sauf si le son est coupé, au volume choisi. */
  function play (name: SoundName) {
    if (soundEnabled.value) {
      playSound(name, volume.value / 100)
    }
  }

  return { soundEnabled, volume, effectsEnabled, theme, locale, error, load, reset, change, play }
})
