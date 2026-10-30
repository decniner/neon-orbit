const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

test('Arc Lash chains one shot across up to three nearby enemies', () => {
  const game=core.createGame(()=>.5);
  core.start(game);
  game.spawnIn=100;game.forwardSpeed=0;game.fireIn=0;game.weaponTime=8;game.weaponKind='arc';
  game.enemies.push(
    {x:game.player.x,y:game.player.y-150,r:18,hp:50,maxHp:50,kind:'chaser',speed:0,fireIn:100},
    {x:game.player.x+55,y:game.player.y-175,r:18,hp:50,maxHp:50,kind:'heavy',speed:0,fireIn:100},
    {x:game.player.x+100,y:game.player.y-205,r:18,hp:50,maxHp:50,kind:'sentry',speed:0,fireIn:100},
    {x:game.player.x+420,y:game.player.y-320,r:18,hp:50,maxHp:50,kind:'chaser',speed:0,fireIn:100}
  );

  core.step(game,.05);

  assert.ok(game.enemies.slice(0,3).every(enemy=>enemy.hp<50),'nearby targets receive chained arc damage');
  assert.equal(game.enemies[3].hp,50,'the chain has a clear three-target limit');
  assert.equal(game.events.filter(event=>event.type==='arcHit').length,3);
});
