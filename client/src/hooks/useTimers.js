import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_INTERVAL = 5000

export function useTimers(sessionId) {
  const [timers, setTimers] = useState([])
  const [loading, setLoading] = useState(true)
  const clockOffsetRef = useRef(0) // server_time - client Date.now()

  const fetchTimers = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/sessions/${sessionId}/timers`)
      if (!res.ok) return
      const data = await res.json()
      clockOffsetRef.current = data.server_time - Date.now()
      setTimers(data.timers)
      setLoading(false)
    } catch {}
  }, [sessionId])

  useEffect(() => {
    fetchTimers()
    const interval = setInterval(fetchTimers, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchTimers])

  // Returns calibrated server-time-aligned now in ms
  const now = useCallback(() => Date.now() + clockOffsetRef.current, [])

  const addTimer = useCallback(async ({ name, alerts }) => {
    const res = await fetch(`/api/sessions/${sessionId}/timers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, alerts })
    })
    if (!res.ok) throw new Error('Failed to create timer')
    const timer = await res.json()
    setTimers(prev => [...prev, timer])
    // Refresh from server to guarantee alerts are in sync
    fetchTimers()
    return timer
  }, [sessionId, fetchTimers])

  const startTimer = useCallback(async (timerId) => {
    const res = await fetch(`/api/timers/${timerId}/start`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to start timer')
    const timer = await res.json()
    setTimers(prev => prev.map(t => t.id === timerId ? timer : t))
  }, [])

  const stopTimer = useCallback(async (timerId) => {
    const res = await fetch(`/api/timers/${timerId}/stop`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to stop timer')
    const timer = await res.json()
    setTimers(prev => prev.map(t => t.id === timerId ? timer : t))
  }, [])

  const deleteTimer = useCallback(async (timerId) => {
    const res = await fetch(`/api/timers/${timerId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete timer')
    setTimers(prev => prev.filter(t => t.id !== timerId))
  }, [])

  const updateTimer = useCallback(async (timerId, { name, alerts }) => {
    const res = await fetch(`/api/timers/${timerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, alerts })
    })
    if (!res.ok) throw new Error('Failed to update timer')
    const timer = await res.json()
    setTimers(prev => prev.map(t => t.id === timerId ? timer : t))
  }, [])

  return { timers, loading, now, addTimer, startTimer, stopTimer, deleteTimer, updateTimer }
}
