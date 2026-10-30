/* Gesture-safe, dependency-free adaptive music and sound design. */
(function(root) {
  'use strict';
  class SoundEngine {
    constructor({context = null, enabled = true} = {}) {
      this.context = context; this.enabled = enabled; this.ready = false;
      this.nextBeat = 0; this.beat = 0; this.voices = 0; this.musicalMode = '';
      if (context) this.setup();
    }
    setup() {
      if (this.ready) return;
      const c = this.context;
      this.master = c.createGain(); this.master.gain.value = this.enabled ? .65 : 0;
      this.master.connect(c.destination);
      this.echo = c.createDelay(.5); this.echo.delayTime.value = .225;
      const feedback = c.createGain(), wet = c.createGain(); feedback.gain.value = .22; wet.gain.value = .16;
      this.echo.connect(feedback); feedback.connect(this.echo); this.echo.connect(wet); wet.connect(this.master);
      this.noise = c.createBuffer(1, Math.floor(c.sampleRate * .25), c.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      this.ready = true;
    }
    unlock() {
      if (!this.enabled) return;
      try {
        if (!this.context) this.context = new (root.AudioContext || root.webkitAudioContext)();
        this.setup();
        if (this.context.state === 'suspended') this.context.resume()?.catch(() => {});
      } catch { /* Browsers without Web Audio still get the complete game. */ }
    }
    setEnabled(enabled) {
      this.enabled = enabled;
      if (enabled) this.unlock();
      if (this.ready) { this.master.gain.cancelScheduledValues(this.context.currentTime); this.master.gain.setTargetAtTime(enabled ? .65 : 0, this.context.currentTime, .02); }
    }
    tone(freq, duration = .08, type = 'sine', volume = .025, when, endFreq, echo = false) {
      if (!this.enabled || !this.ready || this.voices > 48) return;
      const c = this.context, t = when ?? c.currentTime, o = c.createOscillator(), a = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), t + .005);
      a.gain.exponentialRampToValueAtTime(.0001, t + duration);
      o.connect(a); a.connect(this.master); if (echo) a.connect(this.echo);
      this.voices++; o.onended = () => { this.voices--; o.disconnect(); a.disconnect(); };
      o.start(t); o.stop(t + duration + .02);
    }
    hiss(duration = .08, volume = .025, frequency = 1800, when) {
      if (!this.enabled || !this.ready || this.voices > 48) return;
      const c = this.context, t = when ?? c.currentTime, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
      source.buffer = this.noise; filter.type = 'highpass'; filter.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      this.voices++; source.onended = () => { this.voices--; source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(t); source.stop(t + duration);
    }
    effect(type, weapon = 'standard') {
      if (!this.enabled || !this.ready) return;
      const t = this.context.currentTime;
      if (type === 'fire') {
        this.tone(weapon === 'pulse' ? 260 : weapon === 'seeker' ? 340 : 690, .065, 'triangle', .018, t, 120);
        if (weapon === 'pulse') this.hiss(.06, .012, 700, t);
      } else if (type === 'kill') {
        this.hiss(.13, .045, 350, t); this.tone(110, .15, 'sine', .09, t, 35);
      } else if (type === 'hit') {
        this.hiss(.2, .065, 150, t); this.tone(140, .26, 'sawtooth', .04, t, 35);
      } else if (type === 'enemyGun') {
        this.tone(180, .065, 'square', .035, t, 72); this.hiss(.055, .016, 2200, t);
      } else if (type === 'enemyMissile') {
        this.hiss(.24, .035, 500, t); this.tone(95, .2, 'sawtooth', .035, t, 42);
      } else if (type === 'explosion') {
        this.hiss(.38, .085, 180, t); this.tone(92, .42, 'sine', .12, t, 28);
      } else if (type === 'dash') {
        this.hiss(.18, .05, 1200, t); this.tone(140, .18, 'sine', .04, t, 520);
      } else if (type === 'upgrade' || type === 'launch') {
        for (const [i, f] of [330, 440, 660, 880].entries()) this.tone(f, .32, 'sine', .04, t + i * .075, undefined, true);
      } else if (type === 'boss') {
        this.tone(55, .8, 'triangle', .09, t, 45); this.tone(82.4, .7, 'sine', .06, t + .1, undefined, true);
      }
    }
    update(mode, boss = false) {
      if (!this.enabled || !this.ready) return;
      const c = this.context, now = c.currentTime;
      if (mode !== 'playing') { this.nextBeat = now; this.musicalMode = mode; return; }
      if (this.musicalMode !== 'playing' || this.nextBeat < now - .2) this.nextBeat = now;
      this.musicalMode = 'playing';
      while (this.nextBeat < now + .1) {
        const t = this.nextBeat, beat = this.beat++, rootNote = [45, 41, 48, 43][Math.floor(beat / 16) % 4];
        const hz = n => 440 * Math.pow(2, (n - 69) / 12);
        if (beat % 4 === 0) {
          this.tone(115, .16, 'sine', .1, t, 32);
          this.tone(hz(rootNote), .25, 'triangle', .035, t);
        }
        if (beat % (boss ? 1 : 2) === 0) this.hiss(.035, .011, 6500, t);
        if (beat % 8 === 4) this.hiss(.08, .019, 1600, t);
        this.tone(hz(rootNote + 12 + [0, 7, 12, 15, 19, 12, 7, 3][beat % 8]), .22, 'sine', boss ? .021 : .014, t, undefined, true);
        this.nextBeat += .15;
      }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {SoundEngine}; else root.OrbitAudio = {SoundEngine};
})(typeof globalThis !== 'undefined' ? globalThis : this);
