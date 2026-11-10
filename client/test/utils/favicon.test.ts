import { describe, expect, it } from 'vitest'
import { faviconUrl } from '@/utils/favicon'

const SERVICE = 'https://www.google.com/s2/favicons?domain='

describe('faviconUrl', () => {
  it('ne transmet que le domaine, sans chemin, requête ni port', () => {
    expect(faviconUrl('https://github.com/OverAngelix/sdpc?tab=readme')).toBe(`${SERVICE}github.com&sz=128`)
    expect(faviconUrl('https://intranet.exemple.fr:8443/outil')).toBe(`${SERVICE}intranet.exemple.fr&sz=128`)
    expect(faviconUrl('  https://www.wikipedia.org  ')).toBe(`${SERVICE}www.wikipedia.org&sz=128`)
  })

  it('renvoie null pour une URL absente, invalide ou qui n\'est pas http(s)', () => {
    for (const url of [undefined, '', 'github.com', 'ftp://exemple.fr', 'javascript:alert(1)']) {
      expect(faviconUrl(url), String(url)).toBeNull()
    }
  })
})
