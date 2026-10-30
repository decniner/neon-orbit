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

test('docked drones continuously orbit around the ship while awaiting a useful target', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  for(const drone of game.drones)drone.launchAt=100;

  for(let i=0;i<26;i++)core.step(game,.05);

  assert.ok(game.drones.every(drone=>drone.state==='docked'));
  assert.ok(game.drones.every(drone=>Math.hypot(drone.x-game.player.x,drone.y-game.player.y)>30));
});

test('drones stay in orbit around distant enemies and launch when the fight reaches them', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  const enemy = {x:game.player.x,y:game.player.y-700,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:4};
  game.enemies.push(enemy);
  game.drones[0].launchAt=0;

  core.step(game,.05);
  assert.equal(game.drones[0].state,'docked');
  enemy.y=game.player.y-220;
  core.step(game,.05);
  assert.equal(game.drones[0].state,'outbound');
});

test('drones launch to intercept a dangerous incoming missile even with no nearby enemy', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  game.enemyBullets.push({x:game.player.x,y:game.player.y-260,vx:0,vy:230,r:6,life:3,kind:'missile'});
  game.drones[0].launchAt=0;

  core.step(game,.05);

  assert.equal(game.drones[0].state,'outbound');
  assert.equal(game.drones[0].target.kind,'projectile');
  assert.equal(game.drones[0].target.projectile.kind,'missile');
});

test('drones ignore harmless distant or receding shots and preserve their orbit', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  game.enemyBullets.push({x:game.player.x,y:game.player.y-500,vx:0,vy:-180,r:4,life:3,kind:'bolt'});
  game.drones[0].launchAt=0;

  core.step(game,.05);

  assert.equal(game.drones[0].state,'docked');
});

test('a drone destroys an incoming projectile by physically intercepting it', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  const drone=game.drones[0],projectile={x:game.player.x+16,y:game.player.y-30,vx:0,vy:220,r:6,life:3,kind:'missile'};
  drone.x=projectile.x+3;drone.y=projectile.y;drone.state='engage';drone.target={kind:'projectile',projectile};drone.retargetIn=1;
  game.enemyBullets.push(projectile);

  core.step(game,.02);

  assert.ok(projectile.life<=0);
  assert.ok(game.events.some(event=>event.type==='droneIntercept'));
});

test('zero-time simulation steps keep enemy velocity finite for lead targeting', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.enemies.push({x:game.player.x,y:game.player.y-120,r:18,hp:10,maxHp:10,kind:'chaser',speed:20,fireIn:2});

  core.step(game, 0);

  assert.ok(game.enemies.every(enemy => Number.isFinite(enemy.vx) && Number.isFinite(enemy.vy)));
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

test('drones prioritize an enemy about to fire near the player', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  const nearby = {x:game.player.x-70,y:game.player.y-130,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:5};
  const imminent = {x:game.player.x+220,y:game.player.y-180,r:18,hp:100,maxHp:100,kind:'heavy',speed:0,fireIn:.1};
  game.enemies.push(nearby,imminent);
  game.drones[0].launchAt = 0;

  core.step(game, 0.05);

  assert.equal(game.drones[0].target, imminent);
});

test('the wing splits its attention across two available targets', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  const left = {x:game.player.x-95,y:game.player.y-150,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:4};
  const right = {x:game.player.x+95,y:game.player.y-150,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:4};
  game.enemies.push(left,right);
  for(const drone of game.drones)drone.launchAt=0;

  core.step(game, 0.05);

  assert.notEqual(game.drones[0].target,game.drones[1].target);
  assert.ok([left,right].includes(game.drones[0].target));
  assert.ok([left,right].includes(game.drones[1].target));
});

test('a drone sidesteps when another enemy blocks its firing lane', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.forwardSpeed = 0;
  game.fireIn = 100;
  const drone = game.drones[0];
  drone.x = game.player.x+60;
  drone.y = game.player.y-200;
  drone.state = 'engage';
  drone.target = {x:game.player.x,y:game.player.y-250,r:22,hp:100,maxHp:100,kind:'boss',speed:0,fireIn:4};
  drone.retargetIn = 1;
  game.enemies.push(drone.target,{x:game.player.x+30,y:game.player.y-225,r:16,hp:30,maxHp:30,kind:'chaser',speed:0,fireIn:4});

  core.step(game, 0.05);

  assert.equal(drone.blockedLane,true);
  assert.ok(drone.vx<0,'the left drone moves out around the obstruction');
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
