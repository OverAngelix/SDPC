import 'dotenv/config'
import type { Request, Response } from 'express'
import express from 'express'
import cors from 'cors'

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port}`)
})
