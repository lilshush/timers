import { useState, useEffect } from 'react'

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const existing = params.get('session')

    if (existing) {
      // Verify session exists on server
      fetch(`/api/sessions/${existing}`)
        .then(r => {
          if (r.ok) {
            setSessionId(existing)
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

  async function createSession() {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const data = await res.json()
      const newId = data.id
      setSessionId(newId)
      const url = new URL(window.location.href)
      url.searchParams.set('session', newId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {
      setError('Failed to connect to server. Is it running?')
    }
  }

  return { sessionId, loading, error }
}
