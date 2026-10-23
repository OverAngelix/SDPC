import 'dotenv/config'
import { createApp } from './app.js'
import { ButtonStore } from './buttons/store.js'

const port = Number(process.env.PORT) || 4000
// Chemin relatif au dossier server/ (dossier courant au lancement)
const dataFile = process.env.DATA_FILE || 'data/buttons.json'

const store = await ButtonStore.open(dataFile)

createApp({ store }).listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port} (données : ${dataFile})`)
})
