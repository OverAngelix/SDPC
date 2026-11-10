import type { ButtonFormValues } from '@/interfaces/buttonForm'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@/plugins/i18n'
import { ICON_PATTERN, iconAfterTypeChange, LABEL_MAX_LENGTH, toButtonInput, toButtonPatch, URL_MAX_LENGTH, validateButtonForm } from '@/utils/buttonForm'
import { COMMON_ICONS } from '@/utils/icons'

const action: ButtonFormValues = { type: 'action', label: 'YouTube', icon: 'mdi-youtube', color: 'red', url: 'https://www.youtube.com' }
const folder: ButtonFormValues = { type: 'folder', label: 'Jeux', icon: 'mdi-folder', color: 'grey', url: '' }

describe('validateButtonForm', () => {
  afterEach(() => setLocale('fr'))

  it('écrit ses messages dans la langue active, limites comprises', () => {
    const tooLong = { ...action, label: 'a'.repeat(LABEL_MAX_LENGTH + 1) }

    setLocale('fr')
    expect(validateButtonForm({ ...action, label: '' }).label).toBe('Le libellé est obligatoire.')
    expect(validateButtonForm(tooLong).label).toBe(`Le libellé fait ${LABEL_MAX_LENGTH} caractères au plus.`)

    setLocale('en')
    expect(validateButtonForm({ ...action, label: '' }).label).toBe('The label is required.')
    expect(validateButtonForm(tooLong).label).toBe(`The label can be at most ${LABEL_MAX_LENGTH} characters long.`)
  })

  it('accepte une action et un dossier valides', () => {
    expect(validateButtonForm(action)).toEqual({})
    expect(validateButtonForm(folder)).toEqual({})
  })

  it('refuse un libellé vide ou fait d\'espaces', () => {
    expect(validateButtonForm({ ...action, label: '' }).label).toBeDefined()
    expect(validateButtonForm({ ...action, label: ' '.repeat(3) }).label).toBeDefined()
  })

  it('limite la longueur du libellé', () => {
    expect(validateButtonForm({ ...action, label: 'a'.repeat(LABEL_MAX_LENGTH) }).label).toBeUndefined()
    expect(validateButtonForm({ ...action, label: 'a'.repeat(LABEL_MAX_LENGTH + 1) }).label).toBeDefined()
  })

  it('refuse un nom d\'icône qui n\'est pas au format MDI', () => {
    for (const icon of ['', 'youtube', 'mdi-', 'mdi-You', 'mdi youtube', 'mdi-a b', 'mdi--a']) {
      expect(validateButtonForm({ ...action, icon }).icon, icon).toBeDefined()
    }
    expect(validateButtonForm({ ...action, icon: 'mdi-gamepad-variant' }).icon).toBeUndefined()
  })

  it('accepte l\'icône du site pour une action seulement', () => {
    expect(validateButtonForm({ ...action, icon: 'favicon' }).icon).toBeUndefined()
    expect(validateButtonForm({ ...folder, icon: 'favicon' }).icon).toBe('L\'icône du site n\'existe que pour une action.')
  })

  it('exige une URL pour une action', () => {
    expect(validateButtonForm({ ...action, url: '' }).url).toBeDefined()
    expect(validateButtonForm({ ...action, url: ' '.repeat(3) }).url).toBeDefined()
  })

  it('accepte seulement http et https', () => {
    // http reste autorisé : c'est ce que ce test vérifie
    // eslint-disable-next-line unicorn/prefer-https
    expect(validateButtonForm({ ...action, url: 'http://example.com' }).url).toBeUndefined()
    expect(validateButtonForm({ ...action, url: '  https://example.com  ' }).url).toBeUndefined()
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'ftp://example.com', 'example.com', '/config']) {
      expect(validateButtonForm({ ...action, url }).url, url).toBeDefined()
    }
  })

  it('limite la longueur de l\'URL', () => {
    const long = `https://example.com/${'a'.repeat(URL_MAX_LENGTH)}`
    expect(validateButtonForm({ ...action, url: long }).url).toBeDefined()
  })

  it('ignore l\'URL d\'un dossier', () => {
    expect(validateButtonForm({ ...folder, url: 'pas une url' })).toEqual({})
  })

  it('cumule les erreurs de plusieurs champs', () => {
    const errors = validateButtonForm({ type: 'action', label: '', icon: 'x', color: 'grey', url: '' })
    expect(errors).toHaveProperty('label')
    expect(errors).toHaveProperty('icon')
    expect(errors).toHaveProperty('url')
  })
})

describe('toButtonInput et toButtonPatch', () => {
  it('prépare la création d\'une action à un emplacement', () => {
    expect(toButtonInput({ ...action, label: '  YouTube ', url: ' https://www.youtube.com ' }, 'games', 4)).toEqual({
      parentId: 'games',
      position: 4,
      type: 'action',
      label: 'YouTube',
      icon: 'mdi-youtube',
      color: 'red',
      url: 'https://www.youtube.com',
    })
  })

  it('n\'envoie pas d\'URL pour un dossier, même saisie avant un changement de type', () => {
    const input = toButtonInput({ ...folder, url: 'https://example.com' }, null, 0)
    expect(input).toEqual({ parentId: null, position: 0, type: 'folder', label: 'Jeux', icon: 'mdi-folder', color: 'grey' })
    expect('url' in input).toBe(false)
    expect('url' in toButtonPatch({ ...folder, url: 'https://example.com' })).toBe(false)
  })

  it('ne touche ni au dossier parent ni à l\'emplacement en modification', () => {
    expect(toButtonPatch(action)).toEqual({ type: 'action', label: 'YouTube', icon: 'mdi-youtube', color: 'red', url: 'https://www.youtube.com' })
  })
})

describe('COMMON_ICONS', () => {
  it('ne contient que des noms d\'icône valides, sans doublon', () => {
    expect(COMMON_ICONS.every(icon => ICON_PATTERN.test(icon))).toBe(true)
    expect(new Set(COMMON_ICONS).size).toBe(COMMON_ICONS.length)
  })
})

describe('iconAfterTypeChange', () => {
  it('fait suivre l\'icône par défaut au type', () => {
    expect(iconAfterTypeChange('favicon', 'action', 'folder')).toBe('mdi-folder')
    expect(iconAfterTypeChange('mdi-folder', 'folder', 'action')).toBe('favicon')
  })

  it('remplace l\'icône du site en passant en dossier, garde une icône choisie', () => {
    expect(iconAfterTypeChange('favicon', 'folder', 'folder')).toBe('mdi-folder')
    expect(iconAfterTypeChange('mdi-youtube', 'action', 'folder')).toBe('mdi-youtube')
    expect(iconAfterTypeChange('mdi-github', 'folder', 'action')).toBe('mdi-github')
  })
})
