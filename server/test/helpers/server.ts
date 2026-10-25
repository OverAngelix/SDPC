import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { createApp } from '../../src/app.js'
import { AuthStore } from '../../src/auth/store.js'
import { ButtonStore } from '../../src/buttons/store.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import type { AppOptions } from '../../src/interfaces/app.js'
import { SettingsStore } from '../../src/settings/store.js'

/** Démarre l'application sur un port libre, avec une base SQLite en mémoire. */
export async function startTestServer (options: Partial<AppOptions> = {}) {
  const db = openDatabase(MEMORY_DATABASE)
  const store = new ButtonStore(db)
  const auth = new AuthStore(db)
  const settings = new SettingsStore(db)
  const server = createApp({ store, auth, settings, ...options }).listen(0)
  await once(server, 'listening')

  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    db,
    store,
    auth,
    settings,
    /** Crée un compte et ouvre une session : renvoie l'identifiant et le cookie à envoyer. */
    async signUp (email: string) {
      const user = await auth.register({ email, password: 'motdepasse' })
      return { id: user.id, cookie: `sdpc_session=${auth.createSession(user.id)}` }
    },
    async close () {
      server.close()
      db.close()
    },
  }
}
