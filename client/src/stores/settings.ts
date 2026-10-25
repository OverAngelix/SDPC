import type { ApiErrorMessage } from '@/interfaces/api'
import type { Settings } from '@/interfaces/settings'
import type { SoundName } from '@/interfaces/sound'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSettings, updateSettings } from '@/api/settings'
import { describeApiError } from '@/utils/apiError'
import { playSound } from '@/utils/sounds'

/** Valeurs avant connexion et pour un compte qui n'a rien enregistré (les mêmes que celles du serveur) */
export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: 100,
  effectsEnabled: true,
  theme: 'system',
}

/** Réglages de l'application : ceux du compte connecté, communs à tous ses appareils. */
export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(DEFAULT_SETTINGS.soundEnabled)
  const volume = ref(DEFAULT_SETTINGS.volume)
  const effectsEnabled = ref(DEFAULT_SETTINGS.effectsEnabled)
  const theme = ref(DEFAULT_SETTINGS.theme)
  // Dernier échec d'enregistrement, pour que la fenêtre des réglages l'affiche
  const error = ref<ApiErrorMessage | null>(null)

  function current (): Settings {
    return { soundEnabled: soundEnabled.value, volume: volume.value, effectsEnabled: effectsEnabled.value, theme: theme.value }
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
  }

  /** Reprend les réglages du compte connecté. */
  async function load () {
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

  return { soundEnabled, volume, effectsEnabled, theme, error, load, reset, change, play }
})
