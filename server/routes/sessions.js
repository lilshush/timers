import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createSession, getSession } from '../db.js'

const router = Router()

router.post('/', (_req, res) => {
  const id = uuidv4()
  const session = createSession(id, Date.now())
  res.json(session)
})

router.get('/:id', (req, res) => {
  const session = getSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  res.json(session)
})

export default router
