const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

function fireGuardian(stage, phaseTwo = false) {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.stageTime = 0;
  const maxHp = 38 + stage * 4;
  game.enemies.push({x:500,y:180,r:44,hp:phaseTwo?maxHp/2-1:maxHp,maxHp,kind:'boss',stage,destination:core.destinationFor(stage),speed:0,fireIn:.01,age:2});
  core.step(game,.05);
  return game;
}

test('each guardian has a distinct, readable attack telegraph', () => {
  assert.deepEqual(core.BOSS_ATTACKS.map(attack => attack.telegraph), ['LANCE RING INCOMING','FLAME FAN INCOMING','SEEKER PAIR INCOMING']);
});

test('guardians use distinct attack patterns and escalate in phase two', () => {
  const aegis = fireGuardian(1);
  const cinder = fireGuardian(2);
  const sentinel = fireGuardian(3);
  assert.equal(aegis.enemyBullets.filter(b => b.kind === 'gun').length, 14);
  assert.equal(cinder.enemyBullets.filter(b => b.kind === 'gun').length, 7);
  assert.equal(sentinel.enemyBullets.filter(b => b.kind === 'missile').length, 2);

  const aegisTwo = fireGuardian(1,true);
  const cinderTwo = fireGuardian(2,true);
  const sentinelTwo = fireGuardian(3,true);
  assert.equal(aegisTwo.enemyBullets.filter(b => b.kind === 'gun').length, 20);
  assert.equal(cinderTwo.enemyBullets.filter(b => b.kind === 'gun').length, 11);
  assert.equal(sentinelTwo.enemyBullets.filter(b => b.kind === 'missile').length, 3);
  assert.ok(sentinelTwo.enemyBullets.filter(b => b.kind === 'gun').length > 0);
});
