const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

test('four consecutive energy pickups charge a Nova Overdrive', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.fireIn = 100;
  for (let i = 0; i < 4; i++) {
    game.pickups.push({x:game.player.x,y:game.player.y,r:6,life:2});
    core.step(game, 0.05);
  }
  assert.equal(game.combo, 4);
  assert.equal(game.novaCharge, 1);
  assert.equal(game.mode, 'playing');
});

test('charged overdrive fires a high-impact Nova even without a weapon pickup', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.weaponKind = 'pulse';
  game.weaponTime = 10;
  game.novaCharge = 1;
  game.combo = 4;
  game.comboUntil = 5;
  game.enemies.push({x:game.player.x,y:game.player.y-80,r:18,hp:40,maxHp:40,kind:'chaser',speed:0,fireIn:100});
  game.fireIn = 0;

  core.step(game, 0.01);

  const fire = game.events.find(event => event.type === 'fire');
  assert.equal(fire.weaponKind, 'nova');
  assert.equal(fire.overdrive, true);
  assert.equal(game.novaCharge, 0);
  assert.equal(game.combo, 0);
  assert.ok(game.bullets.every(bullet => bullet.kind === 'nova' && bullet.overdrive && bullet.damage >= 5));
});

test('overdrive Nova has a larger bounded splash radius than a standard Nova', () => {
  const game = core.createGame(() => 0.5);
  core.start(game);
  game.spawnIn = 100;
  game.fireIn = 100;
  const target = {x:game.player.x,y:game.player.y-70,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};
  game.enemies.push(target);
  game.bullets.push({x:target.x,y:target.y,vx:0,vy:0,r:12,life:1,kind:'nova',damage:5,overdrive:true,pierce:1});

  core.step(game, 0.01);

  const blast = game.events.find(event => event.type === 'explosion' && event.kind === 'nova');
  assert.equal(blast.overdrive, true);
  assert.equal(blast.radius, 132);
  assert.ok(target.hp < 100);
});
