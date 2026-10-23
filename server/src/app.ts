import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import cors from 'cors'
import { buttonsRouter } from './buttons/router.js'
import type { ButtonStore } from './buttons/store.js'
import { HttpError } from './errors.js'

export interface AppOptions {
  store: ButtonStore
}

function clientErrorStatus (error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  const { status } = error
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined
}

export function createApp ({ store }: AppOptions) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/buttons', buttonsRouter(store))

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route introuvable' })
  })

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message, details: error.details })
      return
    }
    // Erreurs du client détectées par Express (JSON mal formé, corps trop gros…)
    const status = clientErrorStatus(error)
    if (status !== undefined) {
      res.status(status).json({ error: 'Requête invalide' })
      return
    }
    console.error(error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  })

  return app
}
