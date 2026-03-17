import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatHMS, formatHM } from '../utils/formatTime.js'
import { getNextAlert } from '../utils/alertLogic.js'
import { AlertList } from './AlertList.jsx'
import { DismissBar } from './DismissBar.jsx'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import { EditTimerModal } from './EditTimerModal.jsx'

/**
 * Single timer card with collapsed/expanded states.
 */
export function TimerCard({ timer, getNow, buzzingAlert, onStart, onStop, onDelete, onDismissBuzz, onDuplicate, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [confirmAction, setConfirmAction] = useState(null) // 'stop' | 'delete' | null
  const [showDup, setShowDup] = useState(false)
  const [dupName, setDupName] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const intervalRef = useRef(null)

  const isActive = timer.status === 'ACTIVE'
  const isBuzzing = buzzingAlert != null

  // Live tick
  useEffect(() => {
    const update = () => {
      if (isActive && timer.started_at) {
        setElapsed(getNow() - timer.started_at)
      }
    }
    update()
    if (isActive) {
      intervalRef.current = setInterval(update, 250)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, timer.started_at, getNow])

  const nextAlertMs = isActive ? getNextAlert(elapsed, timer.alerts || []) : null

  const cardClass = isBuzzing
    ? 'glass-card glass-card-alert alert-ring'
    : isActive
    ? 'glass-card glass-card-active'
    : 'glass-card'

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return
    setExpanded(v => !v)
  }

  const handleStop = (e) => {
    e.stopPropagation()
    setConfirmAction('stop')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setConfirmAction('delete')
  }

  const handleDuplicate = (e) => {
    e.stopPropagation()
    setDupName(`Copy of ${timer.name}`)
    setShowDup(true)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowEdit(true)
  }

  const handleDupConfirm = async () => {
    if (!dupName.trim()) return
    await onDuplicate(timer.id, dupName.trim())
    setShowDup(false)
  }

  const handleConfirm = async () => {
    try {
      if (confirmAction === 'stop') await onStop(timer.id)
      if (confirmAction === 'delete') await onDelete(timer.id)
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <>
      <motion.div
        className={`${cardClass} rounded-2xl p-4 cursor-pointer select-none transition-all duration-300`}
        layout
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={handleCardClick}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-700 text-white text-base leading-tight truncate">
              {timer.name}
            </h3>
            {/* Status badge */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center gap-1 text-xs font-display font-600 uppercase tracking-widest ${
                isActive ? 'text-indigo-400' : 'text-white/30'
              }`}>
                {isActive && (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {isActive ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isActive && (
              <motion.button
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-500 text-white font-display font-600 text-xs hover:bg-indigo-400 transition-all shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                whileTap={{ scale: 0.96 }}
                onClick={e => { e.stopPropagation(); onStart(timer.id) }}
              >
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                  <path d="M0 0L10 6L0 12V0Z"/>
                </svg>
                Start
              </motion.button>
            )}
            {isActive && (
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="Stop timer"
                onClick={handleStop}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="0" y="0" width="10" height="10" rx="1.5"/>
                </svg>
              </button>
            )}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all"
              title="Edit alerts"
              onClick={handleEdit}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all"
              title="Duplicate timer"
              onClick={handleDuplicate}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              title="Delete timer"
              onClick={handleDelete}
            >
              <svg width="13" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div className="mb-3">
          {isActive ? (
            <div className={`timer-digit font-mono leading-none font-700 ${
              isBuzzing
                ? 'text-4xl sm:text-5xl glow-red text-red-300'
                : 'text-4xl sm:text-5xl glow-indigo text-white'
            }`}>
              {formatHMS(elapsed)}
            </div>
          ) : (
            <div className="timer-digit font-mono text-4xl sm:text-5xl font-300 text-white/20 leading-none">
              00:00:00
            </div>
          )}
        </div>

        {/* Next alert row */}
        <div className="flex items-center justify-between min-h-[24px]">
          {nextAlertMs != null ? (
            <div className="flex items-center gap-2 text-amber-400/80">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="font-display text-xs font-500">
                Next alert at <span className="timer-digit font-mono font-700 text-amber-300">{formatHM(nextAlertMs)}</span>
              </span>
            </div>
          ) : isActive && (timer.alerts?.length ?? 0) > 0 ? (
            <span className="font-display text-xs text-white/20">All alerts passed</span>
          ) : isActive ? (
            <span className="font-display text-xs text-white/20">No alerts set</span>
          ) : (
            <span className="font-display text-xs text-white/20">
              {(timer.alerts?.length ?? 0) > 0 ? `${timer.alerts.length} alert${timer.alerts.length > 1 ? 's' : ''} configured` : 'No alerts'}
            </span>
          )}

          {/* Expand toggle */}
          <motion.div
            className="ml-auto text-white/25 hover:text-white/50 transition-colors"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </motion.div>
        </div>

        {/* Dismiss bar (alert active) */}
        <AnimatePresence>
          {isBuzzing && (
            <motion.div
              className="mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DismissBar
                timerName={timer.name}
                buzzingAlert={buzzingAlert}
                onDismiss={() => onDismissBuzz(timer.id, buzzingAlert)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded alert list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-3 border-t border-white/[0.06]">
                <AlertList
                  alerts={timer.alerts}
                  elapsedMs={elapsed}
                  isActive={isActive}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction === 'stop'}
        title={`Stop "${timer.name}"?`}
        confirmLabel="Stop Timer"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'delete'}
        title={`Delete "${timer.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Edit timer modal */}
      <AnimatePresence>
        {showEdit && (
          <EditTimerModal
            timer={timer}
            onSave={async (data) => { await onEdit(timer.id, data) }}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>

      {/* Duplicate dialog */}
      <AnimatePresence>
        {showDup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDup(false)}
            />
            <motion.div
              className="relative w-full max-w-sm glass-card rounded-2xl p-6 z-10"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-display text-sm text-white/40 uppercase tracking-widest mb-1">Duplicate Timer</p>
              <h3 className="font-display text-lg font-700 text-white mb-5 leading-snug">
                Name for the new timer
              </h3>
              <input
                type="text"
                value={dupName}
                onChange={e => setDupName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDupConfirm() }}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3.5 py-2.5 text-white font-display text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all mb-5"
                autoFocus
              />
              <div className="flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setShowDup(false)}>Cancel</button>
                <button className="btn-primary flex-1" onClick={handleDupConfirm} disabled={!dupName.trim()}>
                  Duplicate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
