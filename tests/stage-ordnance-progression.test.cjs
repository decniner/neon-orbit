const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('every stage has distinct rocket and seeker color and power signatures',()=>{
  const signatures=Array.from({length:12},(_,i)=>core.enemyOrdnanceForStage(i+1));
  for(const kind of ['rocket','missile']){
    assert.equal(new Set(signatures.map(s=>s[kind].color)).size,12,`${kind} color evolves at every stage`);
    assert.ok(signatures.every((s,i)=>s[kind].damage>0&&s[kind].radius>0&&(i===0||s[kind].damage>signatures[i-1][kind].damage)),`${kind} power rises stage by stage`);
  }
});

test('enemy ordnance carries its stage signature into projectiles and warnings',()=>{
  const game=core.createGame(()=>.5);core.start(game);game.stage=5;game.wave=5;game.destination=core.destinationFor(5);game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  const enemy={x:game.player.x,y:game.player.y-180,r:21,hp:50,maxHp:50,kind:'heavy',stage:5,speed:0,fireIn:0,age:2};game.enemies.push(enemy);
  core.step(game,.05);
  const projectile=game.enemyBullets.find(b=>b.kind==='rocket'),signature=core.enemyOrdnanceForStage(5).rocket;
  assert.ok(projectile);assert.equal(projectile.stage,5);assert.equal(projectile.color,signature.color);assert.equal(projectile.damage,signature.damage);assert.equal(projectile.blastRadius,signature.radius);
});

test('regular enemy pressure rises with stage without spawning during boss encounters',()=>{
  const early=core.spawnIntervalForStage(1),late=core.spawnIntervalForStage(10);
  assert.ok(late<early,`later stages should spawn regular enemies faster (${early} → ${late})`);
  const game=core.createGame(()=>.5);core.start(game);game.stage=5;game.wave=5;game.spawnIn=0;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  game.enemies.push({x:500,y:120,r:44,hp:100,maxHp:100,kind:'boss',stage:5,speed:0,fireIn:100,age:2});
  core.step(game,.05);
  assert.equal(game.enemies.filter(e=>e.kind!=='boss').length,0);
});
