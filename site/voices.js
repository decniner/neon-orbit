/* Light-touch cockpit dialogue using the browser's native speech voices. */
(function(root) {
  'use strict';
  const CONVERSATIONS = [
    [
      ['vega', 'Commander, I found the edge of the map.'],
      ['computer', 'There is no edge.'],
      ['vega', 'That explains the fuel budget.']
    ],
    [
      ['vega', 'Do these ships know we can shoot back?'],
      ['computer', 'They are learning.'],
      ['vega', 'Could they learn somewhere else?']
    ],
    [
      ['vega', 'How is the ship holding together?'],
      ['computer', 'With remarkable optimism.'],
      ['vega', 'Add that to the repair invoice.']
    ],
    [
      ['vega', 'I think that asteroid is following us.'],
      ['computer', 'It is stationary.'],
      ['vega', 'Then it is doing a very good impression.']
    ]
  ];

  class CrewVoices {
    constructor({synthesis = root.speechSynthesis, Utterance = root.SpeechSynthesisUtterance, random = Math.random, enabled = false, onLine = () => {}} = {}) {
      this.synthesis = synthesis;
      this.Utterance = Utterance;
      this.random = random;
      this.enabled = enabled;
      this.onLine = onLine;
      this.unlocked = false;
      this.queue = [];
      this.speaking = false;
      this.banterIn = 24;
      this.hitCooldown = 0;
      this.generation = 0;
    }
    unlock() {
      if (!this.enabled || !this.synthesis || !this.Utterance) return;
      this.unlocked = true;
      this.synthesis.getVoices?.();
      this._speakNext();
    }
    setEnabled(enabled) {
      this.enabled = enabled;
      if (!enabled) {
        this.generation++;
        this.queue.length = 0;
        this.speaking = false;
        this.synthesis?.cancel?.();
      }
    }
    _queueLine(role, text) {
      if (!this.enabled || !this.unlocked || !this.synthesis || !this.Utterance) return;
      this.queue.push({role, text});
      this._speakNext();
    }
    _speakNext() {
      if (!this.enabled || !this.unlocked || this.speaking || !this.queue.length) return;
      const {role, text} = this.queue.shift();
      const utterance = new this.Utterance(text);
      const voice = this.synthesis.getVoices?.().find(item => /^en(?:-|$)/i.test(item.lang));
      if (voice) utterance.voice = voice;
      utterance.rate = role === 'computer' ? .96 : 1.04;
      utterance.pitch = role === 'computer' ? .88 : 1.12;
      utterance.volume = .82;
      this.onLine(text, role);
      this.speaking = true;
      const generation = this.generation;
      utterance.onend = utterance.onerror = () => {
        if (generation !== this.generation) return;
        this.speaking = false;
        this._speakNext();
      };
      this.synthesis.speak(utterance);
    }
    greet() { this._queueLine('computer', 'Welcome back, Commander. The stars missed you.'); }
    hit() {
      if (!this.enabled || !this.unlocked || !this.synthesis || !this.Utterance || this.hitCooldown > 0) return;
      this.hitCooldown = 2.5;
      this.generation++;
      this.synthesis.cancel?.();
      this.queue.length = 0;
      this.speaking = false;
      this._queueLine('vega', "We're hit! Shields are holding... mostly.");
    }
    pause() {
      this.generation++;
      this.queue.length = 0;
      this.speaking = false;
      this.synthesis?.cancel?.();
    }
    banter() {
      const exchange = CONVERSATIONS[Math.floor(this.random() * CONVERSATIONS.length)];
      for (const [role, text] of exchange) this._queueLine(role, text);
    }
    update(mode, delta) {
      if (mode !== 'playing' || !this.enabled || !this.unlocked) return;
      const elapsed = Math.max(0, Math.min(delta || 0, .1));
      this.hitCooldown = Math.max(0, this.hitCooldown - elapsed);
      this.banterIn -= elapsed;
      if (this.banterIn <= 0 && !this.queue.length && !this.speaking) {
        this.banter();
        this.banterIn = 32 + this.random() * 16;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {CrewVoices};
  else root.OrbitVoices = {CrewVoices};
})(typeof globalThis !== 'undefined' ? globalThis : this);
