import type { Response } from 'express'
import { Router } from 'express'
import { currentUserId, SESSION_COOKIE, sessionCookieOptions, sessionToken } from '../auth/middleware.js'
import type { LoginLimiter } from '../auth/loginLimiter.js'
import { HttpError } from '../errors.js'
import type { AuthRouterOptions } from '../interfaces/auth.js'
import type { AccountStore } from './store.js'

export function accountRouter (account: AccountStore, limiter: LoginLimiter, { secureCookie }: AuthRouterOptions) {
  const router = Router()

  /**
   * Un mot de passe faux (403) compte comme un essai raté : une session volée ne sert pas à le deviner.
   * Une seule série d'essais par personne, que ce soit pour changer le mot de passe ou supprimer le compte.
   */
  async function guarded (res: Response, userId: string, action: () => Promise<void>): Promise<void> {
    const key = `account|${userId}`
    const wait = limiter.blockedFor(key)
    if (wait > 0) {
      res.set('Retry-After', String(wait))
      throw new HttpError(429, 'too_many_attempts', 'Trop de tentatives, réessayez plus tard')
    }

    try {
      await action()
      limiter.reset(key)
    } catch (error) {
      if (error instanceof HttpError && error.status === 403) limiter.recordFailure(key)
      throw error
    }
  }

  router.put('/password', async (req, res) => {
    const userId = currentUserId(req)
    await guarded(res, userId, () => account.changePassword(userId, req.body, sessionToken(req)))
    res.status(204).end()
  })

  router.delete('/', async (req, res) => {
    const userId = currentUserId(req)
    await guarded(res, userId, () => account.deleteAccount(userId, req.body))
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(secureCookie))
    res.status(204).end()
  })

  return router
}
