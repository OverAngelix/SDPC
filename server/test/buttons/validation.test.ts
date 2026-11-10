import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BUTTON_COLORS, EXAMPLE_GRID, IMPORT_MAX_BUTTONS } from '../../src/buttons/constants.js'
import type { Button } from '../../src/interfaces/button.js'
import { errorTexts, text } from '../helpers/issues.js'
import { mergeButtonPatch, validateButtonInput, validateImport, validateMoveInput } from '../../src/buttons/validation.js'

const action = { position: 0, label: 'YouTube', icon: 'mdi-youtube', type: 'action', url: 'https://www.youtube.com' }
const folder = { position: 1, label: 'Musique', icon: 'mdi-folder', type: 'folder' }

function errorsOf (body: unknown): string[] {
  const result = validateButtonInput(body)
  assert.equal(result.ok, false)
  return errorTexts(result)
}

function issuesOf (body: unknown) {
  const result = validateButtonInput(body)
  return result.ok ? [] : result.errors
}

describe('validateButtonInput', () => {
  it('accepte une action valide, à la racine par défaut', () => {
    const result = validateButtonInput(action)
    assert.deepEqual(result, { ok: true, value: { parentId: null, ...action } })
  })

  it('accepte un dossier valide', () => {
    const result = validateButtonInput({ ...folder, parentId: 'abc' })
    assert.deepEqual(result, { ok: true, value: { ...folder, parentId: 'abc' } })
  })

  it('retire les espaces autour du libellé et de l\'URL', () => {
    const result = validateButtonInput({ ...action, label: '  YouTube ', url: ' https://www.youtube.com ' })
    assert.ok(result.ok)
    assert.equal(result.value.label, 'YouTube')
    assert.equal(result.value.url, 'https://www.youtube.com')
  })

  it('ignore les champs inconnus', () => {
    const result = validateButtonInput({ ...action, id: 'x', admin: true })
    assert.deepEqual(result, { ok: true, value: { parentId: null, ...action } })
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'texte', 42, []]) {
      assert.equal(validateButtonInput(body).ok, false)
    }
  })

  it('refuse un libellé vide ou trop long', () => {
    assert.match(errorsOf({ ...action, label: '   ' })[0], /^label/)
    assert.match(errorsOf({ ...action, label: 'x'.repeat(51) })[0], /^label/)
    assert.equal(validateButtonInput({ ...action, label: 'x'.repeat(50) }).ok, true)
  })

  it('refuse une icône qui n\'est pas un nom MDI', () => {
    for (const icon of ['', 'youtube', 'mdi-', 'mdi-You Tube', 'mdi-a"onload="x', 42]) {
      assert.match(errorsOf({ ...action, icon })[0], /^icon/)
    }
  })

  it('accepte l\'icône du site pour une action, la refuse pour un dossier', () => {
    assert.equal(validateButtonInput({ ...action, icon: 'favicon' }).ok, true)
    assert.deepEqual(issuesOf({ ...folder, icon: 'favicon' }).map(error => error.code), ['favicon_needs_url'])
  })

  it('refuse un type inconnu', () => {
    assert.match(errorsOf({ ...action, type: 'script' })[0], /^type/)
  })

  it('refuse un emplacement hors de 0 à 27', () => {
    for (const position of [-1, 28, 1.5, '3', null, undefined]) {
      assert.match(errorsOf({ ...action, position })[0], /^position/)
    }
    assert.equal(validateButtonInput({ ...action, position: 0 }).ok, true)
    assert.equal(validateButtonInput({ ...action, position: 27 }).ok, true)
  })

  it('réserve l\'emplacement 0 au retour dans un dossier', () => {
    assert.match(errorsOf({ ...action, position: 0, parentId: 'abc' })[0], /^position.*réservé/)
    assert.equal(validateButtonInput({ ...action, position: 1, parentId: 'abc' }).ok, true)
    // À la racine, les 28 emplacements sont utilisables
    assert.equal(validateButtonInput({ ...action, position: 0 }).ok, true)
  })

  it('exige une URL pour une action', () => {
    assert.match(errorsOf({ ...action, url: undefined })[0], /^url/)
    assert.match(errorsOf({ ...action, url: '' })[0], /^url/)
  })

  it('refuse les URL qui ne sont pas http ou https', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'ftp://exemple.fr', 'data:text/html,x', 'mailto:a@b.fr']) {
      assert.match(errorsOf({ ...action, url })[0], /^url/, url)
    }
  })

  it('refuse une URL invalide ou trop longue', () => {
    assert.match(errorsOf({ ...action, url: 'pas une url' })[0], /^url/)
    assert.match(errorsOf({ ...action, url: `https://exemple.fr/${'a'.repeat(2048)}` })[0], /^url/)
  })

  it('refuse une URL sur un dossier', () => {
    assert.match(errorsOf({ ...folder, url: 'https://exemple.fr' })[0], /^url/)
  })

  it('accepte chacune des 10 couleurs et la couleur absente', () => {
    for (const color of BUTTON_COLORS) {
      assert.deepEqual(validateButtonInput({ ...action, color }), { ok: true, value: { parentId: null, ...action, color } })
    }
    assert.equal(BUTTON_COLORS.length, 10)
    const without = validateButtonInput(action)
    assert.ok(without.ok)
    assert.equal('color' in without.value, false)
    const nul = validateButtonInput({ ...action, color: null })
    assert.ok(nul.ok)
    assert.equal('color' in nul.value, false)
  })

  it('refuse une couleur hors de la palette', () => {
    for (const color of ['', 'rouge', 'Red', '#ff0000', 'red; x', 42, {}]) {
      assert.match(errorsOf({ ...action, color })[0], /^color/)
    }
  })

  it('refuse un parentId invalide', () => {
    assert.match(errorsOf({ ...action, parentId: 12 })[0], /^parentId/)
    assert.match(errorsOf({ ...action, parentId: '' })[0], /^parentId/)
  })

  it('donne à chaque erreur un code et ses paramètres pour le client', () => {
    const codeOf = (body: unknown) => issuesOf(body)[0]
    assert.deepEqual(codeOf({ ...action, label: '   ' }), { field: 'label', code: 'required', message: 'texte non vide requis' })
    assert.deepEqual(codeOf({ ...action, label: 'x'.repeat(51) })?.params, { max: 50 })
    assert.equal(codeOf({ ...action, icon: 'youtube' })?.code, 'invalid_icon')
    assert.equal(codeOf({ ...action, type: 'script' })?.code, 'invalid_choice')
    assert.deepEqual(codeOf({ ...action, type: 'script' })?.params, { values: 'action, folder' })
    assert.deepEqual(codeOf({ ...action, color: 'noir' })?.code, 'invalid_choice')
    assert.deepEqual(codeOf({ ...action, position: 99 })?.params, { min: 0, max: 27 })
    assert.equal(codeOf({ ...action, parentId: 12 })?.code, 'invalid_parent')
    assert.equal(codeOf({ ...action, position: 0, parentId: 'abc' })?.code, 'reserved_slot')
    assert.equal(codeOf({ ...action, url: '' })?.code, 'required')
    assert.equal(codeOf({ ...action, url: 'ftp://exemple.fr' })?.code, 'url_scheme')
    assert.equal(codeOf({ ...action, url: 'pas une url' })?.code, 'invalid_url')
    assert.deepEqual(codeOf({ ...action, url: `https://exemple.fr/${'a'.repeat(2048)}` })?.params, { max: 2048 })
    assert.equal(codeOf({ ...folder, url: 'https://exemple.fr' })?.code, 'url_forbidden')
    assert.equal(codeOf('texte')?.code, 'body_not_object')
    assert.equal(text(issuesOf('texte')[0]!), 'Le corps de la requête doit être un objet JSON')
  })

  it('cumule les erreurs', () => {
    // libellé, icône, emplacement et URL (absente sur une action) ; parentId vaut null par défaut
    const errors = errorsOf({ label: '', icon: 'x', type: 'action', position: 99 })
    assert.deepEqual(errors.map(error => error.split(' ')[0]).sort(), ['icon', 'label', 'position', 'url'])
  })
})

