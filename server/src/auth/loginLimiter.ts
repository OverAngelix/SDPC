const DEFAULT_MAX_FAILURES = 5
const DEFAULT_WINDOW_MS = 15 * 60 * 1000

interface Attempts {
  failures: number
  /** Fin du blocage, mesurée depuis le premier échec de la série */
  until: number
}

/**
 * Limite les essais de connexion échoués par clé (adresse IP et e-mail), en mémoire : après `maxFailures`
 * échecs, la clé est bloquée jusqu'à la fin de la fenêtre. Se vide au redémarrage du serveur.
 */
export class LoginLimiter {
  private readonly attempts = new Map<string, Attempts>()

  constructor (
    private readonly maxFailures = DEFAULT_MAX_FAILURES,
    private readonly windowMs = DEFAULT_WINDOW_MS,
    private readonly now: () => number = Date.now,
  ) {}

  /** Secondes à attendre avant de pouvoir réessayer, 0 si la clé n'est pas bloquée. */
  blockedFor (key: string): number {
    const attempts = this.current(key)
    if (attempts === undefined || attempts.failures < this.maxFailures) return 0
    return Math.max(1, Math.ceil((attempts.until - this.now()) / 1000))
  }

  recordFailure (key: string): void {
    const attempts = this.current(key) ?? { failures: 0, until: this.now() + this.windowMs }
    attempts.failures++
    this.attempts.set(key, attempts)
  }

  reset (key: string): void {
    this.attempts.delete(key)
  }

  // Une série d'échecs dont la fenêtre est écoulée est oubliée
  private current (key: string): Attempts | undefined {
    const attempts = this.attempts.get(key)
    if (attempts !== undefined && attempts.until <= this.now()) {
      this.attempts.delete(key)
      return undefined
    }
    return attempts
  }
}
