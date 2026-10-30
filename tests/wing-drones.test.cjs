const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

test('every run starts with a two-drone wing and staggered deployment', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  assert.equal(game.drones.length, 2);
  assert.ok(game.drones.every(drone => drone.state === 'docked'));
  assert.ok(game.drones[0].launchAt < game.drones[1].launchAt);
});

test('deployed drones autonomously target enemies and fire their own shots', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  game.enemies.push({x:game.player.x,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100});
  game.drones[0].launchAt = 0;

  let events = [];
  for (let i = 0; i < 30; i++) {
    core.step(game, 0.05);
    events.push(...game.events);
  }

  assert.ok(events.some(event => event.type === 'droneLaunch'));
  assert.ok(events.some(event => event.type === 'droneFire'));
  assert.ok(game.enemies[0].hp < 100, 'drone shots damage the selected target');
});

test('drones return to dock, recharge, and redeploy without creating extra drones', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.fireIn = 100;
  game.forwardSpeed = 0;
  const drone = game.drones[0];
  drone.x = game.player.x + 1;
  drone.y = game.player.y + 10;
  drone.state = 'return';

  let dockEvents = [];
  for (let i = 0; i < 4 && drone.state !== 'recharge'; i++) {
    core.step(game, 0.05);
    dockEvents.push(...game.events);
  }
  assert.equal(drone.state, 'recharge');
  assert.ok(dockEvents.some(event => event.type === 'droneDock'));

  drone.charge = 0.99;
  core.step(game, 0.05);
  assert.equal(drone.state, 'docked');
  drone.launchAt = 0;
  game.enemies.push({x:game.player.x,y:game.player.y-120,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100});
  core.step(game, 0.05);

  assert.equal(drone.state, 'outbound');
  assert.equal(game.drones.length, 2);
});
