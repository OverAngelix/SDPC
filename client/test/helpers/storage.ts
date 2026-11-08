import { vi } from 'vitest'

/** Remplace le stockage du navigateur par une table en mémoire, renvoyée pour lire ce qui y est écrit. */
export function stubStorage (initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  })
  return data
}

/** Un stockage qui refuse tout, comme certaines navigations privées. */
export function stubRefusedStorage () {
  const refuse = () => {
    throw new Error('refusé')
  }
  vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse, removeItem: refuse })
}
