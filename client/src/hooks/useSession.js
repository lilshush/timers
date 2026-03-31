import { useState, useEffect } from 'react'

const SESSION_STORAGE_KEY = 'timer_session_id'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('session')
    let fromStorage = null
    try { fromStorage = localStorage.getItem(SESSION_STORAGE_KEY) } catch {}
    const candidate = fromUrl || fromStorage
    const existing = candidate && UUID_RE.test(candidate) ? candidate : null

    if (existing) {
      // Verify session exists on server
      fetch(`/api/sessions/${existing}`)
        .then(r => {
          if (r.ok) {
            setSessionId(existing)
            persistSessionId(existing)
          } else {
            // Session not found — create a new one
            return createSession()
          }
        })
        .catch(() => createSession())
        .finally(() => setLoading(false))
    } else {
      createSession().finally(() => setLoading(false))
    }
  }, [])

  function persistSessionId(id) {
    try { localStorage.setItem(SESSION_STORAGE_KEY, id) } catch {}
    const url = new URL(window.location.href)
    url.searchParams.set('session', id)
    window.history.replaceState({}, '', url.toString())
  }

  async function createSession() {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const data = await res.json()
      const newId = data.id
      setSessionId(newId)
      persistSessionId(newId)
    } catch (e) {
      setError('Failed to connect to server. Is it running?')
    }
  }

  return { sessionId, loading, error }
}
