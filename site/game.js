(() => {
'use strict';
const $=id=>document.getElementById(id), C=OrbitCore;
const canvas=$('game'),ctx=canvas.getContext('2d'),mobileEdition=document.body.dataset.edition==='mobile';
function measureViewport(){const r=canvas.getBoundingClientRect();return {width:r.width||window.innerWidth,height:r.height||window.innerHeight};}
if(mobileEdition){const viewport=measureViewport();C.configureViewport(viewport.width,viewport.height,true);}
const g=C.createGame();
const assetRoot=canvas.dataset.assetRoot||'assets/';
const art={wayfarer:new Image(),sentinel:new Image(),interceptor:new Image(),sentry:new Image(),heavy:new Image()};for(const [name,image] of Object.entries(art)){image.decoding='async';image.src=new URL(`${assetRoot}${name}.webp`,document.baseURI).href;}

const weaponInfo={triple:{name:'TRIPLE FIRE',icon:'W',color:'#dec594'},pulse:{name:'PULSE CANNON',icon:'P',color:'#8fdcf0'},seeker:{name:'SEEKER MISSILES',icon:'S',color:'#c9a5ff'}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys=new Set(), particles=[], rings=[], floats=[], stars=Array.from({length:mobileEdition?230:170},(_,i)=>{const frac=n=>(Math.sin(n)*43758.5453%1+1)%1;return{x:frac(i*127.1)*C.WIDTH,y:frac(i*311.7)*C.HEIGHT,r:i%13===0?1.3:.45+frac(i*42)*.55,depth:.25+frac(i*77)*.75,phase:frac(i*19)*6.28,warm:i%17===0};});
let best=0,sound=true,voicesEnabled=false,last=0,clock=0,announcementUntil=0,flash=0,shake=0,hitStop=0,stickId=null,touch={x:0,y:0},previousMode='ready',flightHeading=-Math.PI/2,enginePower=0;
try{const stored=Number(localStorage.getItem('neon-orbit-best'));best=Number.isFinite(stored)?Math.max(0,stored):0;sound=localStorage.getItem('neon-orbit-sound')!=='off';voicesEnabled=localStorage.getItem('neon-orbit-voices')==='on';}catch{}
const soundEngine=new OrbitAudio.SoundEngine({enabled:sound});
const crew=new OrbitVoices.CrewVoices({enabled:voicesEnabled,onLine(text){announce(text,3.5);}});
$('best').textContent=format(best);
function format(v){return String(Math.floor(v)).padStart(6,'0');}
function time(v){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
function tone(freq,duration=.08,type='sine',volume=.025){soundEngine.tone(freq,duration,type,volume);}
function announce(text,duration,style=''){announcementUntil=clock+duration;const element=$('announcement');element.textContent=text;element.classList.toggle('guardian-warning',style==='guardian');}
function syncSound(){ $('soundButton').setAttribute('aria-pressed',String(sound));$('soundButton').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('soundLabel').textContent=sound?'Sound on':'Sound off';$('soundIcon').textContent=sound?'♫':'♪';}
function syncVoices(){$('voicesButton').setAttribute('aria-pressed',String(voicesEnabled));$('voicesButton').setAttribute('aria-label',voicesEnabled?'Turn crew dialogue off':'Turn crew dialogue on');$('voicesLabel').textContent=voicesEnabled?'Voices on':'Voices off';$('voicesIcon').textContent=voicesEnabled?'◉':'◌';}
function setSound(){sound=!sound;soundEngine.setEnabled(sound);syncSound();try{localStorage.setItem('neon-orbit-sound',sound?'on':'off');}catch{}if(sound)tone(660,.13);}
function setVoices(){voicesEnabled=!voicesEnabled;crew.setEnabled(voicesEnabled);if(voicesEnabled){crew.unlock();if(g.mode==='playing')crew.greet();}syncVoices();try{localStorage.setItem('neon-orbit-voices',voicesEnabled?'on':'off');}catch{}}
syncSound();syncVoices();
function input(){return {x:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+touch.x,y:(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+touch.y};}
function resetTouch(){touch={x:0,y:0};stickId=null;$('stick').style.transform='';}
function launch(){if(g.mode==='upgrade')return;soundEngine.unlock();crew.unlock();const resuming=g.mode==='paused';if(resuming){C.togglePause(g);}else{C.start(g);particles.length=0;rings.length=0;floats.length=0;flash=0;shake=0;hitStop=0;announcementUntil=0;crew.greet();}keys.clear();resetTouch();$('helpDialog').close();soundEngine.effect('launch');syncMenu();$('startButton').blur();}
function pause(){C.togglePause(g);if(g.mode==='paused')crew.pause();keys.clear();resetTouch();syncMenu();}
function syncMenu(){document.body.dataset.mode=g.mode;const show=g.mode!=='playing';$('menu').hidden=!show;document.body.classList.toggle('playing',!show);$('pauseButton').disabled=g.mode==='ready'||g.mode==='over';$('pauseButton').textContent=g.mode==='paused'?'▷':'Ⅱ';$('pauseButton').setAttribute('aria-label',g.mode==='paused'?'Resume game':'Pause game');$('orbitCaption').hidden=g.mode!=='ready';$('runStats').hidden=g.mode!=='over';$('arenaStatus').innerHTML=`<span class="status-dot"></span> ${g.mode==='playing'?'PILOT CONNECTED':g.mode==='paused'?'FLIGHT ON HOLD':g.mode==='over'?'SIGNAL LOST':'AWAITING PILOT'}`;
if(g.mode==='ready'){return;}
if(g.mode==='paused'){$('menuTitle').innerHTML='Take a<br><em>breather.</em>';$('menuDescription').textContent='Your orbit will be right here.';$('startButton').innerHTML='Back to the orbit <span>↗</span>';$('menuHint').innerHTML='<kbd>P</kbd> or <kbd>↵</kbd> to resume';}
if(g.mode==='over'){if(g.score>best){best=g.score;try{localStorage.setItem('neon-orbit-best',String(best));}catch{}}$('best').textContent=format(best);$('menuTitle').innerHTML='Another<br><em>orbit?</em>';$('menuDescription').textContent=g.score>0&&g.score===best?'A personal best. There’s still more out there.':'Every run is a new rhythm. Find yours.';$('runStats').innerHTML=`<div class="result-score">${format(g.score)}<small>POINTS</small></div><div class="result-grid"><div><strong>${time(g.time)}</strong><span>SURVIVED</span></div><div><strong>${g.kills}</strong><span>CLEARED</span></div><div><strong>${g.peakCombo}×</strong><span>BEST STREAK</span></div><div><strong>${g.level}</strong><span>SHIP LEVEL</span></div></div>`;$('startButton').innerHTML='Fly again <span>↗</span>';$('menuHint').innerHTML='<kbd>↵</kbd> for one more run';}
if(show)$('startButton').focus({preventScroll:true});
}
function burst(x,y,color,count=12){if(reduced)count=3;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.4,max:.8,color});}if(particles.length>400)particles.splice(0,particles.length-400);}
function events(){
 for(const e of g.events){
  if(e.type==='kill'){burst(e.x,e.y,'#edac89',22);ring(e.x,e.y,'#edac89',48);shake=Math.max(shake,1.7);hitStop=reduced?0:.025;soundEngine.effect('kill');}
  if(e.type==='impact'){burst(e.x,e.y,'#e9f9e7',4);if(e.damage>1)floats.push({x:e.x,y:e.y,text:String(e.damage),color:'#d7eee5',life:.5,max:.5});}
  if(e.type==='enemyFire'){const fx=e.x+Math.cos(e.angle)*20,fy=e.y+Math.sin(e.angle)*20;burst(fx,fy,e.kind==='gun'?'#ffd48f':'#ff9e68',e.kind==='gun'?3:7);soundEngine.effect(e.kind==='gun'?'enemyGun':'enemyMissile');}
  if(e.type==='missileTrail'){const speed=Math.hypot(e.vx,e.vy)||1;burst(e.x-e.vx/speed*12,e.y-e.vy/speed*12,e.source==='player'?'#a9cbd0':'#a88173',2);}
  if(e.type==='explosion'){const color=e.source==='player'?'#c9a5ff':'#ff986e';burst(e.x,e.y,'#fff0c4',13);burst(e.x,e.y,color,26);ring(e.x,e.y,'#ffe2ad',e.radius*2.5);ring(e.x,e.y,color,e.radius*1.55);shake=Math.max(shake,e.source==='player'?3:5);soundEngine.effect('explosion');}
  if(e.type==='pickup'){burst(e.x,e.y,e.weapon?weaponInfo[e.weaponKind||'triple'].color:'#9af1d1',e.weapon||e.repair?22:6);tone(e.weapon?880:e.repair?720:520+g.combo*65,.18);if(e.points)floats.push({x:e.x,y:e.y-12,text:`+${e.points}`,color:'#9af1d1',life:.8,max:.8});if(e.weapon||e.repair)ring(e.x,e.y,e.weapon?weaponInfo[e.weaponKind].color:'#9af1d1',100);if(e.weapon||e.repair)announce(e.weapon?`OVERDRIVE / ${weaponInfo[e.weaponKind||'triple'].name} / 12s`:(e.repaired?'HULL REPAIRED / +1':'HULL ALREADY FULL'),2.5);}
  if(e.type==='decoyHit'){burst(e.x,e.y,'#80f0db',8);ring(e.x,e.y,'#80f0db',42);}
  if(e.type==='hit'){flash=.24;shake=8;burst(e.x,e.y,'#e78682',30);ring(e.x,e.y,'#e78682',100);soundEngine.effect('hit');}
  if(e.type==='bossCountdown'){announce(`GUARDIAN INBOUND / T−${String(e.seconds).padStart(2,'0')}`,1.05,'guardian');tone(260+(5-e.seconds)*78,.14,'triangle',.035);}
  if(e.type==='wave'){announce(`SECTOR ${String(e.wave).padStart(2,'0')} / STAY SHARP`,2.8);tone(360,.3);}
  if(e.type==='supply'){announce(e.weapon?`SUPPLY DROP / ${weaponInfo[e.weaponKind||'triple'].name}`:'SUPPLY DROP / COLLECT GREEN +',2.5);tone(600,.2);}
  if(e.type==='boss'){announce(`GUARDIAN INBOUND / ${e.destination?.boss||'SENTINEL'}`,3);soundEngine.effect('boss');}
  if(e.type==='bossDefeated'){announce(`GUARDIAN CLEARED / +${e.bonus} PTS`,2.5);burst(e.x,e.y,'#dec594',80);ring(e.x,e.y,'#dec594',300);shake=11;hitStop=reduced?0:.08;soundEngine.effect('upgrade');}
  if(e.type==='stageComplete'){announce(`ROUTE UNLOCKED / ${e.destination.name}`,4);tone(540,.22);}
  if(e.type==='levelUp'){ring(g.player.x,g.player.y,'#9af1d1',170);soundEngine.effect('upgrade');}
  if(e.type==='upgrade'){ring(g.player.x,g.player.y,'#9af1d1',160);burst(g.player.x,g.player.y,'#9af1d1',36);announce(`EVOLUTION / ${C.UPGRADES[e.id].name.toUpperCase()}`,2.1);soundEngine.effect('upgrade');}
  if(e.type==='fire')soundEngine.effect('fire',e.weaponKind);
 }
}
function performDash(){if(C.dash(g,input())){burst(g.player.x,g.player.y,'#9af1d1',16);ring(g.player.x,g.player.y,'#9af1d1',70);announce('DECOY DEPLOYED / DRAWING FIRE',1.8);soundEngine.effect('dash');}}
function ring(x,y,color,size){rings.push({x,y,color,size,life:.65,max:.65});if(rings.length>35)rings.shift();}
let viewportWidth=0,viewportHeight=0;
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(mobileEdition&&(Math.abs(r.width-viewportWidth)>.5||Math.abs(r.height-viewportHeight)>.5)){viewportWidth=r.width;viewportHeight=r.height;C.configureViewport(r.width,r.height,true);g.player.x=Math.max(C.CORRIDOR.left,Math.min(C.CORRIDOR.right,g.player.x));}const w=Math.round(r.width*d),h=Math.round(r.height*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
new ResizeObserver(resize).observe($('arena'));
function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function circle(x,y,r,color,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function ship(x,y,angle,scale=1,alpha=1,roll=0){
 const image=art.wayfarer,w=62,h=77;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.scale(scale,scale);ctx.transform(Math.cos(roll),Math.sin(roll)*.92,0,1,0,0);ctx.globalAlpha=alpha;
 const power=Math.max(enginePower,g.mode==='ready'?.23:g.mode==='playing'?.48:0,g.dashTime>0?1.2:0);if(power>.06){const pulse=.86+Math.sin(clock*24)*.14;ctx.globalAlpha=alpha;for(const nozzle of [-9,9]){const length=7+power*12*pulse,gradient=ctx.createLinearGradient(nozzle,17,nozzle,17+length);gradient.addColorStop(0,'#eaffffdd');gradient.addColorStop(.24,'#9af1d1c9');gradient.addColorStop(1,'#58b7bd00');ctx.fillStyle=gradient;ctx.shadowColor='#8cf1d2';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(nozzle-3,17);ctx.quadraticCurveTo(nozzle-2,20,nozzle-1,18+length);ctx.quadraticCurveTo(nozzle+2,20,nozzle+3,17);ctx.closePath();ctx.fill();}ctx.shadowBlur=0;}
 if(image.complete&&image.naturalWidth){ctx.shadowColor='#9af1d1';ctx.shadowBlur=10+enginePower*5;ctx.drawImage(image,-w/2,-h/2,w,h);ctx.shadowBlur=0;if(g.hp<g.maxHp){ctx.strokeStyle='#ad7560b5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(10,-2);ctx.lineTo(13,1);ctx.lineTo(11,4);if(g.hp<g.maxHp-1){ctx.moveTo(-12,6);ctx.lineTo(-10,9);ctx.lineTo(-13,12);}ctx.stroke();}}
 else{ctx.shadowColor='#9af1d1';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(12,13);ctx.lineTo(0,7);ctx.lineTo(-12,13);ctx.closePath();ctx.fillStyle='#b8f9dd';ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(5,7);ctx.lineTo(0,3);ctx.lineTo(-5,7);ctx.closePath();ctx.fillStyle='#20483f';ctx.fill();}shipEvolution();ctx.restore();
 ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.globalAlpha=alpha;
 for(const side of [-1,1]){ctx.save();ctx.translate(side*11,-8);ctx.rotate(g.gunAngle-angle);ctx.fillStyle='#25323a';ctx.strokeStyle='#b5c2ba';ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(0,0,4.1,3.4,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#647178';ctx.fillRect(-1.45,-9,2.9,8);ctx.fillStyle='#c4cfc8';ctx.fillRect(-.7,-8,1.1,5.5);ctx.fillStyle='#121d25';ctx.fillRect(-1.25,-10,2.5,2.3);if(g.gunFlash>0&&side===g.gunSide){ctx.shadowColor='#fff3b4';ctx.shadowBlur=10;ctx.fillStyle='#fff8d1';ctx.beginPath();ctx.ellipse(0,-11,1.8,3.5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}ctx.restore();}ctx.restore();
}
function shipEvolution(){
 const damage=g.upgrades.damage||0,hull=g.upgrades.hull||0,haste=g.upgrades.haste||0,dash=g.upgrades.dash||0,magnet=g.upgrades.magnet||0;
 if(magnet){ctx.save();ctx.globalAlpha=.18+.06*Math.sin(clock*3);ctx.setLineDash([3,7]);ctx.strokeStyle='#9af1d1';ctx.lineWidth=1.2;ctx.shadowColor='#9af1d1';ctx.shadowBlur=9;ctx.beginPath();ctx.ellipse(0,0,28+magnet*4,42+magnet*5,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
 for(const side of [-1,1]){
  for(let i=0;i<damage;i++){const px=side*(24+i*7),py=-7+i*5;ctx.save();ctx.translate(px,py);ctx.fillStyle='#27363a';ctx.strokeStyle='#dec594';ctx.lineWidth=.85;ctx.shadowColor='#e8bd79';ctx.shadowBlur=4+haste*2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(side*4,-4);ctx.lineTo(side*4,8);ctx.lineTo(0,5);ctx.lineTo(-side*4,8);ctx.lineTo(-side*4,-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#ffe3a7';ctx.fillRect(-1,-12,2,5);ctx.restore();}
  for(let i=0;i<hull;i++){const px=side*(18+i*4),py=4+i*5;ctx.save();ctx.translate(px,py);ctx.fillStyle=i%2?'#63736d':'#a6a28a';ctx.strokeStyle='#e4d2aa';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(-side*5,-7);ctx.lineTo(side*6,-9);ctx.lineTo(side*9,0);ctx.lineTo(side*4,8);ctx.lineTo(-side*5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  if(haste){ctx.fillStyle='#b5f5ef';ctx.shadowColor='#7ee7e0';ctx.shadowBlur=6+haste*3;ctx.beginPath();ctx.ellipse(side*(12+haste*2),20,2+haste,4+haste*2,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  if(dash){ctx.strokeStyle='#8ecdf2';ctx.shadowColor='#70c9ff';ctx.shadowBlur=8;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(side*16,10);ctx.lineTo(side*(25+dash*3),-1);ctx.lineTo(side*(20+dash*2),16);ctx.stroke();ctx.shadowBlur=0;}
 }
 if(g.weaponTime>0&&g.weaponKind==='triple'){for(const side of [-1,1]){ctx.fillStyle='#896a43';ctx.strokeStyle='#ffe1a0';ctx.lineWidth=.8;ctx.fillRect(side*24-3,-3,6,13);ctx.strokeRect(side*24-3,-3,6,13);ctx.fillStyle='#fff0bd';ctx.fillRect(side*24-1,-13,2,10);}}
 if(g.weaponTime>0&&g.weaponKind==='pulse'){ctx.fillStyle='#b5fbff';ctx.shadowColor='#77eaff';ctx.shadowBlur=16;ctx.beginPath();ctx.ellipse(0,-28,4,8,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#8eeaff';ctx.globalAlpha=.68;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,-13,18,Math.PI*1.08,Math.PI*1.92);ctx.stroke();ctx.globalAlpha=1;}
 if(g.weaponTime>0&&g.weaponKind==='seeker'){missileCraft(-18,2,-Math.PI/2,'#d1afff',false);missileCraft(18,2,-Math.PI/2,'#d1afff',false);}
}
function missileCraft(x,y,angle,color,heavy=false){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);const s=heavy?1.3:1,L=14*s,R=3.1*s;
 // A compact guided missile: pointed nose, cylindrical body, swept stabilizers and a hot engine bell.
 ctx.globalAlpha=.85;ctx.fillStyle='#ffb875';ctx.shadowColor='#ff8754';ctx.shadowBlur=heavy?12:8;ctx.beginPath();ctx.moveTo(-L,0);ctx.lineTo(-L-7*s,-2*s);ctx.lineTo(-L-4*s,0);ctx.lineTo(-L-7*s,2*s);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
 ctx.fillStyle='#a9b2ad';ctx.strokeStyle='#e9e0c9';ctx.lineWidth=.65*s;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-L+5*s,side*1.7*s);ctx.lineTo(-L-5*s,side*8*s);ctx.lineTo(-L-3*s,side*1.5*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(3*s,side*1.7*s);ctx.lineTo(-1*s,side*5*s);ctx.lineTo(1*s,side*1.4*s);ctx.closePath();ctx.fill();ctx.stroke();}
 const metal=ctx.createLinearGradient(0,-R,0,R);metal.addColorStop(0,'#edf0df');metal.addColorStop(.32,'#aeb9b5');metal.addColorStop(.58,'#65747b');metal.addColorStop(1,'#34424a');ctx.fillStyle=metal;ctx.strokeStyle='#f0dfbd';ctx.lineWidth=.75*s;ctx.beginPath();ctx.moveTo(L+5*s,0);ctx.quadraticCurveTo(L+3*s,-R*.58,L,-R);ctx.lineTo(-L+1*s,-R);ctx.quadraticCurveTo(-L-1*s,-R,-L-1*s,-R*.55);ctx.lineTo(-L-1*s,R*.55);ctx.quadraticCurveTo(-L-1*s,R,-L+1*s,R);ctx.lineTo(L,R);ctx.quadraticCurveTo(L+3*s,R*.58,L+5*s,0);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#56646b';ctx.fillRect(-L+2*s,-R,1.15*s,R*2);ctx.fillStyle=heavy?'#db947a':'#c9b0df';ctx.beginPath();ctx.moveTo(L+5*s,0);ctx.lineTo(L,R*.55);ctx.lineTo(L,R*.28);ctx.lineTo(L+1.5*s,0);ctx.lineTo(L,R*.28);ctx.lineTo(L,R*.55);ctx.closePath();ctx.fill();
 ctx.fillStyle='#242d32';ctx.fillRect(-L-1.7*s,-R*.78,2*s,R*1.56);ctx.fillStyle='#e3c38e';ctx.fillRect(-L+5*s,-R*.76,1.2*s,R*1.52);ctx.restore();
}
function planet(x,y,r,phase=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(-.28);
 const atmosphere=ctx.createRadialGradient(-r*.3,-r*.25,r*.5,0,0,r*2);atmosphere.addColorStop(0,'#8fccc100');atmosphere.addColorStop(.65,'#79b9b72a');atmosphere.addColorStop(1,'#79b9b700');ctx.fillStyle=atmosphere;ctx.fillRect(-r*2,-r*2,r*4,r*4);
 ctx.strokeStyle='#c5d5cc3a';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,r*1.72,r*.48,0,Math.PI,Math.PI*2);ctx.stroke();
 const sphere=ctx.createRadialGradient(-r*.38,-r*.45,r*.04,0,0,r*1.18);sphere.addColorStop(0,'#b2c9bfa8');sphere.addColorStop(.36,'#718f8eb4');sphere.addColorStop(.76,'#405f69c8');sphere.addColorStop(1,'#192b34ee');ctx.fillStyle=sphere;ctx.shadowColor='#84b5b254';ctx.shadowBlur=25;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.save();ctx.beginPath();ctx.arc(0,0,r-1,0,Math.PI*2);ctx.clip();
 for(let i=0;i<6;i++){const yy=-r*.7+i*r*.23+Math.sin(phase+i)*r*.025;ctx.strokeStyle=i%2?'#c5d0b915':'#101e261c';ctx.lineWidth=r*(.07+i%3*.025);ctx.beginPath();ctx.ellipse(-r*.1,yy,r*.92,r*(.14+i%2*.05),.1,0,Math.PI*2);ctx.stroke();}
 const night=ctx.createRadialGradient(r*.65,-r*.05,r*.12,r*.34,0,r*1.25);night.addColorStop(0,'#07101b00');night.addColorStop(.52,'#07101b20');night.addColorStop(1,'#07101baf');ctx.fillStyle=night;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
 ctx.strokeStyle='#b4cbb253';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,r*1.72,r*.48,0,Math.PI*1.03,Math.PI*1.9);ctx.stroke();ctx.restore();
}
const landmarks=[{x:-1150,y:-760,r:52,phase:.2},{x:1450,y:630,r:82,phase:1.3},{x:3650,y:-1150,r:42,phase:2.4},{x:-3050,y:1540,r:68,phase:3.1},{x:5500,y:1900,r:96,phase:.7},{x:-5800,y:-2450,r:60,phase:1.9}];
function background(preview){
 const width=C.WIDTH,height=C.HEIGHT,cx=width/2,cy=preview?height*.52:height*.8;
 ctx.fillStyle='#09121b';ctx.fillRect(0,0,width,height);const nebula=ctx.createRadialGradient(width*.79,height*.26,0,width*.72,height*.38,Math.max(width,height)*.72);nebula.addColorStop(0,'#50436924');nebula.addColorStop(.5,'#193c4b12');nebula.addColorStop(1,'#09121b00');ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
 const routeGlow=ctx.createRadialGradient(cx,height*.11,0,cx,height*.2,Math.max(width,height)*.86);routeGlow.addColorStop(0,`${g.destination?.color||'#9af1d1'}22`);routeGlow.addColorStop(1,'#09121b00');ctx.fillStyle=routeGlow;ctx.fillRect(0,0,width,height);
 const glow=ctx.createRadialGradient(preview?width*.7:cx,cy,0,preview?width*.7:cx,cy,Math.max(width,height)*.68);glow.addColorStop(0,'#153a3c72');glow.addColorStop(1,'#09121b00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 for(const s of stars){const drift=clock*s.depth*1.2,worldShift=preview?0:g.player.x*s.depth*.48,worldShiftY=preview?0:g.player.y*s.depth*.48,x=((s.x+drift-worldShift)%width+width)%width,y=((s.y+Math.sin(clock*.35+s.phase)*s.depth*2-worldShiftY)%height+height)%height,twinkle=.15+(.22+.22*Math.sin(clock*1.6+s.phase))*s.depth;ctx.globalAlpha=twinkle;ctx.fillStyle=s.warm?'#dec594':'#b8d9dc';ctx.fillRect(x,y,s.r,s.r);if(s.r>1.1){ctx.globalAlpha=twinkle*.38;ctx.fillRect(x-2,y+.6,s.r+4,.5);}}ctx.globalAlpha=1;
 if(preview&&mobileEdition){const orbitY=height*.55,orbitR=width*.37,a=reduced?-.8:clock*.12-.8;for(const r of [orbitR,orbitR*.72,orbitR*.48])circle(cx,orbitY,r,'#79bfb228',1);ctx.save();ctx.translate(cx,orbitY);ctx.rotate(-.35);ctx.setLineDash([3,8]);circle(0,0,orbitR*1.12,'#dec59430',1);ctx.setLineDash([]);ctx.beginPath();ctx.arc(0,0,orbitR,a-1.1,a);ctx.strokeStyle='#9af1d1';ctx.lineWidth=2;ctx.shadowColor='#9af1d1';ctx.shadowBlur=18;ctx.stroke();ship(Math.cos(a)*orbitR,Math.sin(a)*orbitR,a+Math.PI/2,1.15);ctx.restore();planet(width*.8,height*.14,width*.13,clock);ctx.fillStyle='#9af1d1';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('ORBITAL FIELD',cx,orbitY+orbitR*1.35);return;}
 if(preview){planet(width*.86,height*.17,Math.min(67,width*.2),clock);planet(width*.23,height*.76,Math.min(31,width*.1),clock*.4);for(let x=0;x<=width;x+=Math.max(25,width/20))line(x,0,x,height,'#7cc8c405',.6);for(let y=0;y<=height;y+=50)line(0,y,width,y,'#7cc8c405',.6);}
 else for(const body of landmarks){const x=cx+(body.x-g.player.x)*.56,y=cy+(body.y-g.player.y)*.56;if(x>-190&&x<1190&&y>-190&&y<840)planet(x,y,body.r,body.phase+clock*.03);}
 if(preview){const orbitScale=mobileEdition?Math.min(1,width/700):1;for(const r of [90,166,240,316].map(v=>v*orbitScale))circle(cx,cy,r,'#9af1d110',.8);line(cx-width*.36,cy,cx+width*.36,cy,'#9af1d10a');line(cx,cy-height*.45,cx,cy+height*.45,'#9af1d10a');
 ctx.save();ctx.translate(cx,cy);ctx.rotate(reduced?-.3:clock*.025);for(let i=0;i<80;i++){const a=i*Math.PI/40,r=i%5===0?308:313;line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*319,Math.sin(a)*319,i%5===0?'#a9cec033':'#a9cec015',.8);}for(let i=0;i<13;i++){const a=i*.93,r=292+(i%4)*13,xx=Math.cos(a)*r,yy=Math.sin(a)*r;ctx.save();ctx.translate(xx,yy);ctx.rotate(a);ctx.fillStyle=i%3?'#71807a48':'#dec59455';ctx.beginPath();ctx.moveTo(-4,-2);ctx.lineTo(2,-3);ctx.lineTo(5,1);ctx.lineTo(-2,3);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
 if(preview){const a=reduced?-.8:clock*.12-.8;ctx.save();ctx.translate(cx,cy);ctx.rotate(-.35);ctx.scale(1,.82);circle(0,0,239,'#79bfb222');ctx.setLineDash([3,8]);circle(0,0,278,'#dec59430');ctx.setLineDash([]);ctx.beginPath();ctx.arc(0,0,239,a-1.1,a);ctx.strokeStyle='#9af1d1';ctx.lineWidth=2;ctx.shadowColor='#9af1d1';ctx.shadowBlur=18;ctx.stroke();const x=Math.cos(a)*239,y=Math.sin(a)*239;ship(x,y,a+Math.PI/2,1.5);ctx.shadowBlur=0;for(const [ang,r]of [[1.5,166],[3.1,240],[-1.5,278]]){const xx=Math.cos(ang)*r,yy=Math.sin(ang)*r;ctx.fillStyle='#dec594';ctx.fillRect(xx-3,yy-3,6,6);circle(xx,yy,11,'#dec59430');}ctx.restore();circle(cx,cy,43,'#9af1d12a');circle(cx,cy,37,'#9af1d11a');ctx.fillStyle='#9af1d1';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('01',cx,cy+4);ctx.fillStyle='#4b706e';ctx.font='8px monospace';ctx.fillText('ORBITAL FIELD',cx,cy+66);}
}}
function enemyCraft(e,color,{sentry=false,interceptor=false,heavy=false}={}){
 const r=e.r;ctx.save();ctx.translate(e.x,e.y);const angle=Math.atan2(g.player.y-e.y,g.player.x-e.x);
 const image=art[interceptor?'interceptor':sentry?'sentry':heavy?'heavy':null],hasImage=image?.complete&&image.naturalWidth;
 ctx.rotate(hasImage||!interceptor?angle+Math.PI/2:angle);
 if(hasImage){const size=r*(heavy?3.55:3.25),w=size*image.naturalWidth/image.naturalHeight,h=size;ctx.globalAlpha=.96;ctx.shadowColor=color;ctx.shadowBlur=9;ctx.drawImage(image,-w/2,-h/2,w,h);ctx.shadowBlur=0;if(e.hp<e.maxHp){ctx.strokeStyle='#f2bb93aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.35,-r*.12);ctx.lineTo(-r*.08,r*.1);ctx.stroke();}if(sentry){ctx.strokeStyle='#e6c6ff7a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r+5,clock*.3,clock*.3+Math.PI*1.5);ctx.stroke();}ctx.restore();return;}
 const metal=ctx.createLinearGradient(-r,-r,r,r);metal.addColorStop(0,'#819194');metal.addColorStop(.36,'#3c5158');metal.addColorStop(.7,'#202f38');metal.addColorStop(1,'#101c24');ctx.fillStyle=metal;ctx.strokeStyle=color;ctx.lineWidth=1.15;ctx.shadowColor=color;ctx.shadowBlur=7;
 ctx.beginPath();if(interceptor){ctx.moveTo(r*1.25,0);ctx.lineTo(-r*.92,-r*.82);ctx.lineTo(-r*.52,-r*.23);ctx.lineTo(-r*.8,0);ctx.lineTo(-r*.52,r*.23);ctx.lineTo(-r*.92,r*.82);}else if(sentry){for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}}else if(heavy){ctx.moveTo(-r*.75,-r*.75);ctx.lineTo(r*.75,-r*.75);ctx.lineTo(r*1.08,-r*.3);ctx.lineTo(r*.88,r*.72);ctx.lineTo(r*.4,r);ctx.lineTo(-r*.4,r);ctx.lineTo(-r*.88,r*.72);ctx.lineTo(-r*1.08,-r*.3);}else{ctx.moveTo(0,-r*1.05);ctx.lineTo(r*.9,-r*.35);ctx.lineTo(r*.72,r*.62);ctx.lineTo(0,r*.9);ctx.lineTo(-r*.72,r*.62);ctx.lineTo(-r*.9,-r*.35);}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 if(sentry){ctx.fillStyle='#263840';ctx.fillRect(-r*.9,-r*.12,r*1.8,r*.24);for(const side of [-1,1]){ctx.fillStyle='#c5a2e6';ctx.shadowColor=color;ctx.shadowBlur=9;ctx.fillRect(side*r*.72-2,-r*.06,4,r*.12);}ctx.shadowBlur=0;}
 else{ctx.fillStyle='#16262d';ctx.beginPath();ctx.ellipse(0,-r*.12,r*(heavy?.29:.23),r*(heavy?.27:.38),0,0,Math.PI*2);ctx.fill();const cockpit=ctx.createLinearGradient(0,-r*.5,0,r*.18);cockpit.addColorStop(0,'#b7eff0');cockpit.addColorStop(.5,color);cockpit.addColorStop(1,'#34515a');ctx.fillStyle=cockpit;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(0,-r*.12,r*.16,r*.28,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 for(const side of [-1,1]){ctx.fillStyle='#f6bb80';ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(side*r*.48,r*.52,r*.09,r*.16,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;} }
 if(e.hp<e.maxHp){ctx.strokeStyle='#d8b18a99';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-r*.45,-r*.25);ctx.lineTo(-r*.12,-r*.04);ctx.lineTo(-r*.32,r*.14);ctx.stroke();}
 if(sentry){ctx.strokeStyle='#e6c6ff7a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r+5,clock*.3,clock*.3+Math.PI*1.5);ctx.stroke();}ctx.restore();
 if(e.hp<e.maxHp){const width=r*2.2,x=e.x-width/2,y=e.y-r-18;ctx.fillStyle='#07121add';ctx.fillRect(x,y,width,4);ctx.fillStyle=e.hp/e.maxHp<.35?'#ee8c83':color;ctx.fillRect(x,y,width*Math.max(0,e.hp/e.maxHp),4);}
}
function drawBoss(e,color){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.atan2(g.player.y-e.y,g.player.x-e.x)+Math.PI/2);const pulse=.5+.5*Math.sin(clock*2);circle(0,0,e.r+22+pulse*4,'#e8bf8b18',1);ctx.shadowColor='#e8bf8b';ctx.shadowBlur=24+pulse*12;const image=art.sentinel;if(image.complete&&image.naturalWidth){const h=e.r*3.1,w=h*image.naturalWidth/image.naturalHeight;ctx.globalAlpha=e.age<1.5?.35+e.age*.43:1;ctx.drawImage(image,-w/2,-h/2,w,h);if(e.hitFlash>0){ctx.globalAlpha=.24;ctx.globalCompositeOperation='source-atop';ctx.fillStyle='#fff2df';ctx.fillRect(-w/2,-h/2,w,h);ctx.globalCompositeOperation='source-over';}}
 else{ctx.restore();enemyCraft(e,color);return;}ctx.shadowBlur=0;ctx.restore();
}


function drawCorridor(){const top=g.cameraY-520,bottom=top+C.HEIGHT;for(const side of [C.CORRIDOR.left,C.CORRIDOR.right]){const grad=ctx.createLinearGradient(side-14,0,side+14,0);grad.addColorStop(0,'#72dec000');grad.addColorStop(.5,'#72dec04a');grad.addColorStop(1,'#72dec000');ctx.fillStyle=grad;ctx.fillRect(side-14,top,28,C.HEIGHT);line(side,top,side,bottom,'#8be9cc99',1.5);for(let y=top+((g.time*90)%70);y<bottom;y+=70){line(side-4,y,side+4,y+18,'#b0f1d566',1);}}}
function draw(dt){resize();ctx.setTransform(canvas.width/C.WIDTH,0,0,canvas.height/C.HEIGHT,0,0);const preview=g.mode==='ready';background(preview);ctx.save();if(g.mode==='playing'||g.mode==='paused'){ctx.translate(0,520-g.cameraY);drawCorridor();if(!reduced&&shake>0)ctx.translate(Math.sin(clock*105)*shake,Math.cos(clock*93)*shake*.6);}
if(!preview){for(const p of g.pickups){
  ctx.save();ctx.translate(p.x,p.y);const special=p.repair||p.weapon,info=weaponInfo[p.weaponKind||'triple'],color=p.weapon?info.color:'#9af1d1';
  ctx.fillStyle=color;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=special?20:12;
  if(special){ctx.globalAlpha=!reduced&&p.life<4?.65+Math.sin(clock*6)*.25:1;circle(0,0,19+(reduced?0:Math.sin(clock*3)*2),color+'88',1.5);ctx.fillStyle='#15302f';ctx.fillRect(-12,-12,24,24);ctx.fillStyle=color;
    if(p.repair){ctx.fillRect(-8,-2.5,16,5);ctx.fillRect(-2.5,-8,5,16);}else{ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(info.icon,0,5);}
    ctx.shadowBlur=0;ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText(p.weapon?info.name:'HEALTH +1',0,34);
  }else{ctx.rotate(Math.PI/4+(reduced?0:clock));ctx.fillRect(-4,-4,8,8);}ctx.restore();
}
for(const b of g.bullets){const color=b.boosted?weaponInfo[b.kind||'triple'].color:'#b2f9dc';if(b.kind==='seeker'&&b.homing)missileCraft(b.x,b.y,Math.atan2(b.vy,b.vx),color);else{ctx.lineCap='round';line(b.x-b.vx*(b.kind==='pulse'?.04:.018),b.y-b.vy*(b.kind==='pulse'?.04:.018),b.x,b.y,color,b.kind==='pulse'?6:b.boosted?3:2.5);ctx.lineCap='butt';}}
for(const b of g.playerMissiles)missileCraft(b.x,b.y,Math.atan2(b.vy,b.vx),'#dec594');
for(const b of g.enemyBullets){if(b.kind==='missile'||b.kind==='rocket')missileCraft(b.x,b.y,Math.atan2(b.vy,b.vx),b.kind==='rocket'?'#ed957a':'#edb19a',b.kind==='rocket');else{const color=b.boss?'#ffac9c':'#ffba82';ctx.lineCap='round';line(b.x-b.vx*.035,b.y-b.vy*.035,b.x,b.y,color,b.boss?4:3);ctx.lineCap='butt';ctx.fillStyle='#fff0c5';ctx.shadowColor=color;ctx.shadowBlur=7;ctx.beginPath();ctx.arc(b.x,b.y,2.3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
for(const e of g.enemies){
 const boss=e.kind==='boss',sentry=e.kind==='sentry',interceptor=e.kind==='interceptor';const color=e.hitFlash>0?'#f7fff8':boss?'#e8bf8b':sentry?'#c5a2e6':interceptor?'#f2a5a8':e.heavy?'#dec594':'#e99a87';
 if(e.fireIn<.48){circle(e.x,e.y,e.r+14,color+'99',2);if(sentry)line(e.x,e.y,g.player.x,g.player.y,'#c5a2e64d',1);}
 if(boss){if(e.age<1.5){ctx.globalAlpha=.25+e.age*.4;circle(e.x,e.y,e.r+22,color+'88',1);ctx.globalAlpha=1;}drawBoss(e,color);}else enemyCraft(e,color,{sentry,interceptor,heavy:e.heavy});
}
for(const d of g.decoys){const fade=Math.min(1,d.life/.32),pulse=.34+.08*Math.sin(clock*18);ctx.save();ctx.globalCompositeOperation='screen';ship(d.x,d.y,flightHeading,.84,pulse*fade);ctx.globalAlpha=fade*.62;circle(d.x,d.y,25,'#83f0da',1.2);ctx.setLineDash([2,4]);circle(d.x,d.y,31,'#83f0da',.7);ctx.setLineDash([]);ctx.fillStyle='#9af1d1';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('DECOY SIGNAL',d.x,d.y-39);ctx.restore();}
const blink=g.invulnerable>0&&Math.sin(clock*35)>0;ship(g.player.x,g.player.y,flightHeading,1,blink?.35:1,g.roll);if(g.invulnerable>0)circle(g.player.x,g.player.y,23,'#9af1d155',1);if(g.dashTime>0){circle(g.player.x,g.player.y,25,'#9af1d18c',2);if(!reduced)burst(g.player.x,g.player.y,'#9af1d1',2);}}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(g.mode==='playing'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size||2,p.size||2);}ctx.globalAlpha=1;
for(let i=rings.length-1;i>=0;i--){const r=rings[i];if(g.mode==='playing')r.life-=dt;if(r.life<=0){rings.splice(i,1);continue;}ctx.globalAlpha=r.life/r.max*.65;circle(r.x,r.y,reduced?r.size*.4:8+(1-r.life/r.max)*r.size,r.color,reduced?1:2*r.life/r.max); }ctx.globalAlpha=1;for(let i=floats.length-1;i>=0;i--){const f=floats[i];if(g.mode==='playing'){f.life-=dt;if(!reduced)f.y-=22*dt;}if(f.life<=0){floats.splice(i,1);continue;}ctx.globalAlpha=f.life/f.max;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;ctx.restore();
if(flash>0&&!reduced){ctx.fillStyle=`rgba(233,121,116,${flash*.5})`;ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);flash=Math.max(0,flash-dt);}}
function hud(){
 $('levelLabel').textContent=`LVL ${String(g.level).padStart(2,'0')}`;$('xpFill').style.width=`${Math.min(100,g.xp/g.xpNeeded*100)}%`;$('xpLabel').textContent=`${g.xp} / ${g.xpNeeded}`;$('xpMeter').setAttribute('aria-valuemax',g.xpNeeded);$('xpMeter').setAttribute('aria-valuenow',g.xp);
 const info=weaponInfo[g.weaponKind];$('weaponStatus').innerHTML=g.weaponTime>0?`${info.name} <span>${Math.ceil(g.weaponTime)}s</span>`:'AUTO-FIRE <span>ON</span>';$('weaponStatus').classList.toggle('boosted',g.weaponTime>0);$('weaponStatus').style.color=g.weaponTime>0?info.color:'';$('weaponReadout').hidden=g.weaponTime<=0;$('weaponReadout').textContent=`${info.name} / ${Math.ceil(g.weaponTime)}s`;$('weaponReadout').style.color=info.color;
 const countdown=g.bossCountdown>0&&!g.enemies.some(enemy=>enemy.kind==='boss');$('routeStage').textContent=countdown?`GUARDIAN T−${String(g.bossCountdown).padStart(2,'0')}`:`STAGE ${String(g.stage).padStart(2,'0')}`;$('routeStage').classList.toggle('boss-countdown',countdown);$('destinationLabel').textContent=g.destination.name;$('routeProgress').style.color=g.destination.color;$('destinationLabel').style.color=g.destination.color;$('routeFill').style.width=`${Math.min(100,g.stageTime/g.stageDuration*100)}%`;$('routeProgress').setAttribute('aria-valuemax',g.stageDuration);$('routeProgress').setAttribute('aria-valuenow',Math.min(g.stageDuration,g.stageTime));
 const boss=g.enemies.find(e=>e.kind==='boss');$('bossHud').hidden=!boss||g.mode!=='playing';if(boss){$('bossName').textContent=boss.destination?.boss||g.destination.boss;$('bossFill').style.width=`${Math.max(0,boss.hp/boss.maxHp)*100}%`;$('bossHealth').setAttribute('aria-valuemax',boss.maxHp);$('bossHealth').setAttribute('aria-valuenow',Math.max(0,boss.hp));$('bossPhase').textContent=boss.age<1.5?'ARRIVING / KEEP CLEAR':boss.fireIn<.75?'VOLLEY INCOMING':boss.hp<boss.maxHp/2?'PHASE II / ENRAGED':'ORBITAL GUARDIAN';}
 const missileThreat=g.mode==='playing'?C.incomingMissileThreat(g):null,warning=$('threatWarning');warning.hidden=!missileThreat;if(missileThreat){$('threatArrow').textContent=missileThreat.direction;warning.classList.toggle('urgent',missileThreat.timeToImpact<.55);}
 $('score').textContent=format(g.score);$('wave').textContent=String(g.stage).padStart(2,'0');$('timer').textContent=`T+ ${time(g.time)}`;if($('hull').children.length!==g.maxHp)$('hull').innerHTML='<i></i>'.repeat(g.maxHp);Array.from($('hull').children).forEach((e,i)=>e.classList.toggle('lost',i>=g.hp));$('hull').setAttribute('aria-label',`${g.hp} hull points`);$('hullReadout').textContent='▰'.repeat(g.hp)+'▱'.repeat(g.maxHp-g.hp);$('hullReadout').setAttribute('aria-label',`${g.hp} hull points`);$('dashFill').style.width=`${(1-g.dashCooldown/g.dashMaxCooldown)*100}%`;$('dashLabel').textContent=g.dashCooldown>0?`RECHARGING / ${g.dashCooldown.toFixed(1)}s`:'DASH + DECOY READY';$('touchDash').disabled=g.dashCooldown>0;$('combo').textContent=g.combo>1&&g.mode==='playing'?`${g.combo}× ENERGY STREAK`:'';$('announcement').classList.toggle('show',clock<announcementUntil&&g.mode==='playing');
}
function frame(t){
  const dt=Math.min((t-last)/1000||0,.15);last=t;
  if(!document.hidden){
    if(g.mode!=='paused')clock+=dt;
    let stepped=false;
    if(hitStop>0)hitStop=Math.max(0,hitStop-dt);else if(g.mode==='playing'){C.advance(g,dt,input());stepped=true;}
    if(stepped)events();crew.update(g.mode,dt);
    if(previousMode!==g.mode)syncMenu();previousMode=g.mode;
    if(g.mode==='playing'){
      shake*=Math.exp(-dt*16);
      if(!reduced&&Math.hypot(input().x,input().y)>.05){const a=g.heading+Math.PI;particles.push({x:g.player.x+Math.cos(a)*11,y:g.player.y+Math.sin(a)*11,vx:Math.cos(a)*45+(Math.random()-.5)*20,vy:Math.sin(a)*45+(Math.random()-.5)*20,life:.28,max:.35,color:g.weaponTime>0?weaponInfo[g.weaponKind].color:'#9af1d1',size:2});}
    }
    const steering=input(),wanted=g.mode==='playing'?Math.max(.45,Math.min(1,Math.hypot(steering.x,Math.min(0,steering.y)))):0;enginePower+=(wanted-enginePower)*(1-Math.exp(-dt*7));const turn=Math.atan2(Math.sin(g.heading-flightHeading),Math.cos(g.heading-flightHeading));flightHeading+=turn*(1-Math.exp(-dt*15));soundEngine.update(g.mode,g.enemies.some(e=>e.kind==='boss'));draw(dt);hud();
  }
  requestAnimationFrame(frame);
}
 $('startButton').addEventListener('click',launch);$('pauseButton').addEventListener('click',pause);$('arenaPauseButton').addEventListener('click',pause);$('soundButton').addEventListener('click',setSound);$('voicesButton').addEventListener('click',setVoices);
function openHelp(){if(g.mode==='playing')pause();$('helpDialog').showModal();}
$('helpButton').addEventListener('click',openHelp);$('closeHelp').addEventListener('click',()=>$('helpDialog').close());$('helpDone').addEventListener('click',()=>$('helpDialog').close());
function syncFullscreenButton(){const active=!!document.fullscreenElement;$('fullscreenButton').innerHTML=active?'Exit <span>⛶</span>':'Expand <span>⛶</span>';$('fullscreenButton').setAttribute('aria-pressed',String(active));}
$('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement){if($('arena').requestFullscreen){await $('arena').requestFullscreen();if(mobileEdition&&screen.orientation?.lock)await screen.orientation.lock('portrait').catch(()=>{});}else if(mobileEdition){$('installNote').textContent='For full-screen play, add NEON ORBIT to your Home Screen from the browser Share menu.';$('installNote').hidden=false;}else{$('announcement').textContent='FULL SCREEN IS NOT AVAILABLE HERE';announcementUntil=clock+3;}}else await document.exitFullscreen();}catch(error){console.warn('Full screen could not be opened:',error);if(mobileEdition){$('installNote').textContent='For full-screen play, add NEON ORBIT to your Home Screen from the browser Share menu.';$('installNote').hidden=false;}else{$('announcement').textContent='FULL SCREEN IS NOT AVAILABLE HERE';announcementUntil=clock+3;}}});
$('exitFullscreenButton').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();});
document.addEventListener('fullscreenchange',syncFullscreenButton);
document.addEventListener('keydown',e=>{if($('helpDialog').open)return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat){keys.add(k);return;}if(k==='enter'&&g.mode!=='playing'){e.preventDefault();launch();}else if(k==='p'||k==='escape')pause();else if(k==='m')setSound();else if(k===' ')performDash();keys.add(k);});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function loseFocus(){keys.clear();resetTouch();if(g.mode==='playing')pause();}
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
const joy=$('joystick');joy.addEventListener('pointerdown',e=>{if(stickId!==null)return;e.preventDefault();stickId=e.pointerId;joy.setPointerCapture(e.pointerId);moveStick(e);});
function moveStick(e){if(e.pointerId!==stickId)return;const r=joy.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const d=Math.hypot(x,y),m=Math.min(d,30);if(d>0){x=x/d*m;y=y/d*m;}touch={x:x/30,y:y/30};$('stick').style.transform=`translate(${x}px,${y}px)`;}
joy.addEventListener('pointermove',moveStick);joy.addEventListener('pointerup',resetTouch);joy.addEventListener('pointercancel',resetTouch);joy.addEventListener('lostpointercapture',resetTouch);$('touchDash').addEventListener('pointerdown',e=>{e.preventDefault();performDash();});
syncSound();syncMenu();
requestAnimationFrame(frame);
})();
