const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

function spawnedEnemyHealth(difficulty){
  const game=core.createGame(()=>.5);core.start(game,'vanguard',difficulty);
  game.spawnIn=0;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  core.step(game,.01);
  return game.enemies[0].maxHp;
}
function spawnedBossHealth(difficulty){
  const game=core.createGame(()=>.5);core.start(game,'vanguard',difficulty);
  game.stageTime=game.stageDuration-.01;game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  core.step(game,.01);
  return game.enemies.find(enemy=>enemy.kind==='boss').maxHp;
}

test('the opening difficulty choice scales every enemy and guardian from a doubled Medium baseline',()=>{
  const choices=[['easy',4,42],['medium',8,84],['hard',12,126],['insane',16,168]];
  for(const [difficulty,enemyHp,bossHp] of choices){
    assert.equal(spawnedEnemyHealth(difficulty),enemyHp,`${difficulty} regular enemy health`);
    assert.equal(spawnedBossHealth(difficulty),bossHp,`${difficulty} guardian health`);
  }
});

test('new runs default to Medium and invalid difficulty choices safely fall back to Medium',()=>{
  const defaultGame=core.createGame(()=>.5);core.start(defaultGame);
  const invalidGame=core.createGame(()=>.5);core.start(invalidGame,'vanguard','nightmare');
  assert.equal(defaultGame.difficulty,'medium');
  assert.equal(invalidGame.difficulty,'medium');
});
