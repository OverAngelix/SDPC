import { readFile } from 'node:fs/promises'
import type { Button } from '../buttons/types.js'
import { validateButtonInput } from '../buttons/validation.js'
import type { Db } from './database.js'

/** Relit un fichier `buttons.json` et refuse tout contenu incohérent plutôt que d'en importer une partie. */
export function parseButtonsFile (raw: string, file: string): Button[] {
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

/**
 * Importe un fichier `buttons.json` dans la base, en une seule transaction. Les boutons déjà présents
 * (même identifiant) sont ignorés, donc relancer l'import est sans effet. Renvoie le nombre de boutons ajoutés.
 */
export async function importButtons (db: Db, file: string): Promise<number> {
  const buttons = parseButtonsFile(await readFile(file, 'utf8'), file)
  const exists = db.prepare('SELECT 1 FROM buttons WHERE id = ?')
  // Pas d'INSERT OR IGNORE : il masquerait aussi un emplacement déjà pris, au lieu d'annuler l'import
  const insert = db.prepare(
    'INSERT INTO buttons (id, parent_id, position, label, icon, type, color, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
  return db.transaction(() => {
    // Le fichier n'ordonne pas les dossiers avant leur contenu : les clés étrangères sont vérifiées à la fin
    db.pragma('defer_foreign_keys = ON')
    let added = 0
    for (const button of buttons) {
      if (exists.get(button.id) !== undefined) continue
      insert.run(
        button.id, button.parentId, button.position, button.label, button.icon, button.type, button.color ?? null, button.url ?? null,
      )
      added++
    }
    return added
  })()
}
