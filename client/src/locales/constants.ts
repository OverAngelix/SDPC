import type { Locale } from '@/interfaces/locale'

export const LOCALES = ['fr', 'en'] as const satisfies readonly Locale[]

/** Langue de repli : celle d'un appareil dont la langue n'est pas connue, et d'un texte manquant */
export const DEFAULT_LOCALE: Locale = 'fr'