describe('mergeButtonPatch', () => {
  const current: Button = { id: 'a', parentId: null, ...action, type: 'action' }

  it('applique les champs fournis et garde les autres', () => {
    const result = mergeButtonPatch(current, { label: 'YT', position: 4 })
    assert.deepEqual(result, { ok: true, value: { parentId: null, ...action, label: 'YT', position: 4 } })
  })

  it('change la couleur, la garde quand le patch n\'en parle pas, refuse une couleur inconnue', () => {
    const red: Button = { ...current, color: 'red' }
    const recolored = mergeButtonPatch(red, { color: 'blue' })
    assert.ok(recolored.ok)
    assert.equal(recolored.value.color, 'blue')
    const kept = mergeButtonPatch(red, { label: 'YT' })
    assert.ok(kept.ok)
    assert.equal(kept.value.color, 'red')
    assert.equal(mergeButtonPatch(red, { color: 'rouge' }).ok, false)
  })

  it('passe en icône du site, refuse de faire un dossier d\'une action qui l\'utilise', () => {
    const favicon = mergeButtonPatch(current, { icon: 'favicon' })
    assert.ok(favicon.ok)
    assert.equal(favicon.value.icon, 'favicon')
    const withFavicon: Button = { ...current, icon: 'favicon' }
    const result = mergeButtonPatch(withFavicon, { type: 'folder' })
    assert.equal(result.ok, false)
    assert.equal(!result.ok && result.errors[0]?.code, 'favicon_needs_url')
    assert.equal(mergeButtonPatch(withFavicon, { type: 'folder', icon: 'mdi-folder' }).ok, true)
  })

  it('accepte un patch vide', () => {
    const result = mergeButtonPatch(current, {})
    assert.deepEqual(result, { ok: true, value: { parentId: null, ...action } })
  })

  it('valide le résultat complet', () => {
    const result = mergeButtonPatch(current, { url: 'javascript:alert(1)' })
    assert.equal(result.ok, false)
  })

  it('retire l\'URL quand une action devient un dossier', () => {
    const result = mergeButtonPatch(current, { type: 'folder' })
    assert.ok(result.ok)
    assert.equal(result.value.type, 'folder')
    assert.equal('url' in result.value, false)
  })

  it('exige une URL quand un dossier devient une action', () => {
    const asFolder: Button = { id: 'b', parentId: null, ...folder, type: 'folder' }
    assert.equal(mergeButtonPatch(asFolder, { type: 'action' }).ok, false)
    assert.equal(mergeButtonPatch(asFolder, { type: 'action', url: 'https://exemple.fr' }).ok, true)
  })

  it('refuse de changer de dossier parent', () => {
    assert.equal(mergeButtonPatch(current, { parentId: 'autre' }).ok, false)
    assert.equal(mergeButtonPatch(current, { parentId: null }).ok, true)
  })

  it('refuse de déplacer un bouton de dossier sur l\'emplacement 0', () => {
    const inFolder: Button = { ...current, parentId: 'abc', position: 3 }
    assert.equal(mergeButtonPatch(inFolder, { position: 0 }).ok, false)
    assert.equal(mergeButtonPatch(inFolder, { position: 1 }).ok, true)
    assert.equal(mergeButtonPatch(current, { position: 0 }).ok, true)
  })

  it('ignore id et champs inconnus', () => {
    const result = mergeButtonPatch(current, { id: 'pirate', admin: true })
    assert.deepEqual(result, { ok: true, value: { parentId: null, ...action } })
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    assert.equal(mergeButtonPatch(current, 'texte').ok, false)
  })
})

