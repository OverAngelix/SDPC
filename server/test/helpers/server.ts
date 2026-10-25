import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { createApp } from '../../src/app.js'
import { ButtonStore } from '../../src/buttons/store.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'

/** Démarre l'application sur un port libre, avec une base SQLite en mémoire. */
export async function startTestServer () {
  const db = openDatabase(MEMORY_DATABASE)
  const store = new ButtonStore(db)
  const server = createApp({ store }).listen(0)
  await once(server, 'listening')

  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    store,
    async close () {
      server.close()
      db.close()
    },
  }
}
