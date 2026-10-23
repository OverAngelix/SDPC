// Seules les adresses http et https sont autorisées pour une action
export function isHttpUrl (value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
