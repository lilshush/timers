import { useState, useEffect, useRef, useCallback } from 'react'
import { getAlertState, alertKey } from '../utils/alertLogic.js'
import { BuzzController } from '../utils/audio.js'

/**
 * Manages crescendo alert buzz state across all timers.
 * Returns:
 *   activeBuzzes: Map<timerId, { alertId, occurrenceTime, interval_ms, occurrence }>
 *   dismissBuzz(timerId, { alertId, occurrence }): dismiss and silence the buzz
 */
export function useAlerts(timers, getNow) {
  const [activeBuzzes, setActiveBuzzes] = useState(new Map())
  const buzzersRef   = useRef({})         // timerId -> BuzzController
  const dismissedRef = useRef(new Set())  // alertKey strings that have been dismissed

  const dismissBuzz = useCallback((timerId, { alertId, occurrence }) => {
    const key = alertKey(timerId, alertId, occurrence)
    dismissedRef.current.add(key)
    buzzersRef.current[timerId]?.stop()
    delete buzzersRef.current[timerId]
    setActiveBuzzes(prev => {
      const next = new Map(prev)
      next.delete(timerId)
      return next
    })
  }, [])

  useEffect(() => {
    const tick = () => {
      if (!getNow) return
      const now = getNow()

      const nextBuzzes = new Map()

      for (const timer of timers) {
        if (timer.status !== 'ACTIVE' || !timer.started_at) continue
        const elapsedMs = now - timer.started_at

        for (const alert of (timer.alerts || [])) {
          const { buzzing, volume, occurrence, occurrenceTime } = getAlertState(elapsedMs, alert)
          const key = alertKey(timer.id, alert.id, occurrence)
          if (dismissedRef.current.has(key)) continue

          if (buzzing) {
            nextBuzzes.set(timer.id, {
              alertId: alert.id,
              occurrenceTime,
              interval_ms: alert.interval_ms || null,
              occurrence
            })

            if (!buzzersRef.current[timer.id]) {
              const b = new BuzzController()
              b.start()
              buzzersRef.current[timer.id] = b
            }
            buzzersRef.current[timer.id].setVolume(volume)
            break // only handle one alert per timer at a time
          }
        }

        // Clean up buzzer if no longer buzzing
        if (!nextBuzzes.has(timer.id) && buzzersRef.current[timer.id]) {
          buzzersRef.current[timer.id].stop()
          delete buzzersRef.current[timer.id]
        }
      }

      setActiveBuzzes(prev => {
        // Only update if changed
        if (prev.size === nextBuzzes.size &&
            [...prev].every(([k, v]) => {
              const nv = nextBuzzes.get(k)
              return nv && nv.alertId === v.alertId && nv.occurrence === v.occurrence
            })) return prev
        return nextBuzzes
      })
    }

    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [timers, getNow])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(buzzersRef.current).forEach(b => b.stop())
    }
  }, [])

  return { activeBuzzes, dismissBuzz }
}
