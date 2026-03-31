import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  getSession,
  createTimer,
  getTimerWithAlerts,
  getTimersWithAlerts,
  updateTimer,
  deleteTimer,
  createAlert,
  deleteAlertsForTimer
} from '../db.js'

const router = Router()

// GET all timers for a session
router.get('/sessions/:sessionId/timers', (req, res) => {
  if (!getSession(req.params.sessionId)) {
    return res.status(404).json({ error: 'Session not found' })
  }
  res.json({
    server_time: Date.now(),
    timers: getTimersWithAlerts(req.params.sessionId)
  })
})

// Normalise an alert entry from the request body.
// Accepts either a plain number (legacy: elapsed_ms) or
// an object { elapsed_ms, interval_ms? }.
function parseAlertEntry(entry) {
  if (typeof entry === 'number') return { elapsed_ms: entry, interval_ms: null }
  if (entry && typeof entry === 'object') {
    const elapsed_ms  = typeof entry.elapsed_ms  === 'number' ? entry.elapsed_ms  : 0
    const interval_ms = typeof entry.interval_ms === 'number' ? entry.interval_ms : null
    return { elapsed_ms, interval_ms }
  }
  return null
}

// POST create timer
router.post('/sessions/:sessionId/timers', (req, res) => {
  if (!getSession(req.params.sessionId)) {
    return res.status(404).json({ error: 'Session not found' })
  }
  const { name, alerts = [] } = req.body
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' })
  }

  const timerId = uuidv4()
  const now = Date.now()
  createTimer({ id: timerId, session_id: req.params.sessionId, name: name.trim(), now })

  alerts.forEach((entry, i) => {
    const parsed = parseAlertEntry(entry)
    if (!parsed) return
    const { elapsed_ms, interval_ms } = parsed
    // Valid if it's a loop alert (interval_ms > 0) or a one-time alert (elapsed_ms > 0)
    if ((interval_ms && interval_ms > 0) || elapsed_ms > 0) {
      createAlert({ id: uuidv4(), timer_id: timerId, elapsed_ms, interval_ms, sort_order: i })
    }
  })

  res.status(201).json(getTimerWithAlerts(timerId))
})

// PATCH update timer name/alerts
router.patch('/timers/:id', (req, res) => {
  const timer = getTimerWithAlerts(req.params.id)
  if (!timer) return res.status(404).json({ error: 'Timer not found' })

  const { name, alerts } = req.body
  if (name && typeof name === 'string') {
    updateTimer(req.params.id, { name: name.trim() })
  }
  if (Array.isArray(alerts)) {
    deleteAlertsForTimer(req.params.id)
    alerts.forEach((entry, i) => {
      const parsed = parseAlertEntry(entry)
      if (!parsed) return
      const { elapsed_ms, interval_ms } = parsed
      if ((interval_ms && interval_ms > 0) || elapsed_ms > 0) {
        createAlert({ id: uuidv4(), timer_id: req.params.id, elapsed_ms, interval_ms, sort_order: i })
      }
    })
  }

  res.json(getTimerWithAlerts(req.params.id))
})

// POST start timer
router.post('/timers/:id/start', (req, res) => {
  const timer = getTimerWithAlerts(req.params.id)
  if (!timer) return res.status(404).json({ error: 'Timer not found' })
  if (timer.status === 'ACTIVE') return res.status(400).json({ error: 'Already active' })

  const raw = Number(req.body?.initial_elapsed_ms) || 0
  const initialElapsedMs = Math.max(0, Math.min(raw, 48 * 60 * 60 * 1000)) // cap at 48h
  updateTimer(req.params.id, { status: 'ACTIVE', started_at: Date.now() - initialElapsedMs })
  res.json(getTimerWithAlerts(req.params.id))
})

// POST stop timer
router.post('/timers/:id/stop', (req, res) => {
  const timer = getTimerWithAlerts(req.params.id)
  if (!timer) return res.status(404).json({ error: 'Timer not found' })

  updateTimer(req.params.id, { status: 'READY', started_at: null })
  res.json(getTimerWithAlerts(req.params.id))
})

// DELETE timer
router.delete('/timers/:id', (req, res) => {
  if (!getTimerWithAlerts(req.params.id)) {
    return res.status(404).json({ error: 'Timer not found' })
  }
  deleteTimer(req.params.id)
  res.json({ ok: true })
})

export default router
