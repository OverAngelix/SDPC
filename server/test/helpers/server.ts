import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../../src/app.js'
import { ButtonStore } from '../../src/buttons/store.js'

/** Démarre l'application sur un port libre, avec un fichier de données temporaire. */
export async function startTestServer () {
  const dir = await mkdtemp(join(tmpdir(), 'sdpc-test-'))
  const file = join(dir, 'buttons.json')
  const store = await ButtonStore.open(file)
  const server = createApp({ store }).listen(0)
  await once(server, 'listening')

  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    store,
    file,
    async close () {
      server.close()
      await rm(dir, { recursive: true, force: true })
    },
  }
}
