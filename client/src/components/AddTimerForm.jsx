import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTimeInput } from './AlertTimeInput.jsx'
import { hmToMs, formatHM } from '../utils/formatTime.js'

/**
 * Slide-up panel for creating a new timer with optional alerts.
 * Alerts are objects: { elapsed_ms, interval_ms } where interval_ms is set
 * for looping (repeating) alerts and null for one-time alerts.
 */
export function AddTimerForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [alerts, setAlerts] = useState([])
  const [newAlert, setNewAlert] = useState({ hours: 0, minutes: 0 })
  const [loop, setLoop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addAlert = () => {
    const ms = hmToMs(newAlert.hours, newAlert.minutes)
    if (ms === 0) return
    setAlerts(prev => [
      ...prev,
      loop ? { elapsed_ms: ms, interval_ms: ms } : { elapsed_ms: ms, interval_ms: null }
    ])
    setNewAlert({ hours: 0, minutes: 0 })
  }

  const removeAlert = (i) => setAlerts(prev => prev.filter((_, idx) => idx !== i))
  const duplicateAlert = (i) => setAlerts(prev => [...prev, prev[i]])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Timer name is required'); return }
    setLoading(true)
    setError('')
    try {
      // Auto-include any pending alert time that the user configured but didn't explicitly click "Add" for
      let finalAlerts = [...alerts]
      const pendingMs = hmToMs(newAlert.hours, newAlert.minutes)
      if (pendingMs > 0) {
        finalAlerts = [...finalAlerts, loop
          ? { elapsed_ms: pendingMs, interval_ms: pendingMs }
          : { elapsed_ms: pendingMs, interval_ms: null }
        ]
      }
      await onAdd({ name: name.trim(), alerts: finalAlerts })
      onCancel()
    } catch {
      setError('Failed to create timer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="glass-card rounded-2xl p-5 mb-4"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-700 text-white text-base">New Timer</h3>
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          onClick={onCancel}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-display text-xs uppercase tracking-widest text-white/40 mb-1.5">
            Timer Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Morning Standup"
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3.5 py-2.5 text-white font-display text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            autoFocus
          />
        </div>

        {/* Alerts */}
        <div>
          <label className="block font-display text-xs uppercase tracking-widest text-white/40 mb-3">
            Alerts (optional)
          </label>

          {/* Existing alerts */}
          <AnimatePresence>
            {alerts.length > 0 && (
              <motion.div
                className="space-y-1.5 mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {alerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      {alert.interval_ms ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 flex-shrink-0">
                          <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                      ) : null}
                      <span className="timer-digit text-indigo-300 text-sm font-500">
                        {alert.interval_ms
                          ? `every ${formatHM(alert.interval_ms)}`
                          : `at ${formatHM(alert.elapsed_ms)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Duplicate"
                        className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
                        onClick={() => duplicateAlert(i)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        onClick={() => removeAlert(i)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add new alert row */}
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06] space-y-2.5">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="font-display text-xs text-white/30 mb-2">
                  {loop ? 'Repeat every' : 'Alert at'}
                </p>
                <AlertTimeInput value={newAlert} onChange={setNewAlert} />
              </div>
              <button
                type="button"
                className="flex-shrink-0 h-9 px-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-display text-xs font-600 hover:bg-indigo-500/30 transition-all flex items-center gap-1.5 mb-4"
                onClick={addAlert}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add
              </button>
            </div>

            {/* Loop toggle */}
            <button
              type="button"
              onClick={() => setLoop(v => !v)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-display font-500 transition-all ${
                loop
                  ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              Repeat (loop)
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 font-display text-xs">{error}</p>
        )}

        <div className="flex gap-2.5 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Creating…' : 'Create Timer'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
