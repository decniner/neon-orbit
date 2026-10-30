/* Deterministic simulation shared by the browser and Node tests. */
(function(root) {
  'use strict';
  let WIDTH = 1000;
  const HEIGHT = 650;
  let CORRIDOR = {left:75, right:925};
  const WEAPONS = ['triple', 'pulse', 'seeker', 'nova'];
  const DESTINATIONS = [
    {name:'LUNAR RELAY',boss:'AEGIS WARDEN',color:'#9af1d1'},
    {name:'ASHEN NEBULA',boss:'CINDER MATRIARCH',color:'#efae86'},
    {name:'VOID CITADEL',boss:'NIGHT SENTINEL',color:'#c6a4ff'}
  ];
  const BOSS_ATTACKS = [
    {name:'AEGIS WARDEN',telegraph:'LANCE RING INCOMING'},
    {name:'CINDER MATRIARCH',telegraph:'FLAME FAN INCOMING'},
    {name:'NIGHT SENTINEL',telegraph:'SEEKER PAIR INCOMING'}
  ];
  const DOCTRINES = [
    {id:'vanguard',name:'VANGUARD',icon:'✳',cost:0,description:'Balanced flight systems.'},
    {id:'aegis',name:'AEGIS',icon:'◉',cost:25,description:'Start with a recharging shield.'},
    {id:'cinder',name:'CINDER',icon:'✧',cost:35,description:'Start with +1 weapon damage.'},
    {id:'sentinel',name:'SENTINEL',icon:'⌁',cost:35,description:'Start with an extra seeker.'}
  ];
  const UPGRADES = {
    damage: {name:'Hot core',icon:'✧',tag:'OFFENSE',description:'+1 damage to every projectile.',cap:3},
    haste: {name:'Quick trigger',icon:'»',tag:'FIREPOWER',description:'Fire 15% faster. Every weapon.',cap:3},
    hull: {name:'Reinforced hull',icon:'+',tag:'SURVIVAL',description:'+1 maximum hull. Repair one point.',cap:3},
    magnet: {name:'Salvage field',icon:'◎',tag:'COLLECTION',description:'Pull in energy from 40 units farther.',cap:3},
    dash: {name:'Afterburner',icon:'↗',tag:'MOBILITY',description:'Recharge your dash 18% faster.',cap:3},
    repair: {name:'Second wind',icon:'↻',tag:'RECOVERY',description:'Fully repair your hull. +500 points.',cap:Infinity}
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function incomingMissileThreat(g, range = 240, warningTime = 1.25) {
    let threat = null;
    for (const missile of g.enemyBullets) {
      if ((missile.kind !== 'missile' && missile.kind !== 'rocket') || missile.life <= 0) continue;
      const dx = missile.x - g.player.x, dy = missile.y - g.player.y;
      const d = Math.hypot(dx, dy);
      if (d > range || d === 0) continue;
      const relativeVx = missile.vx - g.player.vx, relativeVy = missile.vy - g.player.vy;
      const closingSpeed = -(dx * relativeVx + dy * relativeVy) / d;
      if (closingSpeed < 60) continue;
      const timeToImpact = Math.max(0, (d - g.player.r - missile.r - 10) / closingSpeed);
      if (timeToImpact > warningTime || (threat && timeToImpact >= threat.timeToImpact)) continue;
      const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      const directions = ['→','↘','↓','↙','←','↖','↑','↗'];
      threat = {direction:directions[Math.round(angle / (Math.PI / 4)) % directions.length], distance:d, timeToImpact, kind:missile.kind};
    }
    return threat;
  }

  function configureViewport(width, height, mobile = false) {
    if (!mobile || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      WIDTH = 1000;
      CORRIDOR = {left:75, right:925};
      return;
    }
    WIDTH = HEIGHT * width / height;
    CORRIDOR = {left:WIDTH * .075, right:WIDTH * .925};
  }

  function createGame(random = Math.random) {
    return {
      random, mode: 'ready', player: {x: WIDTH / 2, y: HEIGHT / 2, r: 12, vx: 0, vy: 0}, cameraY: HEIGHT / 2,
      enemies: [], bullets: [], enemyBullets: [], pickups: [], decoys: [], events: [],
      score: 0, hp: 3, maxHp: 3, level: 1, xp: 0, xpNeeded: 8, choices: [], upgrades: {}, damageBonus: 0, fireRate: 1, magnetRange: 115, dashMaxCooldown: 3, peakCombo: 0, bossesDefeated: 0, guardianCores:{aegis:0,cinder:0,sentinel:0}, aegisShield:false, aegisRecharge:0, damageTaken: 0, wave: 1, stage: 1, stageTime: 0, stageDuration: 42, forwardSpeed: 95, destination: DESTINATIONS[0], time: 0, sectorDelay: 0, bossSpawnedStage: 0, bossCountdown: 0,
      kills: 0, combo: 0, comboUntil: 0, novaCharge: 0, dashCooldown: 0, dashTime: 0,
      invulnerable: 0, spawnIn: 1, fireIn: 0, weaponTime: 0,
      weaponKind: 'triple', supplyIn: 6, supplies: 0,
      heading: -Math.PI / 2, roll: 0, rollTime: 0, rollDirection: 1, rollHeld: false,
      gunAngle: -Math.PI / 2, gunSide: 1, gunFlash: 0, dashDirection: {x: 0, y: -1},
      playerMissiles: [], missileIn: 0
    };
  }
  function destinationFor(stage) { return DESTINATIONS[(Math.max(1, Math.floor(stage)) - 1) % DESTINATIONS.length]; }
  function start(g, doctrine = 'vanguard') {
    const random = g.random; Object.assign(g, createGame(random)); g.mode = 'playing'; g.invulnerable = 6; g.spawnIn = 2.5; g.supplyIn = 4;
    const selected=DOCTRINES.some(item=>item.id===doctrine)?doctrine:'vanguard';
    if(selected==='aegis'){g.guardianCores.aegis=1;g.aegisShield=true;}
    if(selected==='cinder'){g.guardianCores.cinder=1;g.damageBonus=1;}
    if(selected==='sentinel')g.guardianCores.sentinel=1;
  }
  function salvageForRun(g) { return Math.min(99,18+Math.floor(g.kills/2)+g.bossesDefeated*12); }
  function togglePause(g) {
    if (g.mode === 'playing') g.mode = 'paused';
    else if (g.mode === 'paused') g.mode = 'playing';
  }
  function dash(g, d = {}) {
    if (g.mode !== 'playing' || g.dashCooldown > 0) return false;
    const dy = d.y || 0, n = Math.hypot(d.x || 0, dy);
    g.dashDirection = n ? {x: (d.x || 0) / n, y: dy / n} : {x: Math.cos(g.heading), y: Math.sin(g.heading)};
    g.dashTime = .23; g.dashCooldown = g.dashMaxCooldown;
    g.decoys = [{x:g.player.x,y:g.player.y,r:18,hp:3,life:2.4,maxLife:2.4}];
    g.events.push({type: 'dash', x: g.player.x, y: g.player.y});
    return true;
  }
  function activeDecoy(g) { return g.decoys.find(d => d.life > 0 && d.hp > 0); }
  function hitDecoy(g, d) {
    d.hp--; g.events.push({type:'decoyHit',x:d.x,y:d.y,hp:d.hp});
    if(d.hp<=0)d.life=0;
  }
  function offerUpgrade(g) {
    const ids = Object.keys(UPGRADES), eligible = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[(i + (g.level - 1) * 3) % ids.length];
      if ((g.upgrades[id] || 0) < UPGRADES[id].cap) eligible.push(id);
    }
    g.choices = eligible.slice(0, 3); g.mode = 'upgrade'; g.xp -= g.xpNeeded;
    g.events.push({type:'levelUp', level:g.level + 1});
    const score = id => {
      const stacks = g.upgrades[id] || 0;
      if (id === 'repair') return g.hp < g.maxHp ? 105 + (g.maxHp - g.hp) * 12 : 5;
      if (id === 'hull') return g.hp < g.maxHp ? 92 + (g.maxHp - g.hp) * 8 : 38;
      if (id === 'damage') return 82 - stacks * 9;
      if (id === 'haste') return 78 - stacks * 9;
      if (id === 'dash') return 52 - stacks * 7;
      return 42 - stacks * 7;
    };
    const best = g.choices.reduce((winner, id) => score(id) > score(winner) ? id : winner, g.choices[0]);
    if (best) chooseUpgrade(g, best);
  }
  function chooseUpgrade(g, id) {
    if (g.mode !== 'upgrade' || !g.choices.includes(id) || !UPGRADES[id] || (g.upgrades[id] || 0) >= UPGRADES[id].cap) return false;
    g.upgrades[id] = (g.upgrades[id] || 0) + 1;
    if (id === 'damage') g.damageBonus++;
    if (id === 'haste') g.fireRate *= .85;
    if (id === 'hull') { g.maxHp++; g.hp = Math.min(g.maxHp, g.hp + 1); }
    if (id === 'magnet') g.magnetRange += 40;
    if (id === 'dash') g.dashMaxCooldown *= .82;
    if (id === 'repair') { g.hp = g.maxHp; g.score += 500; }
    g.level++; g.xpNeeded = 8 + (g.level - 1) * 4;
    g.invulnerable = Math.max(g.invulnerable, 1.2); g.choices = []; g.mode = 'playing';
    g.events.push({type:'upgrade', id});
    return true;
  }
  function spawn(g) {
    if (g.enemies.length >= 80) return;
    const x = clamp(g.player.x + (g.random() - .5) * WIDTH, CORRIDOR.left, CORRIDOR.right);
    const y = g.player.y - HEIGHT * .57;
    const roll = g.random();
    const kind = g.wave >= 3 && roll >= .43 && roll < .61 ? 'heavy'
      : g.wave >= 3 && roll >= .25 && roll < .43 ? 'sentry'
      : g.wave >= 2 && roll < .25 ? 'interceptor' : 'chaser';
    const heavy = kind === 'heavy';
    const hp = ({chaser:4, interceptor:6, sentry:8, heavy:14})[kind] + Math.floor((g.wave - 1) / 4);
    g.enemies.push({x, y, kind, heavy, age: 0, fireIn: .85, maxHp: hp,
      r: heavy ? 21 : kind === 'sentry' ? 17 : 14,
      hp,
      speed: (heavy ? 45 : kind === 'interceptor' ? 125 : 65) + Math.min(g.wave, 25) * 3});
  }
  function spawnBoss(g) {
    g.bossCountdown = 0;
    const hp = 38 + g.stage * 4;
    g.enemies.push({x: g.player.x, y: g.player.y - 420, r: 44, hp, maxHp: hp, kind: 'boss', stage:g.stage, destination:g.destination, speed: 35, fireIn: 2.8, age: 0});
    g.bossSpawnedStage = g.stage;
    g.events.push({type: 'boss', wave: g.stage, stage:g.stage, destination:g.destination});
  }
  function supply(g) {
    let x = g.supplies === 0 ? g.player.x : clamp(g.player.x + (g.random() - .5) * WIDTH * .8, CORRIDOR.left, CORRIDOR.right);
    let y = g.supplies === 0 ? g.player.y - 90 : g.player.y - (100 + g.random() * 350);
    if (g.supplies > 0 && Math.hypot(x - g.player.x, y - g.player.y) < 160) { x = g.player.x < 0 ? g.player.x + WIDTH * .3 : g.player.x - WIDTH * .3; y = g.player.y - 220; }
    const weapon = g.supplies % 2 === 0;
    const weaponKind = WEAPONS[Math.floor(g.supplies / 2) % WEAPONS.length];
    g.pickups.push({x, y, r: 14, life: 22, weapon, repair: !weapon, weaponKind});
    g.supplies++; g.supplyIn = 12;
    g.events.push({type: 'supply', weapon, weaponKind});
  }
  function nearest(g, point) {
    let target;
    for (const e of g.enemies) if (e.hp > 0 && (!target || distance(e, point) < distance(target, point))) target = e;
    return target;
  }
  function nearestAhead(g, point) {
    let target;
    for (const e of g.enemies) if (e.hp > 0 && e.y < point.y && (!target || distance(e, point) < distance(target, point))) target = e;
    return target;
  }
  function fire(g) {
    const target = nearestAhead(g, g.player);
    if (!target) return;
    if (g.missileIn <= 0) {
      const angle = Math.atan2(target.y - g.player.y, target.x - g.player.x);
      const salvo = 2 + Math.min(2,g.guardianCores?.sentinel||0);
      for (let i=0;i<salvo;i++) {
        const offset=i-(salvo-1)/2,spacing=36/(salvo-1);
        const a = angle + offset * .035;
        g.playerMissiles.push({x:g.player.x + offset * spacing, y:g.player.y + 4,
          vx:Math.cos(a)*430, vy:Math.sin(a)*430, r:5, life:3.2,
          kind:'missile', homing:true, turnRate:4.6, damage:2+g.damageBonus, trailIn:0});
      }
      g.missileIn = 1.8;
      g.events.push({type:'playerMissileSalvo',x:g.player.x,y:g.player.y});
    }
    const a = -Math.PI / 2;
    const overdrive = g.novaCharge >= 1;
    const kind = overdrive ? 'nova' : g.weaponTime > 0 ? g.weaponKind : 'standard';
    const weaponLanes = kind === 'triple' ? [-.2, 0, .2] : kind === 'seeker' ? [-.1, .1] : kind === 'nova' ? [-.12,.12] : [0];
    const damageStacks = g.upgrades.damage || 0;
    const upgradeLanes = damageStacks === 1 ? [-.16, 0, .16] : damageStacks === 2 ? [-.25, -.08, .08, .25] : damageStacks >= 3 ? [-.28, -.16, 0, .16, .28] : [0];
    const offsets = [...new Set([...weaponLanes, ...upgradeLanes])];
    const speed = kind === 'pulse' ? 850 : kind === 'seeker' ? 440 : kind === 'nova' ? 510 : 660;
    g.gunAngle = a; g.gunFlash = .09; g.gunSide *= -1;
    const side = g.gunSide,body=0;
    for (const offset of offsets) g.bullets.push({x: g.player.x + Math.cos(body)*side*11 - Math.sin(body)*-8 + Math.cos(a)*9, y: g.player.y + Math.sin(body)*side*11 + Math.cos(body)*-8 + Math.sin(a)*9,
      vx: Math.cos(a + offset) * speed, vy: Math.sin(a + offset) * speed,
      life: kind === 'seeker' ? 2.2 : 1.6, r: kind === 'pulse' ? 7 : kind === 'nova' ? (overdrive ? 12 : 9) : 4,
      boosted: kind !== 'standard', kind, overdrive, damage: (kind === 'pulse' ? 3 : kind === 'seeker' ? 2 : kind === 'nova' ? (overdrive ? 5 : 3) : 1) + g.damageBonus,
      pierce: kind === 'pulse' ? 2 : 1, homing: kind === 'seeker', trailIn: .02, hitEnemies: new Set()});
    g.fireIn = (kind === 'triple' ? .16 : kind === 'pulse' ? .38 : kind === 'seeker' ? .42 : kind === 'nova' ? .48 : .28) * g.fireRate;
    if(overdrive){g.novaCharge=0;g.combo=0;}
    g.events.push({type: 'fire', weaponKind: kind, overdrive, x:g.player.x, y:g.player.y, angle:a, side});
    if(overdrive)g.events.push({type:'novaOverdrive',x:g.player.x,y:g.player.y});
  }
  function hostileShot(g, e, angle, speed = 300) {
    if (g.enemyBullets.length >= 300) return;
    g.enemyBullets.push({x: e.x + Math.cos(angle) * (e.r + 7), y: e.y + Math.sin(angle) * (e.r + 7),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, r: 5, life: 5, kind:'gun', damage:1, boss: e.kind === 'boss'});
    g.events.push({type:'enemyFire',kind:'gun',x:e.x,y:e.y,angle});
  }
  function hostileMissile(g,e,angle,kind='missile') {
    if (g.enemyBullets.length >= 300) return;
    const speed=kind==='rocket'?180:210;
    g.enemyBullets.push({x:e.x+Math.cos(angle)*(e.r+9),y:e.y+Math.sin(angle)*(e.r+9),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,r:kind==='rocket'?8:6,life:6,kind,turnRate:kind==='rocket'?1.7:2.8,damage:kind==='rocket'?2:1,trailIn:0});
    g.events.push({type:'enemyFire',kind,x:e.x,y:e.y,angle});
  }
  function detonate(g,b,x,y,source) {
    if (b.exploded) return;
    b.exploded=true;b.life=0;
    const radius=source==='player'?(b.kind==='nova'?(b.overdrive?132:88):54):b.kind==='rocket'?72:48;
    for(const target of g.enemies){if(target.hp<=0)continue;const d=Math.hypot(target.x-x,target.y-y);if(d>radius)continue;
      const damage=Math.max(1,Math.ceil((b.damage||1)*(1-d/radius)));
      target.hp-=damage;target.hitFlash=.12;g.events.push({type:'impact',x:target.x,y:target.y,damage});if(target.hp<=0)defeat(g,target);
    }
    g.events.push({type:'explosion',x,y,source,kind:b.kind,radius,overdrive:!!b.overdrive});
  }
  function guide(b,target,dt) {
    const angle=Math.atan2(target.y-b.y,target.x-b.x),old=Math.atan2(b.vy,b.vx);
    const turn=clamp(Math.atan2(Math.sin(angle-old),Math.cos(angle-old)),-dt*(b.turnRate||5),dt*(b.turnRate||5));
    const speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(old+turn)*speed;b.vy=Math.sin(old+turn)*speed;b.angle=old+turn;
  }
  function moveEnemy(g, e, dt) {
    e.age = (e.age || 0) + dt; e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
    const a = Math.atan2(g.player.y - e.y, g.player.x - e.x);
    const lure = activeDecoy(g) || g.player;
    const fireAngle = Math.atan2(lure.y - e.y, lure.x - e.x);
    if (e.kind === 'boss') {
      e.x += (g.player.x + Math.sin(e.age * .55) * WIDTH * .215 - e.x) * dt * .7;
      e.y += (g.player.y - 250 + Math.sin(e.age * .8) * 45 - e.y) * dt * .7;
    } else if (e.kind === 'sentry') {
      const d = distance(e, g.player), direction = d > 330 ? 1 : d < 220 ? -1 : 0;
      e.x += (Math.cos(a) * direction + Math.sin(a) * .35) * e.speed * dt;
      e.y += (Math.sin(a) * direction - Math.cos(a) * .35) * e.speed * dt;
    } else {
      const angle = a + (e.kind === 'interceptor' ? Math.sin(e.age * 3) * .55 : 0);
      e.x += Math.cos(angle) * e.speed * dt; e.y += Math.sin(angle) * e.speed * dt;
    }
    if (e.y - e.r > g.cameraY + (HEIGHT - 520)) {
      e.fireIn = Math.max(.45, (e.fireIn ?? 2.6) - dt);
    } else {
      e.fireIn = (e.fireIn ?? 2.6) - dt;
      if (e.fireIn <= 0) {
        if (e.kind === 'boss') {
          const phaseTwo = e.hp < e.maxHp / 2;
          const attack = (Math.max(1, Math.floor(e.stage || g.stage)) - 1) % BOSS_ATTACKS.length;
          if (attack === 0) {
            const count = phaseTwo ? 20 : 14;
            for (let i = 0; i < count; i++) hostileShot(g, e, i * Math.PI * 2 / count + e.age * (phaseTwo ? .42 : .25), phaseTwo ? 205 : 175);
          } else if (attack === 1) {
            const count = phaseTwo ? 11 : 7;
            const spread = phaseTwo ? .72 : .48;
            for (let i = 0; i < count; i++) hostileShot(g, e, fireAngle - spread / 2 + spread * i / (count - 1), phaseTwo ? 235 : 195);
          } else {
            hostileMissile(g, e, fireAngle - .12, 'missile');
            hostileMissile(g, e, fireAngle + .12, 'missile');
            if (phaseTwo) {
              hostileMissile(g, e, fireAngle, 'missile');
              for (let i = 0; i < 8; i++) hostileShot(g, e, i * Math.PI / 4 + e.age * .3, 185);
            }
          }
          e.fireIn = phaseTwo ? 1.7 : 2.5;
        } else if(e.kind==='interceptor') {hostileMissile(g,e,fireAngle,'missile');e.fireIn=2.8;}
        else if(e.kind==='sentry') {hostileMissile(g,e,fireAngle,'missile');e.fireIn=3.1;}
        else if(e.kind==='heavy') {hostileMissile(g,e,fireAngle,'rocket');e.fireIn=2.35;}
        else {for(const spread of [-.045,.045])hostileShot(g,e,fireAngle+spread,320);e.fireIn=1.35;}
      }
    }
  }
  function defeat(g, e) {
    g.kills++; g.pickups.push({x: e.x, y: e.y, r: 6, life: 14});
    g.events.push({type: 'kill', x: e.x, y: e.y});
    if (e.kind === 'boss') {
      const defeatedStage=e.stage||g.stage,bonus = 1000 + defeatedStage * 100; g.score += bonus; g.bossesDefeated++; g.xp += 4;
      const coreId=['aegis','cinder','sentinel'][(defeatedStage-1)%3];
      g.guardianCores[coreId]++;
      if(coreId==='aegis')g.aegisShield=true;
      if(coreId==='cinder')g.damageBonus++;
      g.enemyBullets.length = 0;
      g.pickups.push({x: e.x - 25, y: e.y, r: 14, life: 30, repair: true},
        {x: e.x + 25, y: e.y, r: 14, life: 30, weapon: true, weaponKind: WEAPONS[(defeatedStage - 1) % WEAPONS.length]});
      g.stage++; g.wave = g.stage; g.stageTime = 0; g.bossSpawnedStage = 0; g.bossCountdown = 0; g.destination = destinationFor(g.stage); g.spawnIn = 1.25;
      g.events.push({type: 'bossDefeated', bonus, x: e.x, y: e.y, stage:defeatedStage});
      g.events.push({type:'stageComplete',stage:g.stage,destination:g.destination});
      g.events.push({type:'coreAcquired',id:coreId,level:g.guardianCores[coreId],x:e.x,y:e.y});
    } else if (g.kills % 8 === 0) g.pickups.push({x: e.x + 12, y: e.y, r: 14, life: 22, repair: true});
  }
  function hit(g) {
    if(g.aegisShield){g.aegisShield=false;g.aegisRecharge=Math.max(9,24-(g.guardianCores.aegis-1)*3);g.invulnerable=1.5;g.events.push({type:'shieldHit',x:g.player.x,y:g.player.y,recharge:g.aegisRecharge});return;}
    g.hp--; g.damageTaken++; g.invulnerable = 1.5;
    g.events.push({type: 'hit', x: g.player.x, y: g.player.y});
    if (g.hp <= 0) { g.mode = 'over'; g.events.push({type: 'over'}); }
  }
  function step(g, delta, input = {}) {
    if (g.mode !== 'playing') return;
    const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .05);
    g.events = []; g.time += dt;
    if(g.aegisRecharge>0){g.aegisRecharge=Math.max(0,g.aegisRecharge-dt);if(g.aegisRecharge===0&&g.guardianCores.aegis){g.aegisShield=true;g.events.push({type:'shieldReady',x:g.player.x,y:g.player.y});}}
    for(const d of g.decoys)d.life-=dt;
    g.decoys=g.decoys.filter(d=>d.life>0&&d.hp>0);
    const bossActive = g.enemies.some(e => e.kind === 'boss' && e.hp > 0);
    if (!bossActive) g.stageTime += dt;
    if (!bossActive && g.stageTime < g.stageDuration) {
      const seconds = Math.ceil(g.stageDuration - g.stageTime);
      if (seconds <= 5 && seconds > 0 && seconds !== g.bossCountdown) {
        g.bossCountdown = seconds;
        g.events.push({type:'bossCountdown',seconds,stage:g.stage,destination:g.destination});
      }
    }
    if (!bossActive && g.stageTime >= g.stageDuration && g.bossSpawnedStage !== g.stage) spawnBoss(g);
    g.weaponTime = Math.max(0, g.weaponTime - dt);g.gunFlash=Math.max(0,g.gunFlash-dt);
    g.supplyIn -= dt; if (g.supplyIn <= 0) supply(g);
    g.dashCooldown = Math.max(0, g.dashCooldown - dt); g.invulnerable = Math.max(0, g.invulnerable - dt);
    if (g.time > g.comboUntil) { g.combo = 0; g.novaCharge = 0; }
    let x = input.x || 0, y = input.y || 0, n = Math.hypot(x, y);
    if (n > 1) { x /= n; y /= n; }
    g.heading = -Math.PI / 2;
    const dashing = g.dashTime > 0;
    if (dashing) { x = g.dashDirection.x; y = g.dashDirection.y; }
    const steering = Math.abs(x) > .001;
    if (steering && !g.rollHeld) { g.rollTime = .42; g.rollDirection = Math.sign(x); }
    g.rollHeld = steering;
    if (g.rollTime > 0) {
      const progress = 1 - g.rollTime / .42, eased = progress * progress * (3 - 2 * progress);
      g.roll = g.rollDirection * Math.PI * 2 * eased;
      g.rollTime = Math.max(0, g.rollTime - dt);
      if (g.rollTime === 0) g.roll = 0;
    } else g.roll = 0;
    g.dashTime = Math.max(0, g.dashTime - dt);
    const speed = dashing ? 850 : 240;
    const responseRate=62,decay=Math.exp(-dt*responseRate),targetVx=x*speed,targetVy=y*speed,oldVx=g.player.vx,oldVy=g.player.vy;
    const dx=targetVx*dt+(oldVx-targetVx)*(1-decay)/responseRate,dy=targetVy*dt+(oldVy-targetVy)*(1-decay)/responseRate;
    g.player.vx=targetVx+(oldVx-targetVx)*decay;g.player.vy=targetVy+(oldVy-targetVy)*decay;
    g.player.x = clamp(g.player.x + dx, CORRIDOR.left, CORRIDOR.right);
    g.player.y += dy - g.forwardSpeed * dt;
    g.cameraY -= g.forwardSpeed * dt;
    g.cameraY = clamp(g.cameraY, g.player.y - 50, g.player.y + 360);
    g.spawnIn -= dt;
    if (!bossActive && g.spawnIn <= 0) { spawn(g); g.spawnIn = Math.max(.35, 1.25 - g.wave * .055); }
    g.fireIn -= dt; if (g.fireIn <= 0) fire(g);
    g.missileIn = Math.max(0, g.missileIn - dt);
    for (const b of g.bullets) {
      if (b.homing) {
        const target = nearest(g, b);
        if (target) guide(b,target,dt);
        b.trailIn=(b.trailIn??.02)-dt;if(b.trailIn<=0){b.trailIn=.055;g.events.push({type:'missileTrail',x:b.x,y:b.y,vx:b.vx,vy:b.vy,source:'player'});}
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    }
    for (const b of g.playerMissiles) {
      const target = nearest(g, b);
      if (target) guide(b, target, dt);
      b.trailIn = (b.trailIn ?? 0) - dt;
      if (b.trailIn <= 0) { b.trailIn = .055; g.events.push({type:'missileTrail',x:b.x,y:b.y,vx:b.vx,vy:b.vy,source:'player'}); }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    }
    for (const e of g.enemies) {
      moveEnemy(g, e, dt);
      for (const b of g.bullets) {
        if (b.life <= 0 || e.hp <= 0 || b.hitEnemies?.has(e) || distance(b, e) >= e.r + b.r) continue;
        (b.hitEnemies ||= new Set()).add(e);
        if((b.kind==='seeker'&&b.homing)||b.kind==='nova'){detonate(g,b,b.x,b.y,'player');continue;}
        e.hp -= b.damage || 1; e.hitFlash = .1; g.events.push({type:'impact',x:b.x,y:b.y,damage:b.damage||1}); b.pierce = (b.pierce || 1) - 1;
        if (b.pierce <= 0) b.life = 0;
        if (e.hp <= 0) defeat(g, e);
      }
      for (const b of g.playerMissiles) {
        if (b.life <= 0 || e.hp <= 0 || distance(b, e) >= e.r + b.r) continue;
        detonate(g, b, b.x, b.y, 'player');
      }
      if (e.hp > 0 && !(e.kind === 'boss' && e.age < 1.5) && !dashing && g.invulnerable <= 0 && distance(e, g.player) < e.r + g.player.r) hit(g);
      if (g.mode === 'over') break;
    }
    if (g.mode === 'playing') for (const b of g.enemyBullets) {
      if(b.kind==='missile'||b.kind==='rocket'){
        const lure=activeDecoy(g)||g.player;guide(b,lure,dt);b.trailIn=(b.trailIn??0)-dt;
        if(b.trailIn<=0){b.trailIn=.07;g.events.push({type:'missileTrail',x:b.x,y:b.y,vx:b.vx,vy:b.vy,source:'enemy'});}
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      const lure=activeDecoy(g);
      if(lure&&distance(b,lure)<lure.r+b.r+4){
        if(b.kind==='missile'||b.kind==='rocket')detonate(g,b,b.x,b.y,'enemy');else b.life=0;
        hitDecoy(g,lure);continue;
      }
      const range=b.kind==='rocket'?24:b.kind==='missile'?18:b.r+g.player.r;
      if (b.life > 0 && distance(b, g.player) < range) {
        if(b.kind==='missile'||b.kind==='rocket')detonate(g,b,b.x,b.y,'enemy');else b.life=0;
        if (!dashing && g.invulnerable <= 0 && distance(b,g.player)<b.r+g.player.r+5) hit(g);
        if (g.mode === 'over') break;
      }
    }
    g.bullets = g.bullets.filter(b => b.life > 0); g.playerMissiles = g.playerMissiles.filter(b => b.life > 0); g.enemyBullets = g.enemyBullets.filter(b => b.life > 0);
    g.enemies = g.enemies.filter(e => e.hp > 0);
    if (g.mode === 'over') return;
    for (const p of g.pickups) {
      p.life -= dt; if (p.life <= 0) continue;
      const d = distance(p, g.player);
      if (d < g.magnetRange && d > 1) { p.x += (g.player.x - p.x) / d * 300 * dt; p.y += (g.player.y - p.y) / d * 300 * dt; }
      if (distance(p, g.player) < 22) {
        p.life = 0; const beforeHp = g.hp;
        if (p.repair) g.hp = Math.min(g.maxHp, g.hp + 1);
        else if (p.weapon) { g.weaponTime = 12; g.weaponKind = WEAPONS.includes(p.weaponKind) ? p.weaponKind : 'triple'; g.fireIn = 0; }
        else { const wasReady=g.novaCharge>=1; g.combo = Math.min(8, g.combo + 1); g.comboUntil = g.time + 3; g.score += 100 * g.combo; g.xp++; g.peakCombo = Math.max(g.peakCombo,g.combo); g.novaCharge=Math.min(1,g.novaCharge+.25); if(!wasReady&&g.novaCharge>=1)g.events.push({type:'novaReady',x:g.player.x,y:g.player.y}); }
        g.events.push({type: 'pickup', x: p.x, y: p.y, repair: p.repair, weapon: p.weapon, weaponKind: g.weaponKind, repaired:g.hp-beforeHp, points:p.repair||p.weapon?0:100*g.combo});
      }
    }
    g.pickups = g.pickups.filter(p => p.life > 0);
    if (g.xp >= g.xpNeeded) offerUpgrade(g);
  }
  function advance(g, delta, input = {}) {
    let remaining = Math.min(.15, Math.max(0, Number.isFinite(delta) ? delta : 0));
    let simulated = 0;
    const events = [];
    while (remaining > 1e-9 && g.mode === 'playing') {
      const dt = Math.min(remaining, .05);
      step(g, dt, input);
      events.push(...g.events);
      remaining -= dt;
      simulated += dt;
    }
    g.events = events;
    return simulated;
  }
  const api = {get WIDTH() {return WIDTH;}, HEIGHT, get CORRIDOR() {return CORRIDOR;}, UPGRADES, DESTINATIONS, BOSS_ATTACKS, DOCTRINES, destinationFor, configureViewport, chooseUpgrade, createGame, start, salvageForRun, togglePause, step, advance, dash, incomingMissileThreat};
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
