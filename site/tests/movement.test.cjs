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

function travelAt(stepSize) {
  const craft = core.createGame(() => 0.5);
  core.start(craft);
  craft.spawnIn=100; craft.supplyIn=100; craft.fireIn=100;
  for (let elapsed=0;elapsed<.5-1e-8;elapsed+=stepSize) core.step(craft,Math.min(stepSize,.5-elapsed),{x:1});
  return {x:craft.player.x,vx:craft.player.vx};
}
const at30=travelAt(1/30),at60=travelAt(1/60),at120=travelAt(1/120);
assert.ok(Math.abs(at30.x-at120.x)<.01,'movement distance is consistent from 30 to 120 updates per second');
assert.ok(Math.abs(at30.vx-at120.vx)<.01,'movement velocity is consistent from 30 to 120 updates per second');

function responseAfter(seconds) {
  const craft=core.createGame(()=>.5);core.start(craft);
  craft.spawnIn=100;craft.supplyIn=100;craft.fireIn=100;
  core.step(craft,seconds,{x:1});
  return craft.player.vx;
}
assert.ok(responseAfter(.02)>150,'steering responds firmly within 20ms for a light, immediate feel');
