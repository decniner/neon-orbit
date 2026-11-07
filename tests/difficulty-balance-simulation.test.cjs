const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../site/core.js');

function simulate(difficulty,seedIndex){
  let seed=(seedIndex*2654435761)>>>0;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  const game=core.createGame(random);core.start(game,'cinder',difficulty);
  for(let frame=0;frame<7200&&game.mode!=='over';frame++){
    const seconds=frame/60,phase=seedIndex*.317;
    const x=Math.sin(seconds*(.19+seedIndex*.002)+phase);
    const y=.55*Math.sin(seconds*.13+phase*1.7);
    if(frame%270===0&&game.dashCooldown<=0)core.dash(game,{x,y});
    core.step(game,1/60,{x,y});
    if(game.mode==='upgrade')core.chooseUpgrade(game,game.choices[0]);
  }
  return{survived:game.mode!=='over'&&game.time>119,bosses:game.bossesDefeated,time:game.time};
}

test('difficulty tiers produce a clear survival and guardian progression across 80 seeded flights',()=>{
  const results=Object.fromEntries(core.DIFFICULTIES.map(({id})=>{
    const runs=Array.from({length:20},(_,i)=>simulate(id,i+1));
    return[id,{fullFlights:runs.filter(run=>run.survived).length,guardianClears:runs.filter(run=>run.bosses>0).length,medianTime:runs.map(run=>run.time).sort((a,b)=>a-b)[9]}];
  }));

  assert.ok(results.easy.fullFlights>=16,`Easy should be forgiving: ${JSON.stringify(results.easy)}`);
  assert.ok(results.medium.fullFlights>=14,`Medium should be consistently survivable: ${JSON.stringify(results.medium)}`);
  assert.ok(results.medium.fullFlights<results.easy.fullFlights,`Medium should pressure more than Easy: ${JSON.stringify(results)}`);
  assert.ok(results.hard.fullFlights>0&&results.hard.fullFlights<results.medium.fullFlights,`Hard should be a clear step up: ${JSON.stringify(results)}`);
  assert.ok(results.insane.fullFlights<results.hard.fullFlights,`Insane should remain the harshest tier: ${JSON.stringify(results)}`);
  assert.ok(results.medium.guardianClears>results.hard.guardianClears&&results.hard.guardianClears>results.insane.guardianClears,`Guardian progression should get harder by tier: ${JSON.stringify(results)}`);
});
