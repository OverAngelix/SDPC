import type { Request, Response } from 'express'
import express from 'express'
import cors from 'cors'

export function createApp () {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  return app
}
