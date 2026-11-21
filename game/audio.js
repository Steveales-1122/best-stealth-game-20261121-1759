// SoundBank: every sound is synthesized with WebAudio — no audio files,
// no network. Footsteps, guard steps that fade with distance, alert stings,
// pickup chimes and win/lose phrases.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  thump(vol, freq = 90) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + 0.09);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  }

  playerStep(sneaking, running) {
    this.ensure();
    if (sneaking) this.thump(0.05, 70);
    else if (running) this.thump(0.16, 110);
    else this.thump(0.09, 90);
  }

  // Guard steps fade with distance so you can hear a patrol coming.
  guardStep(gx, gy, px, py) {
    this.ensure();
    const dist = Math.hypot(gx - px, gy - py);
    if (dist > 320) return;
    const vol = 0.14 * (1 - dist / 320);
    this.thump(vol, 75);
  }

  pickup() {
    this.ensure();
    this.tone(660, 0.14, 'sine', 0.22);
    this.tone(990, 0.22, 'sine', 0.2, 0.09);
  }

  alertSting() {
    this.ensure();
    this.tone(220, 0.16, 'sawtooth', 0.16, 0, 440);
    this.tone(440, 0.2, 'sawtooth', 0.12, 0.12, 660);
  }

  caught() {
    this.ensure();
    this.tone(330, 0.3, 'sawtooth', 0.2, 0, 110);
    this.tone(165, 0.45, 'sawtooth', 0.18, 0.22, 55);
  }

  levelClear() {
    this.ensure();
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.2, i * 0.11));
  }

  win() {
    this.ensure();
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.26, 'triangle', 0.2, i * 0.13));
  }
}
