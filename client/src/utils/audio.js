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
    this.oscillator2 = null
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

      this.gain = ctx.createGain()
      this.gain.connect(ctx.destination)
      this.gain.gain.value = 0

      // Primary oscillator: 880 Hz square wave — sharp, attention-grabbing
      this.oscillator = ctx.createOscillator()
      this.oscillator.type = 'square'
      this.oscillator.frequency.value = 880
      this.oscillator.connect(this.gain)
      this.oscillator.start()

      // Secondary oscillator: 440 Hz square wave — adds body and richness
      this.oscillator2 = ctx.createOscillator()
      this.oscillator2.type = 'square'
      this.oscillator2.frequency.value = 440
      this.oscillator2.connect(this.gain)
      this.oscillator2.start()

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
    const vol = Math.min(0.6, this._volume * 1.5) // Gain boost, capped for dual-oscillator headroom
    // Beep interval shrinks as volume grows: 1000 ms → 200 ms
    const intervalMs = Math.round(1000 - vol * 800)
    const beepDuration = 0.15 // 150 ms tone burst

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
    this.active = false
    clearTimeout(this._beepTimer)
    this._beepTimer = null
    const osc1 = this.oscillator
    const osc2 = this.oscillator2
    const gain = this.gain
    this.oscillator = null
    this.oscillator2 = null
    this.gain = null
    try {
      const ctx = getCtx()
      gain?.gain.cancelScheduledValues(ctx.currentTime)
      gain?.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
      setTimeout(() => {
        try { osc1?.stop() } catch {}
        try { osc2?.stop() } catch {}
      }, 200)
    } catch {}
  }

  isActive() {
    return this.active
  }
}
