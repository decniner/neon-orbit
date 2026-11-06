const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

test('sustained slow frames reduce render quality in measured steps',()=>{
  const governor=core.createRenderGovernor();let changes=0;
  for(let i=0;i<150;i++)if(core.updateRenderGovernor(governor,1/30))changes++;
  assert.equal(governor.level,2);
  assert.equal(changes,2);
});

test('steady 60 fps holds full render quality',()=>{
  const governor=core.createRenderGovernor();
  for(let i=0;i<360;i++)core.updateRenderGovernor(governor,1/60);
  assert.equal(governor.level,0);
});

test('quality recovers gradually after a long stable interval',()=>{
  const governor=core.createRenderGovernor();governor.level=2;
  for(let i=0;i<300;i++)core.updateRenderGovernor(governor,1/60);
  assert.equal(governor.level,1);
});

test('an isolated long frame does not trigger a quality drop',()=>{
  const governor=core.createRenderGovernor();
  for(let i=0;i<29;i++)core.updateRenderGovernor(governor,1/60);
  core.updateRenderGovernor(governor,.095);
  assert.equal(governor.level,0);
});
