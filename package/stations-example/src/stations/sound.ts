// Tiny synthesised sound effects. Nothing is loaded; every sound is built from
// an oscillator or a noise burst so the click you hear is the click you feel.

export class Sfx {
  on = true;
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;

  private ac(): AudioContext | null {
    if (!this.on) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      const len = Math.floor(this.ctx.sampleRate * 0.08);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = "square", at = 0, slideTo?: number) {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private burst(dur: number, gain: number, hp: number, at = 0) {
    const ctx = this.ac();
    if (!ctx || !this.noise) return;
    const t = ctx.currentTime + at;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(ctx.destination);
    s.start(t);
    s.stop(t + dur + 0.01);
  }

  /** The latch: a bright snap over a low body thump. */
  click() {
    this.burst(0.03, 0.22, 2400);
    this.tone(140, 0.09, 0.22, "sine", 0, 60);
  }

  /** Spring release when a cartridge pops out. */
  eject() {
    this.burst(0.025, 0.14, 1800);
    this.tone(220, 0.12, 0.08, "triangle", 0.01, 520);
  }

  press() {
    this.burst(0.012, 0.08, 3200);
  }

  blip() {
    this.tone(980 + Math.random() * 120, 0.025, 0.018, "square");
  }

  chime() {
    this.tone(659, 0.09, 0.035, "square", 0);
    this.tone(988, 0.22, 0.035, "square", 0.085);
  }

  page() {
    this.tone(740, 0.04, 0.025, "square");
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
