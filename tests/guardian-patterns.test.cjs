const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

function fireGuardian(stage, healthRatio = 1, difficulty = 'medium', initialShots = 0) {
  const game = core.createGame(() => 0.5);
  core.start(game, 'vanguard', difficulty);
  game.spawnIn = 100;
  game.stageTime = 0;
  game.fireIn = 100;
  const maxHp = (38 + stage * 4) * core.BOSS_TOUGHNESS * (core.DIFFICULTIES.find(item => item.id === difficulty)?.multiplier || 1);
  const boss = {x:500,y:180,r:44,hp:maxHp*healthRatio,maxHp,kind:'boss',phase:1,stage,destination:core.destinationFor(stage),speed:0,fireIn:.01,age:2};
  game.enemies.push(boss);
  for (let i = 0; i < initialShots; i++) game.enemyBullets.push({x:80,y:70,vx:0,vy:0,r:2,life:5,kind:'gun'});
  core.step(game,.05);
  return game;
}

test('each guardian has a distinct, readable attack telegraph', () => {
  assert.deepEqual(core.BOSS_ATTACKS.map(attack => attack.telegraph), ['LANCE RING INCOMING','FLAME FAN INCOMING','SEEKER PAIR INCOMING']);
});

test('guardians escalate their signature attacks across all three phases', () => {
  const aegis = fireGuardian(1);
  const cinder = fireGuardian(2);
  const sentinel = fireGuardian(3);
  assert.equal(aegis.enemyBullets.filter(b => b.kind === 'gun').length, 14);
  assert.equal(cinder.enemyBullets.filter(b => b.kind === 'gun').length, 7);
  assert.equal(sentinel.enemyBullets.filter(b => b.kind === 'missile').length, 2);

  const aegisTwo = fireGuardian(1,.6);
  const cinderTwo = fireGuardian(2,.6);
  const sentinelTwo = fireGuardian(3,.6);
  assert.equal(aegisTwo.enemyBullets.filter(b => b.kind === 'gun').length, 23);
  assert.equal(cinderTwo.enemyBullets.filter(b => b.kind === 'gun').length, 11);
  assert.equal(sentinelTwo.enemyBullets.filter(b => b.kind === 'missile').length, 3);
  assert.ok(sentinelTwo.enemyBullets.filter(b => b.kind === 'gun').length > 0);

  const aegisThree = fireGuardian(1,.3);
  const cinderThree = fireGuardian(2,.3);
  const sentinelThree = fireGuardian(3,.3);
  assert.ok(aegisThree.enemyBullets.filter(b => b.kind === 'gun').length > 20);
  assert.ok(cinderThree.enemyBullets.filter(b => b.kind === 'gun').length > 11);
  assert.ok(sentinelThree.enemyBullets.filter(b => b.kind === 'missile').length > 3);
  assert.ok(sentinelThree.enemyBullets.filter(b => b.kind === 'gun').length > 8);
});

test('guardian phase changes begin at 70% and 35% health and emit once', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.fireIn = 100;
  const boss = {x:500,y:180,r:44,hp:100,maxHp:100,kind:'boss',phase:1,stage:1,destination:core.destinationFor(1),speed:0,fireIn:10,age:2};
  game.enemies.push(boss);

  boss.hp = 70;
  core.step(game,.01);
  assert.equal(boss.phase,2);
  assert.equal(game.events.filter(event => event.type === 'bossPhase').length,1);
  const phaseEvent=game.events.find(event=>event.type==='bossPhase');
  assert.deepEqual({phase:phaseEvent.phase,name:phaseEvent.name},{phase:2,name:'AEGIS WARDEN'});
  assert.ok(Number.isFinite(phaseEvent.x)&&Number.isFinite(phaseEvent.y));

  core.step(game,.01);
  assert.equal(game.events.filter(event => event.type === 'bossPhase').length,0);
  boss.hp = 35;
  core.step(game,.01);
  assert.equal(boss.phase,3);
  assert.equal(game.events.filter(event => event.type === 'bossPhase').length,1);
  assert.equal(game.events.find(event => event.type === 'bossPhase').phase,3);
});

test('hostile projectiles remain capped at 300 during the final guardian phase', () => {
  const game = fireGuardian(3,.3,'insane',295);
  assert.equal(game.enemyBullets.length,300);
});
