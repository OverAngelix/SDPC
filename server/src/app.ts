import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import cors from 'cors'
import { LoginLimiter } from './auth/loginLimiter.js'
import { authenticate, requireAuth } from './auth/middleware.js'
import { authRouter } from './auth/router.js'
import type { AuthStore } from './auth/store.js'
import { buttonsRouter } from './buttons/router.js'
import type { ButtonStore } from './buttons/store.js'
import { HttpError } from './errors.js'

export interface AppOptions {
  store: ButtonStore
  auth: AuthStore
  limiter?: LoginLimiter
  /** Cookie de session réservé au HTTPS (production) */
  secureCookie?: boolean
  /** Origine du client si elle diffère de celle du serveur ; sinon aucun accès d'une autre origine */
  clientOrigin?: string
}

function clientErrorStatus (error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  const { status } = error
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined
}

export function createApp ({ store, auth, limiter = new LoginLimiter(), secureCookie = false, clientOrigin }: AppOptions) {
  const app = express()

  // Les cookies de session imposent une origine précise : jamais de CORS ouvert à tous
  if (clientOrigin !== undefined) app.use(cors({ origin: clientOrigin, credentials: true }))
  app.use(express.json())
  app.use(authenticate(auth))

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/auth', authRouter(auth, limiter, { secureCookie }))
  app.use('/api/buttons', requireAuth, buttonsRouter(store))

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
