import 'dotenv/config'
import { createApp } from './app.js'
import { AuthStore } from './auth/store.js'
import { ButtonStore } from './buttons/store.js'
import { openDatabase } from './db/database.js'

const port = Number(process.env.PORT) || 4000
// Chemin relatif au dossier server/ (dossier courant au lancement)
const databaseFile = process.env.DATABASE_FILE || 'data/sdpc.db'

const db = openDatabase(databaseFile)
const store = new ButtonStore(db)
const auth = new AuthStore(db)

createApp({
  store,
  auth,
  secureCookie: process.env.NODE_ENV === 'production',
  clientOrigin: process.env.CLIENT_ORIGIN || undefined,
}).listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port} (base : ${databaseFile})`)
})
