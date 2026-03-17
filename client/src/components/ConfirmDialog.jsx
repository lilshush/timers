import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Two-step confirmation modal.
 * Props:
 *   open: boolean
 *   title: string (e.g. "Stop 'Morning Block'?")
 *   onConfirm: () => void
 *   onCancel: () => void
 *   confirmLabel?: string (default "Stop Timer")
 *   danger?: boolean
 */
export function ConfirmDialog({ open, title, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true }) {
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (open) setStep(1)
  }, [open])

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2)
    } else {
      onConfirm()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-sm glass-card rounded-2xl p-6 z-10"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Step indicator */}
            <div className="flex gap-1.5 mb-5">
              <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-white/40' : 'bg-white/10'}`} />
              <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-red-400' : 'bg-white/10'}`} />
            </div>

            <p className="font-display text-sm text-white/40 uppercase tracking-widest mb-1">
              {step === 1 ? 'Confirmation required' : 'Final confirmation'}
            </p>

            <AnimatePresence mode="wait">
              <motion.h3
                key={step}
                className="font-display text-lg font-700 text-white mb-6 leading-snug"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 ? title : 'Are you absolutely sure? This cannot be undone.'}
              </motion.h3>
            </AnimatePresence>

            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={onCancel}>
                Cancel
              </button>
              <button
                className={`flex-1 rounded-lg px-5 py-2.5 font-display font-600 text-sm transition-all duration-150 ${
                  danger
                    ? step === 2
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-400'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                    : 'btn-primary'
                }`}
                onClick={handleConfirm}
              >
                {step === 1 ? confirmLabel : 'Yes, proceed'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
