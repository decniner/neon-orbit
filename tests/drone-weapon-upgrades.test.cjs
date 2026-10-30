const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('each main-ship upgrade improves drone laser damage, cadence, and tier feedback',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  game.mode='upgrade';game.choices=['hull'];
  assert.equal(core.chooseUpgrade(game,'hull'),true);
  assert.equal(game.droneWeaponLevel,1,'even a defensive ship upgrade advances the shared drone weapon tier');
  assert.ok(game.events.some(event=>event.type==='droneWeaponUpgrade'&&event.level===1),'the upgrade produces clear wing feedback');
  const target={x:game.player.x+90,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};
  game.enemies.push(target);
  const drone=game.drones[0];drone.x=target.x-40;drone.y=target.y-20;drone.state='engage';drone.target=target;drone.retargetIn=1;drone.fireIn=0;

  core.step(game,.05);

  const impact=game.events.find(event=>event.type==='impact');
  assert.equal(impact.damage,2,'the upgraded drone laser hits harder');
  assert.ok(drone.fireIn<.36,'the upgraded drone fires sooner');
  assert.ok(game.events.some(event=>event.type==='droneLaser'&&event.level===1),'the brighter beam carries its tier to the renderer');
});

test('guardian-core rewards and active ship weapons also boost the drone tier',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.fireIn=100;game.forwardSpeed=0;
  const boss={x:game.player.x,y:game.player.y-220,r:44,hp:1,maxHp:50,kind:'boss',stage:1,speed:0,fireIn:100,age:2};
  game.enemies.push(boss);game.bullets.push({x:boss.x,y:boss.y,r:60,damage:2,life:1,pierce:1});
  core.step(game,.01);
  assert.equal(game.droneWeaponLevel,1,'a guardian core improves the wing weapons');

  const target={x:game.player.x+90,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};
  game.enemies.push(target);const drone=game.drones[0];drone.x=target.x-40;drone.y=target.y-20;drone.state='engage';drone.target=target;drone.retargetIn=1;drone.fireIn=0;
  core.step(game,.05);
  assert.ok(game.events.some(event=>event.type==='droneLaser'&&event.level===1));
});

test('an active weapon pickup temporarily synchronizes its power to the drone wing',()=>{
  const game=core.createGame(()=>.5);core.start(game);game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;game.weaponTime=4;
  const target={x:game.player.x+90,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};game.enemies.push(target);
  const drone=game.drones[0];drone.x=target.x-40;drone.y=target.y-20;drone.state='engage';drone.target=target;drone.retargetIn=1;drone.fireIn=0;
  core.step(game,.05);
  assert.ok(game.events.some(event=>event.type==='droneLaser'&&event.level===1));
  assert.equal(game.events.find(event=>event.type==='impact').damage,2);
});

test('drone weapon tiers stay capped as the ship keeps evolving',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  for(const id of ['hull','damage','haste','magnet','dash','repair','repair']){
    game.mode='upgrade';game.choices=[id];
    assert.equal(core.chooseUpgrade(game,id),true);
  }
  assert.equal(game.droneWeaponLevel,5);
});
