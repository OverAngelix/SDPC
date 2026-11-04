import { describe, expect, it } from 'vitest'
import { messages } from '@/locales'
import { LOCALES } from '@/locales/constants'

type Tree = { [key: string]: string | Tree }

/** Toutes les feuilles d'un arbre de textes, avec leur chemin (`menu.grid`). */
function flatten (tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return typeof value === 'string' ? { ...flat, [path]: value } : { ...flat, ...flatten(value, path) }
  }, {})
}

const flat = Object.fromEntries(LOCALES.map(locale => [locale, flatten(messages[locale] as Tree)]))
const reference = flat.fr

/** Les paramètres `{nom}` d'un texte, sans doublon ni ordre. */
function parameters (text: string): Set<string> {
  return new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]!))
}

// Le fichier des codes du serveur, lu comme du texte : les deux dossiers restent indépendants, sans importer de code de l'autre
const serverConstants = import.meta.glob<string>('../../../server/src/constants.ts', { query: '?raw', import: 'default', eager: true })

/** Les codes d'un tableau `as const` du serveur (`server/src/constants.ts`), lus dans le fichier : les deux dossiers restent indépendants. */
function serverCodes (name: 'ERROR_CODES' | 'ISSUE_CODES'): string[] {
  const source = Object.values(serverConstants)[0] ?? ''
  const body = new RegExp(String.raw`export const ${name} = \[([^\]]*)\]`).exec(source)?.[1]
  expect(body, `${name} introuvable dans server/src/constants.ts`).toBeDefined()
  return [...body!.matchAll(/'(\w+)'/g)].map(match => match[1]!)
}

describe('fichiers de langue', () => {
  it('toutes les langues ont exactement les mêmes clés', () => {
    for (const locale of LOCALES) {
      expect(new Set(Object.keys(flat[locale]!)), locale).toEqual(new Set(Object.keys(reference!)))
    }
  })

  it('aucun texte n\'est vide', () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(flat[locale]!)) {
        expect(text.trim(), `${locale} ${key}`).not.toBe('')
      }
    }
  })

  it('chaque texte a les mêmes paramètres et le même nombre de formes (pluriel) dans toutes les langues', () => {
    for (const [key, text] of Object.entries(reference!)) {
      for (const locale of LOCALES) {
        const other = flat[locale]![key]!
        expect(parameters(other), `${locale} ${key}`).toEqual(parameters(text))
        expect(other.split(' | ').length, `${locale} ${key} (formes)`).toBe(text.split(' | ').length)
      }
    }
  })

  it('les noms des langues s\'écrivent dans leur langue, pareils partout', () => {
    for (const locale of LOCALES) {
      expect(messages[locale].languages).toEqual({ fr: 'Français', en: 'English' })
    }
  })
})

describe('erreurs du serveur', () => {
  // Les textes que le client écrit lui-même, sans code venu du serveur
  const OWN = new Set(['unreachable', 'unexpected', 'serverStatus', 'field'])

  it('chaque code d\'erreur du serveur a un texte dans toutes les langues', () => {
    for (const locale of LOCALES) {
      for (const code of serverCodes('ERROR_CODES')) {
        expect(flat[locale]![`errors.${code}`], `${locale} errors.${code}`).toBeDefined()
      }
    }
  })

  it('chaque code de problème du serveur a un texte dans toutes les langues', () => {
    for (const locale of LOCALES) {
      for (const code of serverCodes('ISSUE_CODES')) {
        expect(flat[locale]![`issues.${code}`], `${locale} issues.${code}`).toBeDefined()
      }
    }
  })

  it('aucun texte d\'erreur ne reste pour un code que le serveur n\'envoie plus', () => {
    const errors = serverCodes('ERROR_CODES')
    const issues = serverCodes('ISSUE_CODES')
    for (const key of Object.keys(reference!)) {
      if (key.startsWith('errors.') && !OWN.has(key.slice('errors.'.length))) {
        expect(errors, key).toContain(key.slice('errors.'.length))
      }
      if (key.startsWith('issues.')) {
        expect(issues, key).toContain(key.slice('issues.'.length))
      }
    }
  })
})
