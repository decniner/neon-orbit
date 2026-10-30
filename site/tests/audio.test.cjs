const assert = require('node:assert/strict');
const {SoundEngine} = require('../audio.js');

class AudioParam {
  constructor() { this.value = 0; }
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class AudioNode {
  constructor() {
    this.gain = new AudioParam(); this.frequency = new AudioParam(); this.delayTime = new AudioParam();
    this.threshold = new AudioParam(); this.knee = new AudioParam(); this.ratio = new AudioParam();
    this.attack = new AudioParam(); this.release = new AudioParam(); this.connections = [];
  }
  connect(node) { this.connections.push(node); }
  disconnect() {}
  start() {}
  stop() {}
}
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = new AudioNode(); this.sources = []; }
  createGain() { return new AudioNode(); }
  createDynamicsCompressor() { return new AudioNode(); }
  createDelay() { return new AudioNode(); }
  createOscillator() { const node = new AudioNode(); this.sources.push(node); return node; }
  createBufferSource() { const node = new AudioNode(); this.sources.push(node); return node; }
  createBiquadFilter() { return new AudioNode(); }
  createBuffer() { return {getChannelData: () => new Float32Array(32)}; }
}

const context = new FakeAudioContext();
const sound = new SoundEngine({context});
assert.ok(sound.compressor, 'sound output is protected by a dynamics compressor');
assert.ok(sound.musicBus.connections.includes(sound.master), 'music has an independent mix bus');
assert.ok(sound.effectsBus.connections.includes(sound.master), 'effects have an independent mix bus');
assert.equal(sound.ambienceBus.gain.value, 0, 'there is no always-on engine or ambience layer');
assert.equal(sound.musicBus.gain.value, 0, 'the original music is silent until active gameplay');
sound.update('playing', false);
assert.equal(sound.musicCue, 'flight', 'normal flight music selects its own cue');
assert.ok(context.sources.length>0, 'flight starts a scheduled original music phrase');
assert.ok(Math.min(...context.sources.map(source=>source.frequency.value).filter(Boolean))>70, 'the music avoids a sub-bass engine-like drone');
context.currentTime = .5;
sound.update('playing', true);
assert.equal(sound.musicCue, 'boss', 'a boss arrival changes the adaptive cue');
const sourceCount = context.sources.length;
sound.effect('missileWarning');
assert.equal(context.sources.length, sourceCount + 2, 'incoming missiles receive a two-tone warning');
const fireSourceCount=context.sources.length;
sound.effect('fire','seeker');
assert.ok(context.sources.length>=fireSourceCount+3,'seeker fire gets layered propulsion, launch, and exhaust cues');
const novaCount=context.sources.length;
sound.effect('fire','nova');
assert.ok(context.sources.length>=novaCount+5,'Nova Lancers get a distinct charged launch cue');
const arcCount=context.sources.length;
sound.effect('fire','arc');
assert.ok(context.sources.length>=arcCount+3,'Arc Lash has a distinct electrical weapon sound');
const droneCount=context.sources.length;
sound.effect('droneLaunch');
sound.effect('droneFire');
sound.effect('droneLaser');
sound.effect('droneDock');
assert.ok(context.sources.length>=droneCount+5,'drone flight has a distinct, delicate laser firing cue');
sound.effect('explosion');
const noiseCount=sound.noiseBuffers.size;
sound.effect('explosion');
assert.equal(noiseCount,1,'combat noise buffer is synthesized lazily on first use');
assert.equal(sound.noiseBuffers.size,noiseCount,'combat noise is reused instead of regenerated');
assert.ok(context.sources.length>=fireSourceCount+9,'explosions layer low-end impact and bright debris');
sound.update('paused');
assert.equal(sound.musicCue, '', 'leaving play resets the cue cleanly');
assert.equal(sound.ambienceBus.gain.value, 0, 'pausing does not leave a background hum');
