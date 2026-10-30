const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

test('guardian countdown warns once per second during the final five seconds', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.stageTime = 36.9;

  core.advance(game, 0.15);
  assert.deepEqual(game.events.filter(event => event.type === 'bossCountdown').map(event => event.seconds), [5]);
  const countdowns = [];
  for (let i = 0; i < 7; i++) {
    core.advance(game, 0.15);
    countdowns.push(...game.events.filter(event => event.type === 'bossCountdown').map(event => event.seconds));
  }
  assert.deepEqual(countdowns, [4]);
});

test('guardian countdown clears when the boss arrives and resets for the next stage', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.stageTime = game.stageDuration - 0.01;
  core.step(game, 0.05);
  assert.equal(game.enemies.some(enemy => enemy.kind === 'boss'), true);
  assert.equal(game.bossCountdown, 0);

  game.enemies.find(enemy => enemy.kind === 'boss').hp = 1;
  game.enemies.find(enemy => enemy.kind === 'boss').age = 2;
  game.fireIn = 100;
  game.bullets.push({x:game.enemies[0].x,y:game.enemies[0].y,vx:0,vy:0,life:1,r:5,damage:1,pierce:1});
  core.step(game, 0.01);
  assert.equal(game.stage, 2);
  assert.equal(game.bossCountdown, 0);
});
