import { Router } from 'express'
import { currentUserId } from '../auth/middleware.js'
import type { SettingsStore } from './store.js'

export function settingsRouter (store: SettingsStore) {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(store.get(currentUserId(req)))
  })

  router.patch('/', async (req, res) => {
    res.json(await store.update(currentUserId(req), req.body))
  })

  return router
}
