const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('Vortex Bomb opens a capped gravity well on impact',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=0;game.weaponTime=8;game.weaponKind='vortex';
  const target={x:game.player.x,y:game.player.y-58,r:18,hp:80,maxHp:80,kind:'heavy',speed:0,fireIn:100};
  game.enemies.push(target);

  for(let i=0;i<12&&!game.vortices.length;i++)core.step(game,.05);

  assert.ok(game.vortices.length>0,'a hit creates a short-lived singularity field');
  assert.ok(game.vortices.length<=3,'the active field count is capped for smooth performance');
  assert.ok(game.events.some(event=>event.type==='vortexOpen'));
});

test('Vortex fields drag nearby enemies inward and pulse damage',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  const enemy={x:game.player.x+80,y:game.player.y-120,r:18,hp:80,maxHp:80,kind:'chaser',speed:0,fireIn:100};
  game.enemies.push(enemy);
  game.vortices.push({x:game.player.x,y:game.player.y-120,radius:130,life:.5,maxLife:.5,pulseIn:0,damage:2});

  core.step(game,.05);

  assert.ok(Math.hypot(enemy.x-game.player.x,enemy.y-(game.player.y-120))<80,'gravity pulls the target toward the singularity');
  assert.ok(enemy.hp<80,'the gravity well pulses damage');
  assert.ok(game.events.some(event=>event.type==='vortexPulse'));
});
