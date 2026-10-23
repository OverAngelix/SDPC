import { Router } from 'express'
import { HttpError } from '../errors.js'
import type { ButtonStore } from './store.js'

/** Valeur de `?parentId=` pour lister la racine (un identifiant de dossier ne vaut jamais "root"). */
export const ROOT_FILTER = 'root'

export function buttonsRouter (store: ButtonStore) {
  const router = Router()

  router.get('/', (req, res) => {
    const { parentId } = req.query
    if (parentId === undefined) {
      res.json(store.list())
      return
    }
    if (typeof parentId !== 'string') throw new HttpError(400, 'Paramètre parentId invalide')
    res.json(store.list(parentId === ROOT_FILTER ? null : parentId))
  })

  router.get('/:id', (req, res) => {
    res.json(store.get(req.params.id))
  })

  router.post('/', async (req, res) => {
    res.status(201).json(await store.create(req.body))
  })

  router.patch('/:id', async (req, res) => {
    res.json(await store.update(req.params.id, req.body))
  })

  // Déplacement dans le dossier du bouton, avec échange si l'emplacement est occupé
  router.post('/:id/move', async (req, res) => {
    res.json(await store.move(req.params.id, req.body))
  })

  router.delete('/:id', async (req, res) => {
    await store.remove(req.params.id)
    res.status(204).end()
  })

  return router
}
