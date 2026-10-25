import { describe, expect, it } from 'vitest'
import { guardRoute, safeRedirect } from '@/router/guard'

const page = (fullPath: string) => ({ fullPath, meta: {} })
const publicPage = (fullPath: string) => ({ fullPath, meta: { public: true } })

describe('guardRoute', () => {
  it('laisse passer une personne connectée sur une page protégée', () => {
    expect(guardRoute(page('/config'), true)).toBe(true)
  })

  it('renvoie une personne non connectée à la connexion, en retenant la page demandée', () => {
    expect(guardRoute(page('/config/folder/abc'), false)).toEqual({ name: 'login', query: { redirect: '/config/folder/abc' } })
  })

  it('ne retient pas la page d\'accueil', () => {
    expect(guardRoute(page('/'), false)).toEqual({ name: 'login' })
  })

  it('laisse une personne non connectée sur les pages publiques', () => {
    expect(guardRoute(publicPage('/login'), false)).toBe(true)
    expect(guardRoute(publicPage('/register'), false)).toBe(true)
  })

  it('renvoie une personne déjà connectée de la connexion vers la grille', () => {
    expect(guardRoute(publicPage('/login'), true)).toEqual({ path: '/' })
  })
})

describe('safeRedirect', () => {
  it('garde une adresse interne du site, requête comprise', () => {
    expect(safeRedirect('/config')).toBe('/config')
    expect(safeRedirect('/folder/abc?x=1')).toBe('/folder/abc?x=1')
  })

  it('revient à l\'accueil sans valeur, avec autre chose qu\'un texte ou avec une adresse externe', () => {
    for (const value of [undefined, null, 42, ['/config'], '', 'config', 'https://autre.site', '//autre.site', String.raw`\\autre.site`, String.raw`/\autre.site`]) {
      expect(safeRedirect(value)).toBe('/')
    }
  })

  it('ne renvoie pas vers une page publique', () => {
    expect(safeRedirect('/login')).toBe('/')
    expect(safeRedirect('/register')).toBe('/')
  })
})
