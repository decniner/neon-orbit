const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('Eclipse Rail drills a charged red shot through up to four aligned enemies',()=>{
  const game=core.createGame(()=>.5);core.start(game);
  game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.missileIn=100;
  game.weaponTime=8;game.weaponKind='eclipse';game.fireIn=0;
  const targets=[-65,-128,-185,-242,-299].map((offset,index)=>({x:game.player.x,y:game.player.y+offset,r:12,hp:30,maxHp:30,kind:index===2?'heavy':'chaser',speed:0,fireIn:100}));
  game.enemies.push(...targets);

  let events=[];
  for(let i=0;i<7;i++){core.step(game,.05);events.push(...game.events);}

  assert.ok(events.some(event=>event.type==='fire'&&event.weaponKind==='eclipse'));
  assert.deepEqual(targets.slice(0,4).map(enemy=>enemy.hp),[25,25,25,25],'the high-energy slug punches through four armored hulls');
  assert.equal(targets[4].hp,30,'the shot is bounded after four hits');
});
