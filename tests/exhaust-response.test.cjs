const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('engine exhaust intensifies from idle cruise to forward thrust and dash',()=>{
  assert.equal(core.exhaustIntensity('ready',0,0),.28,'the menu has a faint idle glow');
  assert.equal(core.exhaustIntensity('playing',0,0),.42,'normal cruise keeps both engines lit');
  assert.equal(core.exhaustIntensity('playing',1,0),1,'forward thrust brightens and lengthens the plume');
  assert.equal(core.exhaustIntensity('playing',0,.1),1.35,'dash produces the strongest exhaust');
  assert.equal(core.exhaustIntensity('paused',1,0),0,'the exhaust powers down outside flight');
});
