const assert = require('node:assert/strict');
const core = require('../core.js');

const game=core.createGame(()=>.5);core.start(game);
game.spawnIn=100;game.supplyIn=100;game.fireIn=0;game.missileIn=100;
game.weaponTime=8;game.weaponKind='nova';
const target=(x,y)=>({x,y,r:14,hp:12,maxHp:12,kind:'sentry',speed:0,age:2,fireIn:100,hitFlash:0});
const first=target(game.player.x,game.player.y-42),splash=target(game.player.x+62,game.player.y-42);
game.enemies.push(first,splash);
core.step(game,.05,{});
assert.equal(game.events.filter(event=>event.type==='fire'&&event.weaponKind==='nova').length,1,'Nova Lancers fire as a distinct weapon');
assert.ok(game.events.some(event=>event.type==='explosion'&&event.kind==='nova'&&event.radius===88),'Nova cores produce a signature radial blast');
assert.ok(first.hp<12&&splash.hp<12,'the blast damages nearby enemies as well as its direct target');
