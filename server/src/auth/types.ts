export interface User {
  id: string
  /** En minuscules */
  email: string
}

export interface Credentials {
  email: string
  password: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Renseigné par le middleware d'authentification quand la session est valide */
      user?: User
    }
  }
}
