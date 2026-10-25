import 'dotenv/config'
import { createApp } from './app.js'
import { ButtonStore } from './buttons/store.js'
import { openDatabase } from './db/database.js'

const port = Number(process.env.PORT) || 4000
// Chemin relatif au dossier server/ (dossier courant au lancement)
const databaseFile = process.env.DATABASE_FILE || 'data/sdpc.db'

const store = new ButtonStore(openDatabase(databaseFile))

createApp({ store }).listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port} (base : ${databaseFile})`)
})
