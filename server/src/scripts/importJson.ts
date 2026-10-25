import 'dotenv/config'
import { openDatabase } from '../db/database.js'
import { importButtons } from '../db/importJson.js'

// Chemins relatifs au dossier server/ (dossier courant au lancement)
const jsonFile = process.argv[2] || 'data/buttons.json'
const databaseFile = process.env.DATABASE_FILE || 'data/sdpc.db'

const db = openDatabase(databaseFile)
try {
  const added = await importButtons(db, jsonFile)
  console.log(`${added} bouton(s) importé(s) depuis ${jsonFile} dans ${databaseFile}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  db.close()
}
