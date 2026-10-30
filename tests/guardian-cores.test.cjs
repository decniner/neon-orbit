const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

function defeatGuardian(stage) {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.stageTime = 0;
  game.fireIn = 100;
  const boss = {x:game.player.x,y:game.player.y-250,r:44,hp:1,maxHp:50,kind:'boss',stage,speed:0,fireIn:100,age:2};
  game.enemies.push(boss);
  game.bullets.push({x:boss.x,y:boss.y,r:60,damage:2,life:1,pierce:1});
  core.step(game,.01);
  return game;
}

test('guardian cores auto-equip on victory without interrupting the run', () => {
  for (const [stage, id] of [[1,'aegis'],[2,'cinder'],[3,'sentinel']]) {
    const game = defeatGuardian(stage);
    assert.equal(game.mode,'playing');
    assert.equal(game.guardianCores[id],1);
    assert.ok(game.events.some(event => event.type === 'coreAcquired' && event.id === id));
    assert.equal(game.events.find(event => event.type === 'bossDefeated').stage,stage);
  }
});

test('Aegis core blocks a hit and recharges automatically', () => {
  const game = defeatGuardian(1);
  const hp = game.hp;
  game.invulnerable=0;
  game.enemyBullets.push({x:game.player.x,y:game.player.y,vx:0,vy:0,r:5,life:1,kind:'gun'});
  core.step(game,.01);
  assert.equal(game.hp,hp);
  assert.equal(game.aegisShield,false);
  assert.ok(game.aegisRecharge>0);
  game.aegisRecharge=.01;
  core.step(game,.05);
  assert.equal(game.aegisShield,true);
});

test('Cinder cores boost damage and Sentinel cores add seeking missiles', () => {
  const cinder = defeatGuardian(2);
  assert.equal(cinder.damageBonus,1);
  const sentinel = defeatGuardian(3);
  sentinel.enemies.push({x:sentinel.player.x,y:sentinel.player.y-120,r:18,hp:20,kind:'chaser',speed:0,fireIn:100});
  sentinel.fireIn=.01;
  sentinel.missileIn=0;
  core.step(sentinel,.05);
  assert.equal(sentinel.playerMissiles.length,3);
});
