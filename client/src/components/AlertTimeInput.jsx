import { useState } from 'react'

function TimeSegment({ value, max, label, onChange }) {
  const [focused, setFocused] = useState(false)
  const [localVal, setLocalVal] = useState('')

  const commit = (raw) => {
    const num = parseInt(raw, 10)
    if (!isNaN(num)) onChange(Math.min(Math.max(0, num), max))
  }

  const handleFocus = (e) => {
    setFocused(true)
    setLocalVal(String(value))
    setTimeout(() => e.target.select(), 0)
  }

  const handleBlur = () => {
    setFocused(false)
    commit(localVal)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange((value + 1) % (max + 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange((value - 1 + max + 1) % (max + 1)) }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    e.deltaY < 0 ? onChange((value + 1) % (max + 1)) : onChange((value - 1 + max + 1) % (max + 1))
  }

  return (
    <div className="spinner-segment">
      <input
        type="text"
        inputMode="numeric"
        value={focused ? localVal : String(value).padStart(2, '0')}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className="spinner-value"
        aria-label={label}
      />
      <span className="text-xs font-display text-white/30 mt-0.5 uppercase tracking-widest">{label}</span>
    </div>
  )
}

/**
 * HH:MM directly-editable input component.
 * Props:
 *   value: { hours: number, minutes: number }
 *   onChange: (newValue) => void
 */
export function AlertTimeInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <TimeSegment
        value={value.hours}
        max={99}
        label="HH"
        onChange={h => onChange({ ...value, hours: h })}
      />
      <span className="timer-digit text-2xl font-bold text-white/30 pb-4">:</span>
      <TimeSegment
        value={value.minutes}
        max={59}
        label="MM"
        onChange={m => onChange({ ...value, minutes: m })}
      />
    </div>
  )
}
