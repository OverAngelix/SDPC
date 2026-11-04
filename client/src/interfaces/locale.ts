import type fr from '@/locales/fr'

/** Une langue de l'application */
export type Locale = 'fr' | 'en'

/** Le choix de la personne : une langue, ou `system` pour suivre celle de l'appareil */
export type LocaleSetting = Locale | 'system'

/** La forme des textes d'une langue : celle du français, que l'anglais doit reproduire à l'identique */
export type Messages = typeof fr
