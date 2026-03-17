/**
 * Simple JSON file-based database — no native dependencies required.
 * Data is loaded into memory on startup and persisted to disk on every write.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const dbPath = join(dataDir, 'db.json')

mkdirSync(dataDir, { recursive: true })

// In-memory store
let store = { sessions: {}, timers: {}, alerts: {} }

// Load from disk if exists
if (existsSync(dbPath)) {
  try {
    store = JSON.parse(readFileSync(dbPath, 'utf8'))
    store.sessions = store.sessions || {}
    store.timers   = store.timers   || {}
    store.alerts   = store.alerts   || {}
  } catch {
    console.warn('db.json corrupt — starting fresh')
  }
}

function persist() {
  writeFileSync(dbPath, JSON.stringify(store, null, 2), 'utf8')
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function createSession(id, now) {
  store.sessions[id] = { id, created_at: now }
  persist()
  return store.sessions[id]
}

export function getSession(id) {
  return store.sessions[id] ?? null
}

// ─── Timers ──────────────────────────────────────────────────────────────────

export function createTimer({ id, session_id, name, now }) {
  store.timers[id] = { id, session_id, name, status: 'READY', started_at: null, created_at: now }
  persist()
  return store.timers[id]
}

export function getTimer(id) {
  return store.timers[id] ?? null
}

export function getTimersForSession(session_id) {
  return Object.values(store.timers)
    .filter(t => t.session_id === session_id)
    .sort((a, b) => a.created_at - b.created_at)
}

export function updateTimer(id, fields) {
  if (!store.timers[id]) return null
  store.timers[id] = { ...store.timers[id], ...fields }
  persist()
  return store.timers[id]
}

export function deleteTimer(id) {
  if (!store.timers[id]) return false
  delete store.timers[id]
  // Cascade-delete alerts
  Object.keys(store.alerts)
    .filter(aid => store.alerts[aid].timer_id === id)
    .forEach(aid => delete store.alerts[aid])
  persist()
  return true
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function createAlert({ id, timer_id, elapsed_ms, interval_ms = null, sort_order }) {
  store.alerts[id] = { id, timer_id, elapsed_ms, interval_ms, sort_order }
  persist()
  return store.alerts[id]
}

export function getAlertsForTimer(timer_id) {
  return Object.values(store.alerts)
    .filter(a => a.timer_id === timer_id)
    .sort((a, b) => a.elapsed_ms - b.elapsed_ms)
}

export function deleteAlertsForTimer(timer_id) {
  Object.keys(store.alerts)
    .filter(id => store.alerts[id].timer_id === timer_id)
    .forEach(id => delete store.alerts[id])
  persist()
}

// ─── Helper: timer with alerts ───────────────────────────────────────────────

export function getTimerWithAlerts(id) {
  const timer = getTimer(id)
  if (!timer) return null
  return { ...timer, alerts: getAlertsForTimer(id) }
}

export function getTimersWithAlerts(session_id) {
  return getTimersForSession(session_id).map(t => ({
    ...t,
    alerts: getAlertsForTimer(t.id)
  }))
}
