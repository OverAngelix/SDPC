import type { Response } from 'express'
import { Router } from 'express'
import { EXAMPLE_GRID } from '../buttons/constants.js'
import type { ButtonStore } from '../buttons/store.js'
import { HttpError } from '../errors.js'
import type { AuthRouterOptions } from '../interfaces/auth.js'
import type { LoginLimiter } from './loginLimiter.js'
import { requireAuth, SESSION_COOKIE, sessionCookieOptions, sessionToken } from './middleware.js'
import { SESSION_MS } from './store.js'
import type { AuthStore } from './store.js'

export function authRouter (auth: AuthStore, buttons: ButtonStore, limiter: LoginLimiter, { secureCookie }: AuthRouterOptions) {
  const router = Router()

  const cookieOptions = sessionCookieOptions(secureCookie)

  function startSession (res: Response, userId: string): void {
    res.cookie(SESSION_COOKIE, auth.createSession(userId), { ...cookieOptions, maxAge: SESSION_MS })
  }

  router.post('/register', async (req, res) => {
    const user = await auth.register(req.body)
    // Un nouveau compte ne part pas d'une grille vide (un invité qui migre la remplace ensuite par la sienne)
    buttons.replace(user.id, EXAMPLE_GRID)
    startSession(res, user.id)
    res.status(201).json(user)
  })

  router.post('/login', async (req, res) => {
    // La clé combine l'adresse IP et l'e-mail saisi : on bloque un essai répété sans enfermer tout le monde dehors
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const key = `${req.ip}|${email}`
    const wait = limiter.blockedFor(key)
    if (wait > 0) {
      res.set('Retry-After', String(wait))
      throw new HttpError(429, 'too_many_attempts', 'Trop de tentatives, réessayez plus tard')
    }

    try {
      const user = await auth.login(req.body)
      limiter.reset(key)
      startSession(res, user.id)
      res.json(user)
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) limiter.recordFailure(key)
      throw error
    }
  })

  router.post('/logout', (req, res) => {
    const token = sessionToken(req)
    if (token !== undefined) auth.deleteSession(token)
    res.clearCookie(SESSION_COOKIE, cookieOptions)
    res.status(204).end()
  })

  router.get('/me', requireAuth, (req, res) => {
    res.json(req.user)
  })

  return router
}
