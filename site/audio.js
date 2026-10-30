/* Gesture-safe, dependency-free adaptive music and sound design. */
(function(root) {
  'use strict';
  class SoundEngine {
    constructor({context = null, enabled = true} = {}) {
      this.context = context; this.enabled = enabled; this.ready = false;
      this.nextBeat = 0; this.beat = 0; this.voices = 0; this.musicalMode = ''; this.musicCue = '';
      if (context) this.setup();
    }
    setup() {
      if (this.ready) return;
      const c = this.context;
      this.master = c.createGain(); this.master.gain.value = this.enabled ? .78 : 0;
      this.compressor = c.createDynamicsCompressor();
      this.compressor.threshold.value = -19; this.compressor.knee.value = 15;
      this.compressor.ratio.value = 3.2; this.compressor.attack.value = .008; this.compressor.release.value = .18;
      this.musicBus = c.createGain(); this.musicBus.gain.value = 0;
      this.ambienceBus = c.createGain(); this.ambienceBus.gain.value = 0;
      this.effectsBus = c.createGain(); this.effectsBus.gain.value = .88;
      this.musicBus.connect(this.master); this.ambienceBus.connect(this.master); this.effectsBus.connect(this.master);
      this.master.connect(this.compressor); this.compressor.connect(c.destination);
      this.echo = c.createDelay(.5); this.echo.delayTime.value = .24;
      const feedback = c.createGain(), wet = c.createGain(); feedback.gain.value = .2; wet.gain.value = .13;
      this.echo.connect(feedback); feedback.connect(this.echo); this.echo.connect(wet); wet.connect(this.musicBus);
      this.noiseBuffers = new Map();
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
      if (this.ready) { this.master.gain.cancelScheduledValues(this.context.currentTime); this.master.gain.setTargetAtTime(enabled ? .78 : 0, this.context.currentTime, .02); }
    }
    tone(freq, duration = .08, type = 'sine', volume = .025, when, endFreq, echo = false, bus = 'effectsBus') {
      if (!this.enabled || !this.ready || this.voices > 44) return;
      const c = this.context, t = when ?? c.currentTime, o = c.createOscillator(), a = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), t + .008);
      a.gain.exponentialRampToValueAtTime(.0001, t + duration);
      o.connect(a); a.connect(this[bus]); if (echo) a.connect(this.echo);
      this.voices++; o.onended = () => { this.voices--; o.disconnect(); a.disconnect(); };
      o.start(t); o.stop(t + duration + .025);
    }
    hiss(duration = .08, volume = .025, frequency = 1800, when, bus = 'effectsBus') {
      if (!this.enabled || !this.ready || this.voices > 44) return;
      const c = this.context, t = when ?? c.currentTime, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
      let noise = this.noiseBuffers.get(c.sampleRate);
      if (!noise) { noise = c.createBuffer(1, Math.floor(c.sampleRate * .18), c.sampleRate); const data = noise.getChannelData(0); for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.6); this.noiseBuffers.set(c.sampleRate,noise); }
      source.buffer = noise; filter.type = 'highpass'; filter.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this[bus]);
      this.voices++; source.onended = () => { this.voices--; source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(t); source.stop(t + duration);
    }
    effect(type, weapon = 'standard') {
      if (!this.enabled || !this.ready) return;
      const t = this.context.currentTime;
      if (type === 'fire') {
        if(weapon==='arc'){this.hiss(.14,.03,900,t);this.tone(390,.18,'sawtooth',.042,t,115);this.tone(1180,.09,'triangle',.022,t+.015,430);return;}
        if(weapon==='vortex'){this.tone(145,.23,'sawtooth',.033,t,54);this.tone(720,.13,'sine',.022,t+.018,190);this.hiss(.16,.018,1150,t);return;}
        const f=weapon==='pulse'?250:weapon==='seeker'?310:weapon==='nova'?410:620;
        this.tone(f,.09,'sawtooth',weapon==='pulse'?.03:.026,t,f*.42);
        this.tone(f*2.03,.035,'triangle',.014,t);
        if (weapon === 'pulse') this.hiss(.07, .02, 850, t);
        else if(weapon==='seeker'){this.hiss(.1,.018,1300,t);this.tone(900,.11,'sine',.016,t,410);}
        else if(weapon==='nova'){this.tone(1240,.16,'sine',.026,t,260);this.tone(1860,.12,'triangle',.013,t+.018,620);this.hiss(.12,.018,2100,t);}
      } else if (type === 'kill') {
        this.hiss(.13, .045, 350, t); this.tone(110, .15, 'sine', .09, t, 35);
      } else if (type === 'vortexOpen') {
        this.tone(82,.34,'sine',.095,t,34);this.tone(310,.28,'triangle',.032,t,58);this.hiss(.3,.045,720,t);
      } else if (type === 'vortexCollapse') {
        this.hiss(.3,.085,220,t);this.tone(68,.45,'sine',.13,t,24);this.tone(880,.12,'triangle',.035,t+.03,180);
      } else if (type === 'hit') {
        this.hiss(.2, .065, 150, t); this.tone(140, .26, 'sawtooth', .04, t, 35);
      } else if (type === 'enemyGun') {
        this.tone(180, .065, 'square', .035, t, 72); this.hiss(.055, .016, 2200, t);
      } else if (type === 'enemyMissile') {
        this.hiss(.24, .035, 500, t); this.tone(95, .2, 'sawtooth', .035, t, 42);
      } else if (type === 'missileWarning') {
        this.tone(1040, .095, 'square', .032, t); this.tone(780, .11, 'square', .026, t + .13);
      } else if (type === 'explosion') {
        this.hiss(.38, .095, 160, t); this.tone(82, .48, 'sine', .14, t, 25);this.tone(440,.13,'triangle',.035,t+.018,90);this.tone(1380,.055,'sine',.025,t);
      } else if (type === 'dash') {
        this.hiss(.18, .05, 1200, t); this.tone(140, .18, 'sine', .04, t, 520);
      } else if (type === 'droneLaunch') {
        this.hiss(.11,.018,1800,t);this.tone(720,.13,'triangle',.016,t,1120);
      } else if (type === 'droneFire') {
        // Laser visuals carry the one-shot sound, avoiding a second attack click.
      } else if (type === 'droneLaser') {
        const tier=Math.min(5,Number(weapon)||0);this.hiss(.055,.026+tier*.003,4200+tier*260,t);this.tone(1320+tier*95,.075,'sawtooth',.038+tier*.002,t,410+tier*35);this.tone(2480+tier*140,.05,'square',.014+tier*.001,t+.008,1120+tier*65);
      } else if (type === 'droneIntercept') {
        this.hiss(.09,.026,2600,t);this.tone(920,.075,'triangle',.025,t,420);this.tone(1540,.11,'sine',.018,t+.025,760);
      } else if (type === 'droneDock') {
        this.tone(930,.11,'sine',.014,t,1380);this.tone(1240,.12,'triangle',.009,t+.035);
      } else if (type === 'upgrade' || type === 'launch') {
        for (const [i, f] of [330, 440, 660, 880].entries()) this.tone(f, .32, 'sine', .04, t + i * .075, undefined, true);
      } else if (type === 'boss') {
        this.tone(55, .8, 'triangle', .09, t, 45); this.tone(82.4, .7, 'sine', .06, t + .1, undefined, true);
      } else if (type === 'shield') {
        this.tone(760,.16,'sine',.045,t,1240);this.tone(1140,.24,'triangle',.026,t+.025,520);
        this.hiss(.11,.016,3300,t);
      } else if (type === 'pickup') {
        this.tone(640,.1,'triangle',.022,t,860);this.tone(960,.16,'sine',.025,t+.055,1280);
      }
    }
    update(mode, boss = false) {
      if (!this.ready) return;
      const c = this.context, now = c.currentTime;
      if (!this.enabled) return;
      if (mode !== 'playing') {
        this.musicBus.gain.setTargetAtTime(.0001, now, .08);
        this.nextBeat = now; this.musicalMode = mode; this.musicCue = ''; return;
      }
      const cue = boss ? 'boss' : 'flight';
      if (this.musicalMode !== 'playing' || this.nextBeat < now - .3 || this.musicCue !== cue) {
        this.nextBeat = now + .04; this.beat = 0; this.musicCue = cue;
        if (cue === 'boss') this.effect('boss');
      }
      this.musicBus.gain.setTargetAtTime(.38, now, .28);
      this.musicalMode = 'playing';
      const hz = n => 440 * Math.pow(2, (n - 69) / 12);
      while (this.nextBeat < now + .16) {
        const t=this.nextBeat,beat=this.beat++,step=beat%32,key=[0,0,3,5][Math.floor(beat/32)%4],rootNote=key+52;
        const melody=[19,24,22,19,26,24,22,19,17,19,24,29,27,24,22,19,19,24,22,19,29,27,24,22,21,24,27,31,29,27,24,21];
        const bass=[0,0,7,0,5,0,7,0][step%8];
        if(step%8===0)this.tone(hz(rootNote+bass-7),.19,'triangle',boss?.052:.042,t,hz(rootNote+bass-14),false,'musicBus');
        if(step%4===0){
          const chord=[rootNote+12,rootNote+16,rootNote+19,rootNote+23];
          for(let i=0;i<chord.length;i++)this.tone(hz(chord[i]),.72,i===0?'triangle':'sine',i===3?.006:boss?.014:.012,t+i*.014,undefined,true,'musicBus');
        }
        if([0,3,4,7,8,11,12,15,16,19,20,23,24,27,28,31].includes(step)){
          this.tone(hz(rootNote+melody[step]),boss?.18:.22,'triangle',boss?.029:.026,t,undefined,true,'musicBus');
          if(step===0||step===8||step===20||step===28)this.tone(hz(rootNote+melody[step]+12),.16,'sine',.009,t+.025,undefined,true,'musicBus');
        }
        if(step%8===4){this.hiss(.065,boss?.022:.018,1750,t,'musicBus');this.tone(hz(rootNote+7),.11,'triangle',boss?.019:.015,t,hz(rootNote+2),false,'musicBus');}
        else if(step%4===2)this.hiss(.022,boss?.012:.009,6200,t,'musicBus');
        if(boss&&(step===6||step===14||step===22||step===30)){this.tone(hz(rootNote+7),.12,'square',.016,t,hz(rootNote+2));this.hiss(.035,.012,3000,t,'musicBus');}
        this.nextBeat+=.1875;
      }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {SoundEngine}; else root.OrbitAudio = {SoundEngine};
})(typeof globalThis !== 'undefined' ? globalThis : this);
