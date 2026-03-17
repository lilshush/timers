import { motion } from 'framer-motion'
import { formatHM } from '../utils/formatTime.js'

/**
 * Expanded view showing all configured alert times for a timer.
 */
export function AlertList({ alerts, elapsedMs, isActive }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="mt-3 px-1 py-3 text-center text-white/25 font-display text-sm">
        No alerts configured
      </div>
    )
  }

  const sorted = [...alerts].sort((a, b) => a.elapsed_ms - b.elapsed_ms)

  return (
    <motion.div
      className="mt-3 space-y-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <p className="font-display text-xs uppercase tracking-widest text-white/30 mb-2 px-1">
        Scheduled Alerts
      </p>
      {sorted.map((alert, i) => {
        let isFired, isNear
        if (alert.interval_ms) {
          // Loop alerts never permanently fire; check proximity to next occurrence
          isFired = false
          if (isActive) {
            const n = Math.max(1, Math.ceil(elapsedMs / alert.interval_ms))
            const nextTime = n * alert.interval_ms
            isNear = elapsedMs >= nextTime - 60_000 && elapsedMs < nextTime + 60_000
          } else {
            isNear = false
          }
        } else {
          isFired = isActive && elapsedMs > alert.elapsed_ms + 60_000
          const isUpcoming = isActive && elapsedMs < alert.elapsed_ms - 60_000
          isNear = isActive && !isFired && !isUpcoming
        }

        return (
          <motion.div
            key={alert.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
              isFired
                ? 'bg-white/[0.02] opacity-40'
                : isNear
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-white/[0.04]'
            }`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            <div className="flex items-center gap-2.5">
              {/* Status dot or loop icon */}
              {alert.interval_ms ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${isFired ? 'text-white/20' : isNear ? 'text-amber-400' : 'text-indigo-400'}`}>
                  <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isFired ? 'bg-white/20' : isNear ? 'bg-amber-400' : 'bg-indigo-400'
                }`} />
              )}
              <span className={`timer-digit font-mono text-base font-500 ${
                isFired ? 'text-white/25' : isNear ? 'text-amber-300' : 'text-white/80'
              }`}>
                {alert.interval_ms
                  ? `every ${formatHM(alert.interval_ms)}`
                  : formatHM(alert.elapsed_ms)}
              </span>
            </div>
            <span className={`font-display text-xs ${
              isFired ? 'text-white/20' : isNear ? 'text-amber-400/70' : 'text-white/30'
            }`}>
              {alert.interval_ms
                ? (isFired ? 'Repeating' : isNear ? 'Soon' : 'Loop')
                : (isFired ? 'Passed' : isNear ? 'Soon' : `+${formatHM(alert.elapsed_ms)}`)}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
