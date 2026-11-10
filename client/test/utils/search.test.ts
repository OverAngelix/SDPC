import type { Button } from '@/interfaces/button'
import { describe, expect, it } from 'vitest'
import { domainOf, normalizeText, searchButtons } from '@/utils/search'

let next = 0

function action (label: string, url: string, parentId: string | null = null, position = next++ % 27 + 1): Button {
  return { id: `a${next++}`, parentId, position, label, icon: 'favicon', type: 'action', url }
}

function folder (id: string, label: string, parentId: string | null = null, position = next++ % 27 + 1): Button {
  return { id, parentId, position, label, icon: 'mdi-folder', type: 'folder' }
}

/** Les libellés trouvés, dans l'ordre */
function labels (buttons: Button[], query: string, limit?: number): string[] {
  return searchButtons(buttons, query, limit).map(result => result.button.label)
}

describe('normalizeText', () => {
  it('retire la casse et les accents', () => {
    expect(normalizeText('Écran Àccentué ÇA')).toBe('ecran accentue ca')
  })
})

describe('domainOf', () => {
  it('garde le domaine sans « www. »', () => {
    expect(domainOf('https://www.youtube.com/watch?v=1')).toBe('youtube.com')
    expect(domainOf('https://mail.google.com:8080/a')).toBe('mail.google.com')
  })

  it('renvoie null pour une URL absente ou invalide', () => {
    expect(domainOf(undefined)).toBeNull()
    expect(domainOf('pas une url')).toBeNull()
    expect(domainOf('ftp://exemple.fr')).toBeNull()
  })
})

describe('searchButtons', () => {
  it('ne renvoie rien pour une saisie vide ou faite d\'espaces', () => {
    const buttons = [action('GitHub', 'https://github.com')]
    expect(searchButtons(buttons, '')).toEqual([])
    expect(searchButtons(buttons, ' '.repeat(3))).toEqual([])
  })

  it('ignore la casse', () => {
    const buttons = [action('GitHub', 'https://github.com')]
    expect(labels(buttons, 'GITHUB')).toEqual(['GitHub'])
    expect(labels(buttons, 'github')).toEqual(['GitHub'])
  })

  it('ignore les accents, dans la saisie comme dans le libellé', () => {
    const buttons = [action('Météo', 'https://meteo.fr'), action('Cafe', 'https://cafe.fr')]
    expect(labels(buttons, 'meteo')).toEqual(['Météo'])
    expect(labels(buttons, 'café')).toEqual(['Cafe'])
  })

  it('cherche aussi dans le domaine de l\'URL', () => {
    const buttons = [action('Mes vidéos', 'https://www.youtube.com/feed')]
    expect(labels(buttons, 'youtu')).toEqual(['Mes vidéos'])
  })

  it('ne cherche pas dans « www. » ni dans le chemin de l\'URL', () => {
    const buttons = [action('Docs', 'https://www.exemple.fr/agenda')]
    expect(labels(buttons, 'www')).toEqual([])
    expect(labels(buttons, 'agenda')).toEqual([])
  })

  it('classe : début du libellé, début d\'un mot, libellé qui contient, puis domaine', () => {
    const buttons = [
      action('Zzz', 'https://mail.exemple.fr'),
      action('Gmail', 'https://gmail.com'),
      action('Ma boîte mail', 'https://boite.fr'),
      action('Mail', 'https://mail.fr'),
    ]
    expect(labels(buttons, 'mail')).toEqual(['Mail', 'Ma boîte mail', 'Gmail', 'Zzz'])
  })

  it('départage par ordre alphabétique, sans tenir compte de la casse', () => {
    const buttons = [action('Outils', 'https://a.fr'), action('Orange', 'https://b.fr'), action('ours', 'https://c.fr')]
    expect(labels(buttons, 'o')).toEqual(['Orange', 'ours', 'Outils'])
  })

  it('trouve les boutons à tous les niveaux, avec le chemin de leurs dossiers', () => {
    const google = folder('google', 'Google')
    const tools = folder('tools', 'Outils', 'google')
    const translate = action('Traduction', 'https://translate.google.com', 'tools')
    const results = searchButtons([google, tools, translate], 'trad')
    expect(results).toHaveLength(1)
    expect(results[0]!.path.map(button => button.label)).toEqual(['Google', 'Outils'])
    expect(results[0]!.domain).toBe('translate.google.com')
  })

  it('trouve les dossiers, avec un chemin vide à la racine et sans domaine', () => {
    const results = searchButtons([folder('google', 'Google')], 'goo')
    expect(results).toEqual([{ button: expect.objectContaining({ id: 'google' }), path: [], domain: null }])
  })

  it('ignore les boutons qui ne s\'affichent pas : parent introuvable, emplacement réservé ou hors grille, boucle', () => {
    const lost = action('Perdu', 'https://a.fr', 'inconnu')
    const box = folder('box', 'Boîte')
    const onBack = action('Perdu retour', 'https://b.fr', 'box', 0)
    const outside = action('Perdu dehors', 'https://c.fr', null, 28)
    const loopA = folder('loopA', 'Perdu boucle A', 'loopB')
    const loopB = folder('loopB', 'Perdu boucle B', 'loopA')
    expect(labels([lost, box, onBack, outside, loopA, loopB], 'perdu')).toEqual([])
  })

  it('renvoie au plus 8 résultats, ou la limite demandée', () => {
    const buttons = Array.from({ length: 12 }, (_, index) => action(`Site ${String(index).padStart(2, '0')}`, 'https://a.fr'))
    expect(labels(buttons, 'site')).toEqual(['Site 00', 'Site 01', 'Site 02', 'Site 03', 'Site 04', 'Site 05', 'Site 06', 'Site 07'])
    expect(labels(buttons, 'site', 3)).toHaveLength(3)
  })
})
