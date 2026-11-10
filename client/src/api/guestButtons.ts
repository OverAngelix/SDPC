import type { ApiErrorBody, ApiIssue } from '@/interfaces/api'
import type { Button, ButtonInput, ButtonPatch } from '@/interfaces/button'
import { AxiosError, AxiosHeaders } from 'axios'
import { fetchExampleButtons } from '@/api/buttons'
import { BACK_SLOT, collectSubtree } from '@/grid'
import { readGuestButtons, writeGuestButtons } from '@/utils/guestStorage'

/*
 * Les boutons de l'invité, gardés dans le navigateur. Mêmes fonctions que `api/buttons.ts` et mêmes refus que le
 * serveur (mêmes codes, donc mêmes messages) ; le reste de la validation est celle du formulaire.
 */

// Une erreur comme celles de l'API : `describeApiError` la traduit sans savoir qu'elle vient du navigateur
function refuse (status: number, code: string, issues: ApiIssue[] = []): AxiosError<ApiErrorBody> {
  const config = { headers: new AxiosHeaders() }
  const data: ApiErrorBody = { error: '', code, issues }
  return new AxiosError(code, AxiosError.ERR_BAD_REQUEST, config, undefined, { status, statusText: '', headers: {}, config, data })
}

function load (): Button[] {
  return readGuestButtons() ?? []
}

function find (buttons: Button[], id: string): Button {
  const button = buttons.find(candidate => candidate.id === id)
  if (button === undefined) {
    throw refuse(404, 'button_not_found')
  }
  return button
}

function assertSlotFree (buttons: Button[], parentId: string | null, position: number) {
  if (parentId !== null && position === BACK_SLOT) {
    throw refuse(400, 'invalid_data', [{ field: 'position', code: 'reserved_slot', params: { slot: BACK_SLOT } }])
  }
  if (buttons.some(button => button.parentId === parentId && button.position === position)) {
    throw refuse(409, 'slot_taken', [{ field: 'position', code: 'slot_taken', params: { position } }])
  }
}

export async function fetchButtons (): Promise<Button[]> {
  const saved = readGuestButtons()
  if (saved !== null) {
    return saved
  }
  // Première grille de l'invité : celle d'exemple. Serveur injoignable : grille vide pour cette fois, sans rien
  // retenir, pour que l'exemple soit redemandé au prochain chargement
  const example = await fetchExampleButtons().catch(() => null)
  if (example === null) {
    return []
  }
  writeGuestButtons(example)
  return example
}

export async function createButton (input: ButtonInput): Promise<Button> {
  const buttons = load()
  if (input.parentId !== null && buttons.find(button => button.id === input.parentId)?.type !== 'folder') {
    throw refuse(400, 'invalid_data', [{ field: 'parentId', code: 'parent_not_found' }])
  }
  assertSlotFree(buttons, input.parentId, input.position)
  const created: Button = { id: crypto.randomUUID(), ...input }
  writeGuestButtons([...buttons, created])
  return created
}

export async function updateButton (id: string, patch: ButtonPatch): Promise<Button> {
  const buttons = load()
  const current = find(buttons, id)
  const updated: Button = { ...current, ...patch }
  // Un dossier n'a pas d'URL
  if (updated.type === 'folder') {
    delete updated.url
  }
  if (updated.position !== current.position) {
    assertSlotFree(buttons, current.parentId, updated.position)
  }
  if (current.type === 'folder' && updated.type === 'action' && buttons.some(button => button.parentId === id)) {
    throw refuse(409, 'folder_not_empty', [{ field: 'type', code: 'empty_folder_first' }])
  }
  writeGuestButtons(buttons.map(button => button.id === id ? updated : button))
  return updated
}

/** Déplace un bouton dans son dossier ; renvoie les boutons dont l'emplacement a changé (deux en cas d'échange) */
export async function moveButton (id: string, position: number): Promise<Button[]> {
  const buttons = load()
  const current = find(buttons, id)
  if (current.parentId !== null && position === BACK_SLOT) {
    throw refuse(400, 'invalid_data', [{ field: 'position', code: 'reserved_slot', params: { slot: BACK_SLOT } }])
  }
  if (position === current.position) {
    return []
  }
  const occupant = buttons.find(button => button.parentId === current.parentId && button.position === position)
  const changed: Button[] = [{ ...current, position }]
  if (occupant !== undefined) {
    changed.push({ ...occupant, position: current.position })
  }
  writeGuestButtons(buttons.map(button => changed.find(candidate => candidate.id === button.id) ?? button))
  return changed
}

export async function deleteButton (id: string): Promise<void> {
  const buttons = load()
  find(buttons, id)
  // Un dossier emporte son contenu, comme sur le serveur
  const removed = collectSubtree(buttons, id)
  writeGuestButtons(buttons.filter(button => !removed.has(button.id)))
}

/** Efface tous les boutons de l'invité */
export async function clearButtons (): Promise<void> {
  writeGuestButtons([])
}
