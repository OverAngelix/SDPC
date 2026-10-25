import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const COST = 32768
const SALT_LENGTH = 16
// scrypt a besoin d'environ 128 × COST × 8 octets, soit 32 Mo : le plafond par défaut de Node est trop juste
const MAX_MEMORY = 64 * 1024 * 1024

function derive (password: string, salt: Buffer, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: cost, r: 8, p: 1, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

/** Haché auto-descriptif : `scrypt$coût$sel$empreinte` (sel et empreinte en hexadécimal). */
export async function hashPassword (password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await derive(password, salt, COST)
  return `scrypt$${COST}$${salt.toString('hex')}$${key.toString('hex')}`
}

/** Compare en temps constant ; un haché illisible n'est jamais valide. */
export async function verifyPassword (password: string, hash: string): Promise<boolean> {
  const [scheme, cost, salt, key] = hash.split('$')
  if (scheme !== 'scrypt' || !/^\d+$/.test(cost ?? '') || salt === undefined || key === undefined) return false
  const expected = Buffer.from(key, 'hex')
  if (expected.length !== KEY_LENGTH) return false
  const actual = await derive(password, Buffer.from(salt, 'hex'), Number(cost))
  return timingSafeEqual(actual, expected)
}
