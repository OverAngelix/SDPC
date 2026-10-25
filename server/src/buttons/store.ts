import { randomUUID } from 'node:crypto'
import type { Db } from '../db/database.js'
import { HttpError } from '../errors.js'
import type { Button, ButtonColor } from './types.js'
import { mergeButtonPatch, validateButtonInput, validateMoveInput } from './validation.js'

const INVALID_DATA = 'Données invalides'
const COLUMNS = 'id, parent_id, position, label, icon, type, color, url'
// L'ordre de création fait l'ordre de la liste (rowid croissant, inchangé par un UPDATE)
const BY_CREATION = 'ORDER BY rowid'

interface ButtonRow {
  id: string
  parent_id: string | null
  position: number
  label: string
  icon: string
  type: Button['type']
  color: string | null
  url: string | null
}

function toButton (row: ButtonRow): Button {
  const button: Button = {
    id: row.id,
    parentId: row.parent_id,
    position: row.position,
    label: row.label,
    icon: row.icon,
    type: row.type,
  }
  // Les valeurs ont été validées à l'écriture
  if (row.color !== null) button.color = row.color as ButtonColor
  if (row.url !== null) button.url = row.url
  return button
}

export class ButtonStore {
  constructor (private readonly db: Db) {}

  /** Sans filtre : tous les boutons. Avec `parentId` : le contenu d'un dossier (null = racine). */
  list (parentId?: string | null): Button[] {
    const rows = parentId === undefined
      ? this.db.prepare(`SELECT ${COLUMNS} FROM buttons ${BY_CREATION}`).all()
      : parentId === null
        ? this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE parent_id IS NULL ${BY_CREATION}`).all()
        : this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE parent_id = ? ${BY_CREATION}`).all(parentId)
    return (rows as ButtonRow[]).map(toButton)
  }

  get (id: string): Button {
    const row = this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE id = ?`).get(id) as ButtonRow | undefined
    if (row === undefined) throw new HttpError(404, 'Bouton introuvable')
    return toButton(row)
  }

  async create (body: unknown): Promise<Button> {
    const result = validateButtonInput(body)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const input = result.value
    this.assertParentIsFolder(input.parentId)
    this.assertSlotFree(input.parentId, input.position)

    const button: Button = { id: randomUUID(), ...input }
    this.db.prepare(`INSERT INTO buttons (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      button.id, button.parentId, button.position, button.label, button.icon, button.type, button.color ?? null, button.url ?? null,
    )
    return button
  }

  async update (id: string, patch: unknown): Promise<Button> {
    const current = this.get(id)
    const result = mergeButtonPatch(current, patch)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const input = result.value
    if (input.position !== current.position) this.assertSlotFree(input.parentId, input.position)
    if (current.type === 'folder' && input.type === 'action' && this.list(id).length > 0) {
      throw new HttpError(409, 'Un dossier non vide ne peut pas devenir une action', ['type : vider le dossier d\'abord'])
    }

    const updated: Button = { id, ...input }
    this.db.prepare('UPDATE buttons SET position = ?, label = ?, icon = ?, type = ?, color = ?, url = ? WHERE id = ?').run(
      updated.position, updated.label, updated.icon, updated.type, updated.color ?? null, updated.url ?? null, id,
    )
    return updated
  }

  /**
   * Déplace un bouton vers un autre emplacement de son dossier. Si l'emplacement est occupé,
   * les deux boutons échangent leur place. Renvoie les boutons dont l'emplacement a changé.
   */
  async move (id: string, body: unknown): Promise<Button[]> {
    const current = this.get(id)
    const result = validateMoveInput(current.parentId, body)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const position = result.value
    if (position === current.position) return []

    const occupant = this.list(current.parentId).find(button => button.position === position)
    const setPosition = this.db.prepare('UPDATE buttons SET position = ? WHERE id = ?')
    this.db.transaction(() => {
      if (occupant === undefined) {
        setPosition.run(position, id)
        return
      }
      // L'index d'unicité interdit deux boutons sur le même emplacement, même un instant : l'échange passe par -1
      setPosition.run(-1, id)
      setPosition.run(current.position, occupant.id)
      setPosition.run(position, id)
    })()

    const changed: Button[] = [{ ...current, position }]
    if (occupant !== undefined) changed.push({ ...occupant, position: current.position })
    return changed
  }

  /** Supprime le bouton et, pour un dossier, tout son contenu (suppression en cascade de la base). */
  async remove (id: string): Promise<void> {
    this.get(id)
    this.db.prepare('DELETE FROM buttons WHERE id = ?').run(id)
  }

  private assertParentIsFolder (parentId: string | null): void {
    if (parentId === null) return
    const parent = this.db.prepare('SELECT type FROM buttons WHERE id = ?').get(parentId) as { type: string } | undefined
    if (parent?.type !== 'folder') {
      throw new HttpError(400, INVALID_DATA, ['parentId : dossier introuvable'])
    }
  }

  private assertSlotFree (parentId: string | null, position: number): void {
    if (this.list(parentId).some(button => button.position === position)) {
      throw new HttpError(409, 'Emplacement déjà occupé', [`position : l'emplacement ${position} est pris dans ce dossier`])
    }
  }
}
