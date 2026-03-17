import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimerCard } from './TimerCard.jsx'
import { AddTimerForm } from './AddTimerForm.jsx'
import { ShareBar } from './ShareBar.jsx'
import { useTimers } from '../hooks/useTimers.js'
import { useAlerts } from '../hooks/useAlerts.js'

export function TimerBoard({ sessionId }) {
  const { timers, loading, now, addTimer, startTimer, stopTimer, deleteTimer, updateTimer } = useTimers(sessionId)
  const { activeBuzzes, dismissBuzz } = useAlerts(timers, now)
  const [showForm, setShowForm] = useState(false)

  const duplicateTimer = async (timerId, newName) => {
    const source = timers.find(t => t.id === timerId)
    if (!source) return
    const alerts = (source.alerts || []).map(a => ({
      elapsed_ms: a.elapsed_ms,
      interval_ms: a.interval_ms || null
    }))
    await addTimer({ name: newName, alerts })
  }

  const activeCount = timers.filter(t => t.status === 'ACTIVE').length

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            {/* Logo / title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h1 className="font-display font-800 text-white text-sm leading-none">Timer</h1>
                {activeCount > 0 && (
                  <p className="font-display text-xs text-indigo-400 mt-0.5">
                    {activeCount} running
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareBar />
              <motion.button
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl btn-primary text-xs"
                onClick={() => setShowForm(v => !v)}
                whileTap={{ scale: 0.96 }}
              >
                <motion.svg
                  width="12" height="12"
                  viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  animate={{ rotate: showForm ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </motion.svg>
                <span className="hidden sm:inline">New</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pt-3 pb-8 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Add timer form */}
          <AnimatePresence>
            {showForm && (
              <AddTimerForm
                onAdd={addTimer}
                onCancel={() => setShowForm(false)}
              />
            )}
          </AnimatePresence>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}

          {/* Empty state */}
          {!loading && timers.length === 0 && !showForm && (
            <motion.div
              className="flex flex-col items-center justify-center py-24 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 className="font-display font-700 text-white/40 text-lg mb-2">No timers yet</h2>
              <p className="font-display text-white/25 text-sm mb-6">Create your first timer to get started</p>
              <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>
                Create Timer
              </button>
            </motion.div>
          )}

          {/* Timer grid */}
          {!loading && timers.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {timers.map(timer => (
                  <TimerCard
                    key={timer.id}
                    timer={timer}
                    getNow={now}
                    buzzingAlert={activeBuzzes.get(timer.id) ?? null}
                    onStart={startTimer}
                    onStop={stopTimer}
                    onDelete={deleteTimer}
                    onDismissBuzz={dismissBuzz}
                    onDuplicate={duplicateTimer}
                    onEdit={updateTimer}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
