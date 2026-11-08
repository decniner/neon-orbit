const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('drones spend a finite five-shot laser magazine and return when empty',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  const target={x:game.player.x+90,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};game.enemies.push(target);
  const drone=game.drones[0];drone.x=target.x-40;drone.y=target.y-20;drone.state='engage';drone.target=target;drone.retargetIn=1;drone.fireIn=0;drone.ammo=1;
  core.step(game,.05);
  assert.equal(drone.ammo,0);
  assert.equal(drone.state,'return');
  assert.ok(game.events.some(event=>event.type==='droneAmmoEmpty'&&event.id===drone.id));
});

test('a drone refills only after returning and completing its dock recharge',()=>{
  const game=core.createGame(()=>.5);core.start(game);game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  const drone=game.drones[0];assert.equal(drone.maxAmmo,8);drone.ammo=1;drone.state='return';drone.x=game.player.x+drone.side*17;drone.y=game.player.y+7;
  core.step(game,.05);assert.equal(drone.state,'recharge');assert.equal(drone.ammo,1);
  for(let i=0;i<36&&drone.state==='recharge';i++)core.step(game,.05);
  assert.equal(drone.state,'docked');assert.equal(drone.ammo,8);
});
