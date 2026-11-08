const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('each stage gives both drones a distinct signature laser palette',()=>{
  const palettes=Array.from({length:6},(_,i)=>[core.droneLaserPalette(i+1,0,0),core.droneLaserPalette(i+1,1,0)]);
  for(let stage=0;stage<6;stage++){
    const [left,right]=palettes[stage];
    assert.notEqual(left.beamColor,right.beamColor,`the drones use separate colors in stage ${stage+1}`);
    assert.ok(left.glowColor&&left.accentColor&&left.coreColor,`stage ${stage+1} has layered beam colors`);
    if(stage)assert.notEqual(palettes[stage-1][0].beamColor,left.beamColor,`the left laser changes in stage ${stage+1}`);
  }
  assert.notEqual(core.droneLaserPalette(7,0,0).beamColor,palettes[0][0].beamColor,'later generations evolve the stage-one palette');
});

test('drone laser events carry stage, side, tier, and palette into the renderer',()=>{
  const game=core.createGame(()=>.5);core.start(game);game.stage=4;game.destination=core.destinationFor(4);game.spawnIn=100;game.supplyIn=100;game.forwardSpeed=0;game.fireIn=100;
  const target={x:game.player.x+90,y:game.player.y-160,r:18,hp:100,maxHp:100,kind:'chaser',speed:0,fireIn:100};game.enemies.push(target);
  const drone=game.drones[1];drone.x=target.x-40;drone.y=target.y-20;drone.state='engage';drone.target=target;drone.retargetIn=1;drone.fireIn=0;
  core.step(game,.05);
  const beam=game.events.find(event=>event.type==='droneLaser');
  assert.equal(beam.stage,4);assert.equal(beam.id,drone.id);assert.equal(beam.level,0);
  assert.equal(beam.beamColor,core.droneLaserPalette(4,drone.id,0).beamColor);
  assert.ok(beam.glowColor&&beam.accentColor&&beam.coreColor);
});
