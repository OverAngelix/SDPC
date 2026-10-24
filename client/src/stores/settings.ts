import type { SoundName } from '@/interfaces/sound'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { playSound } from '@/utils/sounds'

export const SOUND_STORAGE_KEY = 'sdpc.sound'

// Le stockage du navigateur peut être absent ou refusé (navigation privée) : le son reste alors activé
function readSoundPreference (): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function writeSoundPreference (enabled: boolean) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // La préférence ne sera pas mémorisée, elle vaut pour la session
  }
}

/** Préférences de l'appareil (pas de compte : le serveur n'en sait rien). */
export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(readSoundPreference())

  function toggleSound () {
    soundEnabled.value = !soundEnabled.value
    writeSoundPreference(soundEnabled.value)
  }

  /** Joue le son d'un geste, sauf si l'utilisateur l'a coupé. */
  function play (name: SoundName) {
    if (soundEnabled.value) {
      playSound(name)
    }
  }

  return { soundEnabled, toggleSound, play }
})
