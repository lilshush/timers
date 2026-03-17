/**
 * Beeping timer buzz controller using Web Audio API.
 * Produces short beeps that get faster and louder as the alert escalates.
 * No audio files required — built entirely from oscillators.
 *
 * iOS/Safari requires AudioContext to be created and resumed from a user
 * gesture. We keep a single shared context, unlock it on first tap/click,
 * and resume it every time we start buzzing (iOS re-suspends on tab switch).
 */

// ─── Shared AudioContext ──────────────────────────────────────────────────────

let sharedCtx = null

function getCtx() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return sharedCtx
}

// Unlock on the very first user interaction — required by iOS/Safari.
function unlockOnGesture() {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {}
}
document.addEventListener('touchstart', unlockOnGesture, { passive: true })
document.addEventListener('click', unlockOnGesture)

// ─── BuzzController ───────────────────────────────────────────────────────────

export class BuzzController {
  constructor() {
    this.oscillator = null
    this.gain = null
    this.active = false
    this._volume = 0      // 0–1, updated by setVolume every second
    this._beepTimer = null
  }

  start() {
    if (this.active) return
    try {
      const ctx = getCtx()
      // Resume in case iOS suspended the context (e.g. after tab switch)
      if (ctx.state === 'suspended') ctx.resume()

      this.oscillator = ctx.createOscillator()
      this.gain = ctx.createGain()

      this.oscillator.connect(this.gain)
      this.gain.connect(ctx.destination)

      // Square wave at 880 Hz — sharp, attention-grabbing timer beep
      this.oscillator.type = 'square'
      this.oscillator.frequency.value = 880
      this.gain.gain.value = 0

      this.oscillator.start()
      this.active = true
      this._scheduleBeep()
    } catch (e) {
      console.warn('Audio not available:', e)
    }
  }

  /**
   * Schedule the next beep. Calls itself recursively at a rate that
   * increases with volume: slow beeps (every 2 s) at low volume,
   * rapid beeps (every 250 ms) at full volume.
   */
  _scheduleBeep() {
    if (!this.active) return

    const ctx = getCtx()
    const vol = this._volume
    // Beep interval shrinks as volume grows: 2000 ms → 250 ms
    const intervalMs = Math.round(2000 - vol * 1750)
    const beepDuration = 0.07 // 70 ms tone burst

    if (this.gain) {
      const now = ctx.currentTime
      // Silence → tone burst → silence
      this.gain.gain.cancelScheduledValues(now)
      this.gain.gain.setValueAtTime(0, now)
      this.gain.gain.linearRampToValueAtTime(vol, now + 0.005)          // 5 ms attack
      this.gain.gain.setValueAtTime(vol, now + beepDuration)
      this.gain.gain.linearRampToValueAtTime(0, now + beepDuration + 0.02) // 20 ms decay
    }

    this._beepTimer = setTimeout(() => this._scheduleBeep(), intervalMs)
  }

  /**
   * Update volume 0.0–1.0. Called every second by useAlerts.
   * The next beep will pick up the new volume and beep rate automatically.
   */
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v))
  }

  stop() {
    if (!this.active) return
    clearTimeout(this._beepTimer)
    this._beepTimer = null
    try {
      const ctx = getCtx()
      this.gain?.gain.cancelScheduledValues(ctx.currentTime)
      this.gain?.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
      setTimeout(() => {
        try { this.oscillator?.stop() } catch {}
        this.oscillator = null
        this.gain = null
        this.active = false
      }, 200)
    } catch {
      this.oscillator = null
      this.gain = null
      this.active = false
    }
  }

  isActive() {
    return this.active
  }
}
