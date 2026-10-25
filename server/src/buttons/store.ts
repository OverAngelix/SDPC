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

/** Les boutons de chaque personne : chaque méthode ne voit que ceux de `userId`, un identifiant étranger vaut « introuvable ». */
export class ButtonStore {
  constructor (private readonly db: Db) {}

  /** Sans filtre : tous les boutons. Avec `parentId` : le contenu d'un dossier (null = racine). */
  list (userId: string, parentId?: string | null): Button[] {
    const rows = parentId === undefined
      ? this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE user_id = ? ${BY_CREATION}`).all(userId)
      : parentId === null
        ? this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE user_id = ? AND parent_id IS NULL ${BY_CREATION}`).all(userId)
        : this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE user_id = ? AND parent_id = ? ${BY_CREATION}`).all(userId, parentId)
    return (rows as ButtonRow[]).map(toButton)
  }

  get (userId: string, id: string): Button {
    const row = this.db.prepare(`SELECT ${COLUMNS} FROM buttons WHERE id = ? AND user_id = ?`).get(id, userId) as ButtonRow | undefined
    if (row === undefined) throw new HttpError(404, 'Bouton introuvable')
    return toButton(row)
  }

  async create (userId: string, body: unknown): Promise<Button> {
    const result = validateButtonInput(body)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const input = result.value
    this.assertParentIsFolder(userId, input.parentId)
    this.assertSlotFree(userId, input.parentId, input.position)

    const button: Button = { id: randomUUID(), ...input }
    this.db.prepare(`INSERT INTO buttons (${COLUMNS}, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      button.id, button.parentId, button.position, button.label, button.icon, button.type, button.color ?? null, button.url ?? null, userId,
    )
    return button
  }

  async update (userId: string, id: string, patch: unknown): Promise<Button> {
    const current = this.get(userId, id)
    const result = mergeButtonPatch(current, patch)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const input = result.value
    if (input.position !== current.position) this.assertSlotFree(userId, input.parentId, input.position)
    if (current.type === 'folder' && input.type === 'action' && this.list(userId, id).length > 0) {
      throw new HttpError(409, 'Un dossier non vide ne peut pas devenir une action', ['type : vider le dossier d\'abord'])
    }

    const updated: Button = { id, ...input }
    this.db.prepare('UPDATE buttons SET position = ?, label = ?, icon = ?, type = ?, color = ?, url = ? WHERE id = ? AND user_id = ?').run(
      updated.position, updated.label, updated.icon, updated.type, updated.color ?? null, updated.url ?? null, id, userId,
    )
    return updated
  }

  /**
   * Déplace un bouton vers un autre emplacement de son dossier. Si l'emplacement est occupé,
   * les deux boutons échangent leur place. Renvoie les boutons dont l'emplacement a changé.
   */
  async move (userId: string, id: string, body: unknown): Promise<Button[]> {
    const current = this.get(userId, id)
    const result = validateMoveInput(current.parentId, body)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const position = result.value
    if (position === current.position) return []

    const occupant = this.list(userId, current.parentId).find(button => button.position === position)
    const setPosition = this.db.prepare('UPDATE buttons SET position = ? WHERE id = ? AND user_id = ?')
    this.db.transaction(() => {
      if (occupant === undefined) {
        setPosition.run(position, id, userId)
        return
      }
      // L'index d'unicité interdit deux boutons sur le même emplacement, même un instant : l'échange passe par -1
      setPosition.run(-1, id, userId)
      setPosition.run(current.position, occupant.id, userId)
      setPosition.run(position, id, userId)
    })()

    const changed: Button[] = [{ ...current, position }]
    if (occupant !== undefined) changed.push({ ...occupant, position: current.position })
    return changed
  }

  /** Supprime le bouton et, pour un dossier, tout son contenu (suppression en cascade de la base). */
  async remove (userId: string, id: string): Promise<void> {
    this.get(userId, id)
    this.db.prepare('DELETE FROM buttons WHERE id = ? AND user_id = ?').run(id, userId)
  }

  /** Supprime tous les boutons de la personne, dossiers et contenus compris. Renvoie leur nombre. */
  async clear (userId: string): Promise<number> {
    // Les dossiers supprimés emportent leur contenu par cascade, ce que `changes` ne compte pas : on compte avant
    return this.db.transaction(() => {
      const { count } = this.db.prepare('SELECT count(*) AS count FROM buttons WHERE user_id = ?').get(userId) as { count: number }
      this.db.prepare('DELETE FROM buttons WHERE user_id = ?').run(userId)
      return count
    })()
  }

  private assertParentIsFolder (userId: string, parentId: string | null): void {
    if (parentId === null) return
    const parent = this.db.prepare('SELECT type FROM buttons WHERE id = ? AND user_id = ?').get(parentId, userId) as { type: string } | undefined
    if (parent?.type !== 'folder') {
      throw new HttpError(400, INVALID_DATA, ['parentId : dossier introuvable'])
    }
  }

  private assertSlotFree (userId: string, parentId: string | null, position: number): void {
    if (this.list(userId, parentId).some(button => button.position === position)) {
      throw new HttpError(409, 'Emplacement déjà occupé', [`position : l'emplacement ${position} est pris dans ce dossier`])
    }
  }
}
