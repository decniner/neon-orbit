const assert = require('node:assert/strict');
const core = require('../core.js');

const game = core.createGame(() => 0.5);
core.start(game);
game.supplyIn = 0.01;

core.advance(game, 0.12, {});

assert.ok(Math.abs(game.time - 0.12) < 1e-9, 'simulation catches up across multiple safe steps');
assert.ok(Math.abs(game.stageTime - 0.12) < 1e-9, 'stage timer stays synchronized with elapsed game time');
assert.ok(game.events.some(event => event.type === 'supply'), 'events from intermediate catch-up steps are retained');

core.advance(game, 0.5, {});
assert.ok(Math.abs(game.time - 0.27) < 1e-9, 'catch-up work is bounded to avoid a spiral after a long stall');

console.log('Mobile performance tests passed.');
