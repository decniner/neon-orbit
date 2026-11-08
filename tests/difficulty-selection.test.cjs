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

function firstEnemyAttackRecovery(difficulty, kind='chaser'){
  const game=core.createGame(()=>.5);core.start(game,'vanguard',difficulty);
  game.spawnIn=100;game.supplyIn=100;game.fireIn=100;
  game.enemies.push({x:500,y:180,r:14,hp:20,maxHp:20,kind,speed:0,fireIn:.01,age:2});
  core.step(game,.05);
  return game.enemies[0].fireIn;
}
function firstGuardianAttackRecovery(difficulty, healthRatio=1){
  const game=core.createGame(()=>.5);core.start(game,'vanguard',difficulty);
  game.spawnIn=100;game.supplyIn=100;game.fireIn=100;
  game.enemies.push({x:500,y:180,r:44,hp:100*healthRatio,maxHp:100,kind:'boss',phase:1,stage:1,speed:0,fireIn:.01,age:2});
  core.step(game,.05);
  return game.enemies[0].fireIn;
}

test('Medium is the balanced baseline and every mode scales hull and attack tempo distinctly',()=>{
  assert.equal(core.ENEMY_TOUGHNESS,1.5,'regular enemies have 50% more base health');
  assert.equal(core.BOSS_TOUGHNESS,4,'bosses have 300% more base health');
  const choices=[['easy',5,126,.75,.50],['medium',6,168,1,.65],['hard',9,252,1.5,.90],['insane',14,378,2.25,1.25]];
  for(const [difficulty,enemyHp,bossHp,hullMultiplier,attackIntensity] of choices){
    assert.equal(spawnedEnemyHealth(difficulty),enemyHp,`${difficulty} regular enemy health`);
    assert.equal(spawnedBossHealth(difficulty),bossHp,`${difficulty} guardian health`);
    const settings=core.DIFFICULTIES.find(item=>item.id===difficulty);
    assert.equal(settings.multiplier,hullMultiplier,`${difficulty} hull multiplier`);
    assert.equal(settings.attackIntensity,attackIntensity,`${difficulty} attack intensity`);
    assert.ok(firstEnemyAttackRecovery(difficulty)>0,`${difficulty} regular enemy has a valid attack recovery`);
    assert.ok(firstGuardianAttackRecovery(difficulty)>0,`${difficulty} guardian has a valid attack recovery`);
    assert.ok(firstGuardianAttackRecovery(difficulty,.3)>=.8,`${difficulty} final phase warns at least 0.8 seconds before attack`);
  }
  assert.ok(firstEnemyAttackRecovery('easy')>firstEnemyAttackRecovery('medium'));
  assert.ok(firstEnemyAttackRecovery('medium')>firstEnemyAttackRecovery('hard'));
  assert.ok(firstEnemyAttackRecovery('hard')>firstEnemyAttackRecovery('insane'));
  assert.ok(firstGuardianAttackRecovery('easy')>firstGuardianAttackRecovery('medium'));
  assert.ok(firstGuardianAttackRecovery('medium')>firstGuardianAttackRecovery('hard'));
  assert.ok(firstGuardianAttackRecovery('hard')>firstGuardianAttackRecovery('insane'));
});

test('new runs default to Medium and invalid difficulty choices safely fall back to Medium',()=>{
  const defaultGame=core.createGame(()=>.5);core.start(defaultGame);
  const invalidGame=core.createGame(()=>.5);core.start(invalidGame,'vanguard','nightmare');
  assert.equal(defaultGame.difficulty,'medium');
  assert.equal(invalidGame.difficulty,'medium');
});
