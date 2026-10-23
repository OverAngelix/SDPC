import { describe, expect, it } from 'vitest'
import { isHttpUrl } from '@/utils/url'

describe('isHttpUrl', () => {
  it('accepte http et https', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('https://www.youtube.com/watch?v=1')).toBe(true)
  })

  it('refuse les autres schémas', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('data:text/html,<p>x</p>')).toBe(false)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
  })

  it('refuse ce qui n\'est pas une URL absolue', () => {
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
    expect(isHttpUrl('/config')).toBe(false)
  })
})
