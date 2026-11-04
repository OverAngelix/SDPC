import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import cors from 'cors'
import { accountRouter } from './account/router.js'
import { LoginLimiter } from './auth/loginLimiter.js'
import { authenticate, requireAuth } from './auth/middleware.js'
import { authRouter } from './auth/router.js'
import { buttonsRouter } from './buttons/router.js'
import { HttpError } from './errors.js'
import type { AppOptions } from './interfaces/app.js'
import { settingsRouter } from './settings/router.js'

function clientErrorStatus (error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  const { status } = error
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined
}

export function createApp ({ store, auth, settings, account, limiter = new LoginLimiter(), secureCookie = false, clientOrigin }: AppOptions) {
  const app = express()

  // Les cookies de session imposent une origine précise : jamais de CORS ouvert à tous
  if (clientOrigin !== undefined) app.use(cors({ origin: clientOrigin, credentials: true }))
  app.use(express.json())
  app.use(authenticate(auth))

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/auth', authRouter(auth, limiter, { secureCookie }))
  app.use('/api/account', requireAuth, accountRouter(account, limiter, { secureCookie }))
  app.use('/api/buttons', requireAuth, buttonsRouter(store))
  app.use('/api/settings', requireAuth, settingsRouter(settings))

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route introuvable', code: 'route_not_found' })
  })

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({
        error: error.message,
        code: error.code,
        // Texte français des problèmes, lisible dans les journaux et avec curl, et repli du client
        details: error.issues.map(({ field, message }) => field === undefined ? message : `${field} : ${message}`),
        issues: error.issues.map(({ field, code, params }) => ({ field, code, params })),
      })
      return
    }
    // Erreurs du client détectées par Express (JSON mal formé, corps trop gros…)
    const status = clientErrorStatus(error)
    if (status !== undefined) {
      res.status(status).json({ error: 'Requête invalide', code: 'bad_request' })
      return
    }
    console.error(error)
    res.status(500).json({ error: 'Erreur interne du serveur', code: 'internal_error' })
  })

  return app
}
