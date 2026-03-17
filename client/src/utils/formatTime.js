/**
 * Format milliseconds to HH:MM:SS
 */
export function formatHMS(ms) {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Format milliseconds to HH:MM (for alert display)
 */
export function formatHM(ms) {
  if (ms < 0) ms = 0
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Parse HH:MM string to milliseconds
 */
export function parseHMtoMs(hm) {
  const [h, m] = hm.split(':').map(Number)
  return ((h || 0) * 3600 + (m || 0) * 60) * 1000
}

/**
 * Convert hours and minutes to milliseconds
 */
export function hmToMs(hours, minutes) {
  return (hours * 3600 + minutes * 60) * 1000
}

/**
 * Extract hours and minutes from milliseconds
 */
export function msToHM(ms) {
  const totalMin = Math.floor(ms / 60000)
  return {
    hours: Math.floor(totalMin / 60),
    minutes: totalMin % 60
  }
}
