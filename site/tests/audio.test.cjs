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
sound.update('playing', false);
assert.equal(sound.musicCue, 'flight', 'normal flight music selects its own cue');
context.currentTime = .5;
sound.update('playing', true);
assert.equal(sound.musicCue, 'boss', 'a boss arrival changes the adaptive cue');
const sourceCount = context.sources.length;
sound.effect('missileWarning');
assert.equal(context.sources.length, sourceCount + 2, 'incoming missiles receive a two-tone warning');
sound.update('paused');
assert.equal(sound.musicCue, '', 'leaving play resets the cue cleanly');
