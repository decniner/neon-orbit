const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('../site/core.js');

test('doctrines start with distinct loadouts and unknown choices fall back safely', () => {
  const aegis = core.createGame(() => 0.5); core.start(aegis,'aegis');
  const cinder = core.createGame(() => 0.5); core.start(cinder,'cinder');
  const sentinel = core.createGame(() => 0.5); core.start(sentinel,'sentinel');
  const unknown = core.createGame(() => 0.5); core.start(unknown,'not-a-doctrine');
  assert.equal(aegis.aegisShield,true);
  assert.equal(cinder.damageBonus,1);
  assert.equal(sentinel.guardianCores.sentinel,1);
  assert.equal(unknown.guardianCores.sentinel,0);
});

test('salvage rewards increase with kills and guardian victories and are capped per run', () => {
  const game = core.createGame(() => 0.5);
  const quiet = core.salvageForRun(game);
  game.kills=12;
  const combat = core.salvageForRun(game);
  game.bossesDefeated=2;
  assert.ok(combat>quiet);
  assert.ok(core.salvageForRun(game)>combat);
  game.kills=1000; game.bossesDefeated=100;
  assert.equal(core.salvageForRun(game),99);
});