describe('validateMoveInput', () => {
  it('accepte un emplacement de 0 à 27 à la racine', () => {
    assert.deepEqual(validateMoveInput(null, { position: 0 }), { ok: true, value: 0 })
    assert.deepEqual(validateMoveInput(null, { position: 27 }), { ok: true, value: 27 })
  })

  it('accepte un emplacement de 1 à 27 dans un dossier', () => {
    assert.deepEqual(validateMoveInput('abc', { position: 1 }), { ok: true, value: 1 })
  })

  it('refuse l\'emplacement 0 dans un dossier : il est réservé au retour', () => {
    const result = validateMoveInput('abc', { position: 0 })
    assert.equal(result.ok, false)
    assert.match(errorTexts(result)[0] ?? '', /réservé/)
  })

  it('refuse un emplacement absent, hors grille ou qui n\'est pas un entier', () => {
    for (const body of [{}, { position: -1 }, { position: 28 }, { position: 1.5 }, { position: '3' }, { position: null }]) {
      assert.equal(validateMoveInput(null, body).ok, false, JSON.stringify(body))
    }
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'texte', 3, []]) {
      assert.equal(validateMoveInput(null, body).ok, false)
    }
  })
})

describe('validateImport', () => {
  const games = { ...folder, id: 'games', parentId: null }
  const mario = { ...action, id: 'mario', parentId: 'games', position: 1 }
  const mail = { ...action, id: 'mail', parentId: null, position: 2 }

  function importIssues (body: unknown) {
    const result = validateImport(body)
    assert.equal(result.ok, false)
    return result.ok ? [] : result.errors.map(({ field, code }) => ({ field, code }))
  }

  it('accepte une grille avec dossiers imbriqués et place chaque dossier avant son contenu', () => {
    const result = validateImport({ buttons: [mario, mail, games] })
    assert.ok(result.ok)
    assert.deepEqual(result.value.map(button => button.id), ['mail', 'games', 'mario'])
  })

  it('accepte une grille vide', () => {
    assert.deepEqual(validateImport({ buttons: [] }), { ok: true, value: [] })
  })

  it('accepte la grille d\'exemple telle quelle', () => {
    const result = validateImport({ buttons: EXAMPLE_GRID })
    assert.ok(result.ok)
    assert.deepEqual(result.value, EXAMPLE_GRID)
  })

  it('refuse un corps sans liste de boutons ou une liste trop longue', () => {
    assert.deepEqual(importIssues([]), [{ field: undefined, code: 'body_not_object' }])
    assert.deepEqual(importIssues({ buttons: 'x' }), [{ field: 'buttons', code: 'array_expected' }])
    const many = Array.from({ length: IMPORT_MAX_BUTTONS + 1 }, (_, index) => ({ ...action, id: `b${index}` }))
    assert.deepEqual(importIssues({ buttons: many }), [{ field: 'buttons', code: 'too_many_buttons' }])
  })

  it('situe chaque problème sur son bouton', () => {
    assert.deepEqual(importIssues({ buttons: [mail, { ...action, label: '' }] }), [
      { field: 'buttons[1].id', code: 'required' },
      { field: 'buttons[1].label', code: 'required' },
    ])
    assert.deepEqual(importIssues({ buttons: ['x'] }), [
      { field: 'buttons[0].id', code: 'required' },
      { field: 'buttons[0]', code: 'body_not_object' },
    ])
  })

  it('refuse un identifiant en double et un emplacement partagé', () => {
    assert.deepEqual(importIssues({ buttons: [mail, { ...mail, position: 3 }] }), [{ field: 'buttons[1].id', code: 'duplicate_id' }])
    assert.deepEqual(importIssues({ buttons: [mail, { ...mail, id: 'other' }] }), [{ field: 'buttons[1].position', code: 'slot_taken' }])
  })

  it('refuse un parent inconnu ou qui n\'est pas un dossier', () => {
    assert.deepEqual(importIssues({ buttons: [mario] }), [{ field: 'buttons[0].parentId', code: 'parent_not_found' }])
    assert.deepEqual(importIssues({ buttons: [mail, { ...mario, parentId: 'mail' }] }), [{ field: 'buttons[1].parentId', code: 'parent_not_found' }])
  })

  it('refuse des dossiers qui se contiennent l\'un l\'autre', () => {
    const a = { ...folder, id: 'a', parentId: 'b' }
    const b = { ...folder, id: 'b', parentId: 'a' }
    assert.deepEqual(importIssues({ buttons: [mail, a, b] }), [{ field: 'buttons', code: 'folder_cycle' }])
  })
})
