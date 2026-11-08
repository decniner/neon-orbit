const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

function fireGuardian(stage, healthRatio = 1, difficulty = 'medium', initialShots = 0) {
  const game = core.createGame(() => 0.5);
  core.start(game, 'vanguard', difficulty);
  game.spawnIn = 100;
  game.stageTime = 0;
  game.fireIn = 100;
  const maxHp = (38 + stage * 4) * core.BOSS_TOUGHNESS * (core.DIFFICULTIES.find(item => item.id === difficulty)?.bossMultiplier || 1);
  const boss = {x:500,y:180,r:44,hp:maxHp*healthRatio,maxHp,kind:'boss',phase:1,stage,destination:core.destinationFor(stage),speed:0,fireIn:.01,age:2};
  game.enemies.push(boss);
  for (let i = 0; i < initialShots; i++) game.enemyBullets.push({x:80,y:70,vx:0,vy:0,r:2,life:5,kind:'gun'});
  core.step(game,.05);
  return game;
}

test('each guardian has a distinct, readable attack telegraph', () => {
  assert.equal(new Set(core.BOSS_ATTACKS.map(attack => attack.telegraph)).size,6);
  assert.deepEqual(core.BOSS_ATTACKS.map(attack => attack.id), ['lance-halo','cinder-fan','seeker-salvo','gravity-minefield','rift-lance-grid','null-spiral']);
});

test('each stage receives its own guardian color and later phases hit harder',()=>{
  const colors=Array.from({length:12},(_,i)=>core.bossAttackForStage(i+1).color);
  assert.equal(new Set(colors).size,12,'stage identity continues beyond the first six guardians');
  const early=fireGuardian(3),final=fireGuardian(3,.3);
  assert.ok(Math.max(...final.enemyBullets.filter(b=>b.boss).map(b=>b.damage))>Math.max(...early.enemyBullets.filter(b=>b.boss).map(b=>b.damage)));
  assert.ok(final.enemies.find(e=>e.kind==='boss').fireIn<early.enemies.find(e=>e.kind==='boss').fireIn,'last phase volleys recover faster');
});

test('guardians escalate their signature attacks across all three phases', () => {
  const aegis = fireGuardian(1);
  const cinder = fireGuardian(2);
  const sentinel = fireGuardian(3);
  assert.equal(aegis.enemyBullets.filter(b => b.kind === 'gun').length, 13,'the first halo leaves a visible dodge gap');
  assert.equal(cinder.enemyBullets.filter(b => b.kind === 'gun').length, 7);
  assert.equal(sentinel.enemyBullets.filter(b => b.kind === 'missile').length, 2);

  const aegisTwo = fireGuardian(1,.6);
  const cinderTwo = fireGuardian(2,.6);
  const sentinelTwo = fireGuardian(3,.6);
  assert.equal(aegisTwo.enemyBullets.filter(b => b.kind === 'gun').length, 19,'the second halo grows but preserves its gap');
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

test('later stages deploy their own mine, lance, and spiral weapons with phase escalation',()=>{
  const mines=fireGuardian(4),minesFinal=fireGuardian(4,.3);
  const lances=fireGuardian(5),lancesFinal=fireGuardian(5,.3);
  const spiral=fireGuardian(6),spiralFinal=fireGuardian(6,.3);
  assert.ok(mines.enemyBullets.some(b=>b.kind==='mine'));
  assert.ok(minesFinal.enemyBullets.filter(b=>b.kind==='mine').length>mines.enemyBullets.filter(b=>b.kind==='mine').length);
  assert.ok(lances.enemyBullets.some(b=>b.kind==='lance'));
  assert.ok(lancesFinal.enemyBullets.filter(b=>b.kind==='lance').length>lances.enemyBullets.filter(b=>b.kind==='lance').length);
  assert.ok(spiral.enemyBullets.filter(b=>b.kind==='gun').length>0);
  assert.ok(spiralFinal.enemyBullets.filter(b=>b.kind==='gun').length>spiral.enemyBullets.filter(b=>b.kind==='gun').length);
  for(const game of [mines,minesFinal,lances,lancesFinal,spiral,spiralFinal])assert.ok(game.events.some(e=>e.type==='bossWeapon'));
});
