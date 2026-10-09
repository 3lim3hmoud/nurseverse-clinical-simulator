/** All sounds are generated with WebAudio (no files to download). Must be resumed from a user gesture. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hiss: GainNode | null = null;
  private nextAlarmAt = 0;
  private muted = false;

  resume(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(ctx.destination);

      // looping noise -> oxygen flow hiss
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 0.6;
      this.hiss = ctx.createGain();
      this.hiss.gain.value = 0;
      src.connect(filter);
      filter.connect(this.hiss);
      this.hiss.connect(this.master);
      src.start();
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.02);
  }

  setHiss(level: number): void {
    if (this.ctx && this.hiss) this.hiss.gain.setTargetAtTime(level, this.ctx.currentTime, 0.1);
  }

  /** Pulse-oximeter beep: pitch falls as SpO2 falls. */
  beep(spo2: number, gain: number): void {
    this.tone(Math.max(420, 440 + (spo2 - 80) * 18), 0.09, 0.12 * gain, 'sine', 0);
  }

  /** Urgent three-pulse alarm, repeated every ~2.4 s. Call every frame while the alarm is active. */
  alarm(gain: number): void {
    if (!this.ctx || this.ctx.currentTime < this.nextAlarmAt) return;
    for (let i = 0; i < 3; i++) this.tone(960, 0.12, 0.1 * gain, 'triangle', i * 0.2);
    this.nextAlarmAt = this.ctx.currentTime + 2.4;
  }

  /** Stethoscope: "lub-dub" at the patient's heart rate. */
  listenHeart(hr: number, seconds = 6): void {
    if (!this.ctx) return;
    const beat = 60 / Math.max(40, hr);
    const t0 = this.ctx.currentTime + 0.05;
    for (let t = 0; t < seconds; t += beat) {
      this.thump(t0 + t, 62, 0.7);
      this.thump(t0 + t + Math.min(0.3, beat * 0.38), 88, 0.45);
    }
  }

  /** Stethoscope: breathing at the patient's rate, with fine crackles if present. */
  listenLungs(rr: number, crackles: boolean, seconds = 6): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const cycle = 60 / Math.max(6, rr);
    const t0 = ctx.currentTime + 0.05;
    const noise = this.noiseBuffer(ctx);

    const breath = ctx.createBufferSource();
    breath.buffer = noise;
    breath.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const env = ctx.createGain();
    env.gain.value = 0;
    breath.connect(lp);
    lp.connect(env);
    env.connect(this.master);
    for (let t = 0; t < seconds; t += cycle) {
      env.gain.setValueAtTime(0.0001, t0 + t);
      env.gain.linearRampToValueAtTime(0.45, t0 + t + cycle * 0.4);
      env.gain.linearRampToValueAtTime(0.0001, t0 + t + cycle * 0.5);
      env.gain.linearRampToValueAtTime(0.25, t0 + t + cycle * 0.75);
      env.gain.linearRampToValueAtTime(0.0001, t0 + t + cycle * 0.95);

      if (crackles) {
        for (let i = 0; i < 7; i++) this.click(t0 + t + cycle * (0.1 + Math.random() * 0.3), noise);
      }
    }
    breath.start(t0);
    breath.stop(t0 + seconds + 0.2);
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
  }

  private noise: AudioBuffer | null = null;

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  private thump(at: number, freq: number, volume: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.4, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + 0.06);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(volume, at + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    osc.connect(env);
    env.connect(this.master);
    osc.start(at);
    osc.stop(at + 0.16);
  }

  private click(at: number, noise: AudioBuffer): void {
    if (!this.ctx || !this.master) return;
    const src = this.ctx.createBufferSource();
    src.buffer = noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.35, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    src.connect(hp);
    hp.connect(env);
    env.connect(this.master);
    src.start(at, Math.random());
    src.stop(at + 0.04);
  }

  private tone(freq: number, duration: number, volume: number, type: OscillatorType, delay: number): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(volume, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}
