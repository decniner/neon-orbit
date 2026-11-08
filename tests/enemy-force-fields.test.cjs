const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

function flight(stage=4){
  const game=core.createGame(()=>.5);core.start(game);game.stage=stage;game.wave=stage;game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;return game;
}

test('enemy force fields appear on every ship starting in later stages and scale up',()=>{
  const early=flight(3),late=flight(4),later=flight(10);
  const base={x:500,y:150,r:18,hp:20,maxHp:20,kind:'chaser',stage:3,speed:0,fireIn:10,age:2};
  const unshielded={...base};core.initializeEnemyShield(early,unshielded);assert.equal(unshielded.maxShieldHp,0);
  const shielded={...base,stage:4};core.initializeEnemyShield(late,shielded);
  const stronger={...base,stage:10};core.initializeEnemyShield(later,stronger);
  assert.ok(shielded.maxShieldHp>0);assert.equal(shielded.shieldHp,shielded.maxShieldHp);
  assert.ok(stronger.maxShieldHp>shielded.maxShieldHp);
  const boss={...base,kind:'boss',stage:4};core.initializeEnemyShield(late,boss);
  assert.ok(boss.maxShieldHp>0,'guardians also have a visible field');
  late.spawnIn=0;core.step(late,.01);assert.ok(late.enemies[0].maxShieldHp>0,'spawned stage-four ships receive the field');
  later.stageTime=later.stageDuration-.01;core.step(later,.02);assert.ok(later.enemies.find(e=>e.kind==='boss').maxShieldHp>0,'spawned later-stage guardians receive the field');
});

test('force field absorbs shots, breaks cleanly, then exposes the hull',()=>{
  const game=flight(4),enemy={x:game.player.x,y:game.player.y-170,r:16,hp:8,maxHp:8,kind:'chaser',stage:4,speed:0,fireIn:20,age:2,shieldHp:2,maxShieldHp:2};game.enemies.push(enemy);
  const fire=()=>{game.bullets.push({x:enemy.x,y:enemy.y,vx:0,vy:0,r:3,life:1,damage:1,pierce:1,hitEnemies:new Set()});core.step(game,.01);};
  fire();assert.equal(enemy.shieldHp,1);assert.equal(enemy.hp,8);
  fire();assert.equal(enemy.shieldHp,0);assert.equal(enemy.hp,8);assert.ok(game.events.some(e=>e.type==='shieldBreak'));
  fire();assert.equal(enemy.hp,7);
});
