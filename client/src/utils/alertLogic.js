const BUZZ_PRE_MS  = 60_000   // buzz starts 1 minute before alert mark
const STEP_MS      = 10_000   // volume escalates every 10 seconds
const TOTAL_STEPS  = 12       // 12 steps × 10s = 120s full buzz window

/**
 * For a given elapsed time and an alert object { elapsed_ms, interval_ms? },
 * returns whether we're in the buzz window, the volume (0–1), the current
 * occurrence index (for dismiss keying), and the occurrence's fire time.
 *
 * Loop alerts (interval_ms set) fire at interval_ms * 1, * 2, * 3, ...
 * One-time alerts fire at elapsed_ms.
 */
export function getAlertState(elapsedMs, alert) {
  if (alert.interval_ms) {
    const intervalMs = alert.interval_ms
    // Occurrence n fires at n * intervalMs (n >= 1)
    const n = Math.max(1, Math.ceil(elapsedMs / intervalMs))
    const occurrenceTime = n * intervalMs
    const buzzStart = occurrenceTime - BUZZ_PRE_MS
    const buzzEnd   = occurrenceTime + BUZZ_PRE_MS

    if (elapsedMs >= buzzStart && elapsedMs < buzzEnd) {
      const step = Math.floor((elapsedMs - buzzStart) / STEP_MS)
      const rampProgress = Math.min(1.0, 0.3 + 0.7 * step / (TOTAL_STEPS - 1))
      return { buzzing: true, volume: rampProgress, occurrence: n, occurrenceTime }
    }
    return { buzzing: false, volume: 0, occurrence: n, occurrenceTime }
  }

  // One-time alert
  const alertElapsedMs = alert.elapsed_ms
  const buzzStart = alertElapsedMs - BUZZ_PRE_MS
  const buzzEnd   = alertElapsedMs + BUZZ_PRE_MS

  if (elapsedMs < buzzStart || elapsedMs >= buzzEnd) {
    return { buzzing: false, volume: 0, occurrence: 0, occurrenceTime: alertElapsedMs }
  }

  const step = Math.floor((elapsedMs - buzzStart) / STEP_MS)
  const rampProgress = Math.min(1.0, 0.3 + 0.7 * step / (TOTAL_STEPS - 1))
  return { buzzing: true, volume: rampProgress, occurrence: 0, occurrenceTime: alertElapsedMs }
}

/**
 * Returns the next alert fire time that hasn't passed yet (buzz window end).
 */
export function getNextAlert(elapsedMs, alerts) {
  if (!alerts || alerts.length === 0) return null

  const times = []
  for (const alert of alerts) {
    if (alert.interval_ms) {
      const intervalMs = alert.interval_ms
      const n = Math.max(1, Math.ceil(elapsedMs / intervalMs))
      const nextTime = n * intervalMs
      if (nextTime + BUZZ_PRE_MS > elapsedMs) times.push(nextTime)
    } else {
      if (alert.elapsed_ms + BUZZ_PRE_MS > elapsedMs) times.push(alert.elapsed_ms)
    }
  }

  times.sort((a, b) => a - b)
  return times[0] ?? null
}

/**
 * Alert dismiss key. Includes occurrence so dismissing one ring of a loop
 * alert doesn't suppress future occurrences.
 */
export function alertKey(timerId, alertId, occurrence = 0) {
  return `${timerId}:${alertId}:${occurrence}`
}
