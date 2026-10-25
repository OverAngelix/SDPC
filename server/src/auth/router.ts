import type { CookieOptions, Response } from 'express'
import { Router } from 'express'
import { HttpError } from '../errors.js'
import type { LoginLimiter } from './loginLimiter.js'
import { requireAuth, SESSION_COOKIE, sessionToken } from './middleware.js'
import { REMEMBERED_SESSION_MS } from './store.js'
import type { AuthStore } from './store.js'

export interface AuthRouterOptions {
  /** Cookie réservé au HTTPS : à activer en production */
  secureCookie: boolean
}

export function authRouter (auth: AuthStore, limiter: LoginLimiter, { secureCookie }: AuthRouterOptions) {
  const router = Router()

  const cookieOptions: CookieOptions = { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/' }

  // « Se souvenir de moi » (`remember: true` dans le corps) : cookie de 30 jours ; sinon cookie de session, perdu à la fermeture du navigateur
  function startSession (res: Response, userId: string, body: unknown): void {
    const remember = typeof body === 'object' && body !== null && 'remember' in body && body.remember === true
    res.cookie(SESSION_COOKIE, auth.createSession(userId, remember), remember ? { ...cookieOptions, maxAge: REMEMBERED_SESSION_MS } : cookieOptions)
  }

  router.post('/register', async (req, res) => {
    const user = await auth.register(req.body)
    startSession(res, user.id, req.body)
    res.status(201).json(user)
  })

  router.post('/login', async (req, res) => {
    // La clé combine l'adresse IP et l'e-mail saisi : on bloque un essai répété sans enfermer tout le monde dehors
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const key = `${req.ip}|${email}`
    const wait = limiter.blockedFor(key)
    if (wait > 0) {
      res.set('Retry-After', String(wait))
      throw new HttpError(429, 'Trop de tentatives, réessayez plus tard')
    }

    try {
      const user = await auth.login(req.body)
      limiter.reset(key)
      startSession(res, user.id, req.body)
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
