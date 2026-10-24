import type { SoundName, Tone } from '@/interfaces/sound'

// Aucun fichier audio : chaque son est une suite de notes synthétisées avec Web Audio.
// Volumes bas : la grille se manipule longtemps, les sons ne doivent pas fatiguer.
export const SOUNDS: Record<SoundName, readonly Tone[]> = {
  launch: [
    { frequency: 520, start: 0, duration: 0.09, type: 'triangle', volume: 0.16 },
    { frequency: 780, start: 0.07, duration: 0.14, type: 'triangle', volume: 0.16 },
  ],
  open: [{ frequency: 330, slideTo: 620, start: 0, duration: 0.14, type: 'sine', volume: 0.18 }],
  back: [{ frequency: 620, slideTo: 330, start: 0, duration: 0.14, type: 'sine', volume: 0.18 }],
  create: [
    { frequency: 523, start: 0, duration: 0.09, type: 'sine', volume: 0.16 },
    { frequency: 659, start: 0.08, duration: 0.09, type: 'sine', volume: 0.16 },
    { frequency: 784, start: 0.16, duration: 0.16, type: 'sine', volume: 0.16 },
  ],
  move: [{ frequency: 440, slideTo: 540, start: 0, duration: 0.08, type: 'triangle', volume: 0.14 }],
  delete: [{ frequency: 400, slideTo: 140, start: 0, duration: 0.22, type: 'sawtooth', volume: 0.1 }],
  refuse: [
    { frequency: 200, start: 0, duration: 0.09, type: 'square', volume: 0.08 },
    { frequency: 160, start: 0.1, duration: 0.14, type: 'square', volume: 0.08 },
  ],
}

// Silence de départ et d'arrivée des enveloppes : une rampe exponentielle ne peut pas viser 0
const SILENCE = 0.0001
// Montée rapide pour éviter le « clic » d'un son qui démarre à pleine puissance
const ATTACK = 0.01

/** Programme les notes d'un son sur le contexte audio, à partir de l'instant `at`. */
export function scheduleTones (context: AudioContext, tones: readonly Tone[], at = context.currentTime) {
  for (const tone of tones) {
    const begin = at + tone.start
    const end = begin + tone.duration

    const oscillator = context.createOscillator()
    oscillator.type = tone.type
    oscillator.frequency.setValueAtTime(tone.frequency, begin)
    if (tone.slideTo !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, end)
    }

    const gain = context.createGain()
    gain.gain.setValueAtTime(SILENCE, begin)
    gain.gain.exponentialRampToValueAtTime(tone.volume, begin + Math.min(ATTACK, tone.duration / 2))
    gain.gain.exponentialRampToValueAtTime(SILENCE, end)

    oscillator.connect(gain).connect(context.destination)
    oscillator.start(begin)
    oscillator.stop(end + 0.02)
  }
}

let context: AudioContext | null = null

// Créé à la première lecture, donc pendant un geste de l'utilisateur : les navigateurs interdisent
// de démarrer l'audio autrement. Null quand le navigateur ne sait pas synthétiser.
function getContext (): AudioContext | null {
  if (context) {
    return context
  }
  const Constructor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Constructor) {
    return null
  }
  context = new Constructor()
  return context
}

/** Joue un son. Ne lève jamais d'erreur : un son qui échoue ne doit pas gêner le geste qu'il accompagne. */
export function playSound (name: SoundName) {
  try {
    const audio = getContext()
    if (!audio) {
      return
    }
    // Un contexte créé hors geste, ou resté en veille, doit être relancé
    if (audio.state === 'suspended') {
      void audio.resume().catch(() => {})
    }
    scheduleTones(audio, SOUNDS[name])
  } catch {
    // Audio indisponible : tant pis pour le son
  }
}
