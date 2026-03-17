import { motion } from 'framer-motion'
import { formatHM } from '../utils/formatTime.js'

/**
 * Full-width dismiss button shown while a timer is buzzing.
 * buzzingAlert: { alertId, occurrenceTime, interval_ms, occurrence }
 */
export function DismissBar({ timerName, buzzingAlert, onDismiss }) {
  const label = buzzingAlert?.interval_ms
    ? `every ${formatHM(buzzingAlert.interval_ms)}`
    : `at ${formatHM(buzzingAlert?.occurrenceTime ?? 0)}`

  return (
    <motion.button
      className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl alert-ring"
      style={{
        background: 'rgba(239, 68, 68, 0.18)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onClick={e => { e.stopPropagation(); onDismiss() }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Bell icon */}
        <motion.div
          animate={{ rotate: [-8, 8, -8, 8, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </motion.div>
        <div className="text-left">
          <p className="text-red-300 font-display font-600 text-sm leading-none">ALERT — {label}</p>
          <p className="text-red-400/70 font-display text-xs mt-0.5 truncate max-w-[140px]">{timerName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-red-300 font-display font-600 text-sm">
        <span>Dismiss</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
    </motion.button>
  )
}
