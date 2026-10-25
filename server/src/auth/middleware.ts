import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { HttpError } from '../errors.js'
import type { AuthStore } from './store.js'

export const SESSION_COOKIE = 'sdpc_session'

/** Valeur d'un cookie de la requête (analyse minimale de l'en-tête `Cookie`). */
export function readCookie (req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=')
    if (separator !== -1 && part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim())
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

/** Jeton de session de la requête, s'il y en a un. */
export function sessionToken (req: Request): string | undefined {
  return readCookie(req, SESSION_COOKIE)
}

/** Renseigne `req.user` quand le cookie de session est valide ; ne refuse jamais la requête. */
export function authenticate (auth: AuthStore): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = sessionToken(req)
    req.user = token === undefined ? undefined : auth.userForSession(token)
    next()
  }
}

/** Refuse (401) les requêtes sans session valide. À placer après `authenticate`. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (req.user === undefined) throw new HttpError(401, 'Connexion requise')
  next()
}
