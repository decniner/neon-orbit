const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('every stage has a distinct alien fleet signature and escalation never drops',()=>{
  const designs=Array.from({length:18},(_,i)=>core.enemyDesignForStage(i+1));
  assert.equal(new Set(designs.slice(0,6).map(item=>item.id)).size,6);
  assert.equal(new Set(designs.slice(6,12).map(item=>item.id)).size,6);
  assert.equal(new Set(designs.map(item=>item.hue)).size,18,'later generations recolor each returning silhouette');
  for(let i=1;i<designs.length;i++){
    assert.notEqual(designs[i].hue,designs[i-1].hue);
    assert.ok(designs[i].severity>designs[i-1].severity);
  }
  assert.equal(designs[6].generation,1);
  assert.equal(designs[12].generation,2);
});

test('spawned aliens retain the fleet identity of their stage',()=>{
  const game=core.createGame(()=>.5);
  core.start(game,'vanguard','medium');
  game.stage=4;game.destination=core.destinationFor(4);game.spawnIn=0;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  core.step(game,.01);
  assert.equal(game.enemies[0].stage,4);
  assert.equal(game.enemies[0].destination.name,game.destination.name);
  assert.equal(core.enemyDesignForStage(game.enemies[0].stage).id,'bone-crowned');
});
