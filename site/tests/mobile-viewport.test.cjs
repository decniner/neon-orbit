const assert = require('node:assert/strict');
const core = require('../core.js');

assert.equal(typeof core.configureViewport, 'function', 'core exposes configureViewport(width, height)');

core.configureViewport(390, 844, true);
assert.ok(Math.abs(core.WIDTH / core.HEIGHT - 390 / 844) < 0.001, 'mobile world matches the portrait viewport ratio');
assert.ok(core.CORRIDOR.left > 0 && core.CORRIDOR.right < core.WIDTH, 'mobile corridor keeps visible side margins');
const mobile = core.createGame(() => 0.5);
assert.equal(mobile.player.x, core.WIDTH / 2, 'mobile ship begins at the center of the adapted world');

core.configureViewport(926, 428, true);
assert.ok(Math.abs(core.WIDTH / core.HEIGHT - 926 / 428) < 0.001, 'rotating the phone adapts the world without distortion');
assert.ok(core.CORRIDOR.left > 0 && core.CORRIDOR.right < core.WIDTH, 'rotated corridor stays inside the screen');

core.configureViewport(1440, 900, false);
assert.equal(core.WIDTH, 1000, 'desktop world remains 1000 logical units wide');
assert.equal(core.HEIGHT, 650, 'desktop world remains 650 logical units tall');
assert.deepEqual(core.CORRIDOR, {left: 75, right: 925}, 'desktop corridor bounds stay unchanged');
assert.equal(core.createGame(() => 0.5).player.x, 500, 'desktop ship keeps its original starting position');
console.log('Mobile viewport tests passed.');
