import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { HttpError } from '../errors.js'
import type { Button } from './types.js'
import { mergeButtonPatch, validateButtonInput, validateMoveInput } from './validation.js'

const INVALID_DATA = 'Données invalides'

function isMissingFile (error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

/** Relit le fichier de données et refuse tout contenu incohérent plutôt que de l'écraser. */
function parseFile (raw: string, file: string): Button[] {
  const fail = (reason: string): never => {
    throw new Error(`Fichier de données invalide (${file}) : ${reason}`)
  }

  let content: unknown
  try {
    content = JSON.parse(raw)
  } catch {
    return fail('JSON illisible')
  }
  const list = typeof content === 'object' && content !== null && 'buttons' in content ? content.buttons : undefined
  if (!Array.isArray(list)) return fail('tableau "buttons" attendu')

  const buttons = list.map((item: unknown): Button => {
    const result = validateButtonInput(item)
    const id = typeof item === 'object' && item !== null && 'id' in item ? item.id : undefined
    if (!result.ok || typeof id !== 'string' || id === '') return fail(`bouton invalide ${JSON.stringify(item)}`)
    return { id, ...result.value }
  })

  const ids = new Set<string>()
  const slots = new Set<string>()
  for (const button of buttons) {
    const slot = `${button.parentId}:${button.position}`
    if (ids.has(button.id)) fail(`identifiant en double "${button.id}"`)
    if (slots.has(slot)) fail(`emplacement occupé deux fois (${slot})`)
    ids.add(button.id)
    slots.add(slot)
  }
  for (const button of buttons) {
    if (button.parentId !== null && buttons.find(parent => parent.id === button.parentId)?.type !== 'folder') {
      fail(`le parent "${button.parentId}" de "${button.id}" n'est pas un dossier existant`)
    }
  }
  return buttons
}

export class ButtonStore {
  private buttons: Button[]
  private writing: Promise<void> = Promise.resolve()

  private constructor (private readonly file: string, buttons: Button[]) {
    this.buttons = buttons
  }

  /** Ouvre le fichier de données, le crée vide s'il n'existe pas. */
  static async open (file: string): Promise<ButtonStore> {
    let raw: string
    try {
      raw = await readFile(file, 'utf8')
    } catch (error) {
      if (!isMissingFile(error)) throw error
      const store = new ButtonStore(file, [])
      await store.persist()
      return store
    }
    return new ButtonStore(file, parseFile(raw, file))
  }

  /** Sans filtre : tous les boutons. Avec `parentId` : le contenu d'un dossier (null = racine). */
  list (parentId?: string | null): Button[] {
    return parentId === undefined ? [...this.buttons] : this.buttons.filter(button => button.parentId === parentId)
  }

  get (id: string): Button {
    const button = this.buttons.find(candidate => candidate.id === id)
    if (button === undefined) throw new HttpError(404, 'Bouton introuvable')
    return button
  }

  async create (body: unknown): Promise<Button> {
    const result = validateButtonInput(body)
    if (!result.ok) throw new HttpError(400, INVALID_DATA, result.errors)

    const input = result.value
    this.assertParentIsFolder(input.parentId)
    this.assertSlotFree(input.parentId, input.position)

    const button: Button = { id: randomUUID(), ...input }
    await this.commit([...this.buttons, button])
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
    await this.commit(this.buttons.map(button => button.id === id ? updated : button))
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

    const occupant = this.buttons.find(button => button.parentId === current.parentId && button.position === position)
    const changed: Button[] = [{ ...current, position }]
    if (occupant !== undefined) changed.push({ ...occupant, position: current.position })

    await this.commit(this.buttons.map(button => changed.find(candidate => candidate.id === button.id) ?? button))
    return changed
  }

  /** Supprime le bouton et, pour un dossier, tout son contenu. */
  async remove (id: string): Promise<void> {
    this.get(id)

    const removed = new Set([id])
    let grew = true
    while (grew) {
      grew = false
      for (const button of this.buttons) {
        if (button.parentId !== null && removed.has(button.parentId) && !removed.has(button.id)) {
          removed.add(button.id)
          grew = true
        }
      }
    }
    await this.commit(this.buttons.filter(button => !removed.has(button.id)))
  }

  private assertParentIsFolder (parentId: string | null): void {
    if (parentId === null) return
    const parent = this.buttons.find(button => button.id === parentId)
    if (parent?.type !== 'folder') {
      throw new HttpError(400, INVALID_DATA, ['parentId : dossier introuvable'])
    }
  }

  private assertSlotFree (parentId: string | null, position: number): void {
    if (this.buttons.some(button => button.parentId === parentId && button.position === position)) {
      throw new HttpError(409, 'Emplacement déjà occupé', [`position : l'emplacement ${position} est pris dans ce dossier`])
    }
  }

  private async commit (next: Button[]): Promise<void> {
    const previous = this.buttons
    this.buttons = next
    try {
      await this.persist()
    } catch (error) {
      if (this.buttons === next) this.buttons = previous
      throw error
    }
  }

  // Écritures en file d'attente, chacune sérialise l'état courant ; fichier temporaire puis renommage
  private persist (): Promise<void> {
    const write = async () => {
      await mkdir(dirname(this.file), { recursive: true })
      const temporary = `${this.file}.tmp`
      await writeFile(temporary, `${JSON.stringify({ buttons: this.buttons }, null, 2)}\n`)
      await rename(temporary, this.file)
    }
    const result = this.writing.then(write)
    this.writing = result.catch(() => {})
    return result
  }
}
