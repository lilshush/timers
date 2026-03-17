/**
 * Beeping timer buzz controller using Web Audio API.
 * Produces short beeps that get faster and louder as the alert escalates.
 * No audio files required — built entirely from oscillators.
 */
export class BuzzController {
  constructor() {
    this.ctx = null
    this.oscillator = null
    this.gain = null
    this.active = false
    this._volume = 0      // 0–1, updated by setVolume every second
    this._beepTimer = null
  }

  start() {
    if (this.active) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.oscillator = this.ctx.createOscillator()
      this.gain = this.ctx.createGain()

      this.oscillator.connect(this.gain)
      this.gain.connect(this.ctx.destination)

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

    const vol = this._volume
    // Beep interval shrinks as volume grows: 2000 ms → 250 ms
    const intervalMs = Math.round(2000 - vol * 1750)
    const beepDuration = 0.07 // 70 ms tone burst

    if (this.ctx && this.gain) {
      const now = this.ctx.currentTime
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
      this.gain?.gain.cancelScheduledValues(this.ctx.currentTime)
      this.gain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
      setTimeout(() => {
        try {
          this.oscillator?.stop()
          this.ctx?.close()
        } catch {}
        this.ctx = null
        this.oscillator = null
        this.gain = null
        this.active = false
      }, 200)
    } catch {
      this.ctx = null
      this.oscillator = null
      this.gain = null
      this.active = false
    }
  }

  isActive() {
    return this.active
  }
}
