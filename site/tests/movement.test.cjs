const assert = require('node:assert/strict');
const core = require('../core.js');

const game = core.createGame(() => 0.5);
core.start(game);

core.step(game, 0.05, { x: 1 });
assert.ok(game.player.vx > 0 && game.player.vx < 240, 'steering velocity ramps smoothly instead of jumping to full speed');
assert.ok(game.player.x > 500 && game.player.x < 512, 'initial movement eases in without losing control responsiveness');

for (let i = 0; i < 9; i++) core.step(game, 0.05, { x: 1 });
assert.ok(game.player.vx > 230, 'steering reaches near full speed quickly while held');

const xBeforeRelease = game.player.x;
core.step(game, 0.05, {});
assert.ok(game.player.x > xBeforeRelease, 'movement eases out instead of stopping abruptly');
assert.ok(game.player.vx < 240, 'release immediately begins braking');

const velocityBeforeTurn = game.player.vx;
core.step(game, 0.05, { x: -1 });
assert.ok(game.player.vx < velocityBeforeTurn && game.player.vx > -240, 'direction changes blend smoothly rather than snapping across the screen');
