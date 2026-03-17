import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTimeInput } from './AlertTimeInput.jsx'
import { hmToMs, formatHM } from '../utils/formatTime.js'

/**
 * Modal for editing an existing timer's name and alerts.
 */
export function EditTimerModal({ timer, onSave, onClose }) {
  const [name, setName] = useState(timer.name)
  const [alerts, setAlerts] = useState(
    (timer.alerts || []).map(a => ({ elapsed_ms: a.elapsed_ms, interval_ms: a.interval_ms ?? null }))
  )
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Timer name is required'); return }
    setLoading(true)
    setError('')
    try {
      let finalAlerts = [...alerts]
      const pendingMs = hmToMs(newAlert.hours, newAlert.minutes)
      if (pendingMs > 0) {
        finalAlerts = [...finalAlerts, loop
          ? { elapsed_ms: pendingMs, interval_ms: pendingMs }
          : { elapsed_ms: pendingMs, interval_ms: null }
        ]
      }
      await onSave({ name: name.trim(), alerts: finalAlerts })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm glass-card rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display text-xs text-white/40 uppercase tracking-widest">Edit Timer</p>
            <h3 className="font-display font-700 text-white text-base mt-0.5">Configure alerts</h3>
          </div>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            onClick={onClose}
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
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3.5 py-2.5 text-white font-display text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* Alerts list */}
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-white/40 mb-3">
              Alerts
            </label>

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
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        onClick={() => removeAlert(i)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {alerts.length === 0 && (
              <p className="text-white/25 font-display text-xs mb-3 px-1">No alerts — add one below</p>
            )}

            {/* Add new alert */}
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

          {error && <p className="text-red-400 font-display text-xs">{error}</p>}

          <div className="flex gap-2.5 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
