/** Un geste de l'utilisateur qui s'accompagne d'un son */
export type SoundName = 'launch' | 'open' | 'back' | 'create' | 'move' | 'delete' | 'refuse'

/** Une note synthétisée : un oscillateur à enveloppe courte */
export interface Tone {
  /** Fréquence de départ, en Hz */
  frequency: number
  /** Fréquence d'arrivée en Hz : la note glisse de l'une à l'autre pendant sa durée */
  slideTo?: number
  /** Début, en secondes après le déclenchement du son */
  start: number
  /** Durée, en secondes */
  duration: number
  type: OscillatorType
  /** Volume de crête, de 0 à 1 */
  volume: number
}
