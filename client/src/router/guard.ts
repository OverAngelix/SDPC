import type { RouteLocationRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page accessible sans être connecté (connexion, création de compte) */
    public?: boolean
  }
}

export interface GuardTarget {
  fullPath: string
  meta: { public?: boolean }
}

/**
 * Où aller après une connexion : l'adresse demandée avant d'être renvoyé à la connexion, si elle est interne
 * au site (jamais une adresse externe comme `//autre.site`) et n'est pas elle-même une page publique.
 */
export function safeRedirect (value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/'
  }
  if (value === '/login' || value === '/register') {
    return '/'
  }
  return value
}

/** `true` pour laisser passer, sinon la destination de remplacement. */
export function guardRoute (to: GuardTarget, loggedIn: boolean): true | RouteLocationRaw {
  if (to.meta.public === true) {
    return loggedIn ? { path: '/' } : true
  }
  if (loggedIn) {
    return true
  }
  return to.fullPath === '/' ? { name: 'login' } : { name: 'login', query: { redirect: to.fullPath } }
}
