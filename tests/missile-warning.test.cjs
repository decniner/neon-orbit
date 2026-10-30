const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

function gameWith(...enemyBullets) {
  const game = core.createGame(() => 0.5);
  game.player.x = 500;
  game.player.y = 400;
  game.enemyBullets = enemyBullets;
  return game;
}

test('warns for a guided missile closing on the player and points toward it', () => {
  const threat = core.incomingMissileThreat(gameWith({x:500,y:250,vx:0,vy:220,r:6,life:3,kind:'missile'}));
  assert.equal(threat.direction, '↑');
  assert.ok(threat.timeToImpact > 0 && threat.timeToImpact < 1.25);
});

test('ignores gunfire and missiles moving away from the player', () => {
  const game = gameWith(
    {x:500,y:250,vx:0,vy:320,r:5,life:3,kind:'gun'},
    {x:500,y:250,vx:0,vy:-220,r:6,life:3,kind:'missile'}
  );
  assert.equal(core.incomingMissileThreat(game), null);
});

test('ignores missiles outside the warning window and indicates diagonal threats', () => {
  const far = gameWith({x:500,y:50,vx:0,vy:220,r:6,life:3,kind:'rocket'});
  assert.equal(core.incomingMissileThreat(far), null);

  const diagonal = gameWith({x:400,y:300,vx:200,vy:200,r:6,life:3,kind:'rocket'});
  assert.equal(core.incomingMissileThreat(diagonal).direction, '↖');
});
