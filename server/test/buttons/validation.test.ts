import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Button } from '../../src/buttons/types.js'
import { BUTTON_COLORS } from '../../src/buttons/types.js'
import { mergeButtonPatch, validateButtonInput, validateMoveInput } from '../../src/buttons/validation.js'

const action = { position: 0, label: 'YouTube', icon: 'mdi-youtube', type: 'action', url: 'https://www.youtube.com' }
const folder = { position: 1, label: 'Musique', icon: 'mdi-folder', type: 'folder' }

function errorsOf (body: unknown): string[] {
  const result = validateButtonInput(body)
  assert.equal(result.ok, false)
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

  it('refuse un type inconnu', () => {
    assert.match(errorsOf({ ...action, type: 'script' })[0], /^type/)
  })

  it('refuse un emplacement hors de 0 à 34', () => {
    for (const position of [-1, 35, 1.5, '3', null, undefined]) {
      assert.match(errorsOf({ ...action, position })[0], /^position/)
    }
    assert.equal(validateButtonInput({ ...action, position: 0 }).ok, true)
    assert.equal(validateButtonInput({ ...action, position: 34 }).ok, true)
  })

  it('réserve l\'emplacement 0 au retour dans un dossier', () => {
    assert.match(errorsOf({ ...action, position: 0, parentId: 'abc' })[0], /^position.*réservé/)
    assert.equal(validateButtonInput({ ...action, position: 1, parentId: 'abc' }).ok, true)
    // À la racine, les 35 emplacements sont utilisables
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
  it('accepte un emplacement de 0 à 34 à la racine', () => {
    assert.deepEqual(validateMoveInput(null, { position: 0 }), { ok: true, value: 0 })
    assert.deepEqual(validateMoveInput(null, { position: 34 }), { ok: true, value: 34 })
  })

  it('accepte un emplacement de 1 à 34 dans un dossier', () => {
    assert.deepEqual(validateMoveInput('abc', { position: 1 }), { ok: true, value: 1 })
  })

  it('refuse l\'emplacement 0 dans un dossier : il est réservé au retour', () => {
    const result = validateMoveInput('abc', { position: 0 })
    assert.equal(result.ok, false)
    assert.match(result.ok ? '' : result.errors[0]!, /réservé/)
  })

  it('refuse un emplacement absent, hors grille ou qui n\'est pas un entier', () => {
    for (const body of [{}, { position: -1 }, { position: 35 }, { position: 1.5 }, { position: '3' }, { position: null }]) {
      assert.equal(validateMoveInput(null, body).ok, false, JSON.stringify(body))
    }
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'texte', 3, []]) {
      assert.equal(validateMoveInput(null, body).ok, false)
    }
  })
})
