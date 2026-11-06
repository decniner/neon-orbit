const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

function destroyedGame(){
  const game=core.createGame(()=>.5);core.start(game,'vanguard','medium');
  game.hp=1;game.invulnerable=0;game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  game.enemies.push({x:game.player.x,y:game.player.y,r:40,hp:10,maxHp:10,kind:'chaser',speed:0,age:1,fireIn:100});
  core.step(game,.01);
  return game;
}

test('ship destruction records the exact position for its breakup animation',()=>{
  const game=destroyedGame();
  const destruction=game.events.find(event=>event.type==='over');
  assert.ok(destruction);
  assert.deepEqual({x:destruction.x,y:destruction.y},{x:game.player.x,y:game.player.y});
});

test('continue restores one hull, preserves the run, clears incoming fire, and is limited to once',()=>{
  const game=destroyedGame();game.score=321;game.stage=2;game.enemyBullets.push({x:game.player.x,y:game.player.y,r:5,life:2});
  assert.equal(core.continueRun(game),true);
  assert.equal(game.mode,'playing');assert.equal(game.hp,1);assert.equal(game.score,321);assert.equal(game.stage,2);
  assert.equal(game.enemyBullets.length,0);assert.ok(game.invulnerable>=2);assert.equal(game.continueUsed,true);
  game.mode='over';assert.equal(core.continueRun(game),false);
});

test('continue cannot be used before destruction',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  assert.equal(core.continueRun(game),false);
  assert.equal(game.mode,'playing');
});

test('ending at the continue prompt closes the recovery option for that run',()=>{
  const game=destroyedGame();
  assert.equal(core.declineContinue(game),true);
  assert.equal(game.mode,'over');
  assert.equal(core.continueRun(game),false);
});
