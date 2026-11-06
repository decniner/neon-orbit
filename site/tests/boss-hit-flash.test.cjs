const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const start = source.indexOf('function drawBoss(');
const end = source.indexOf('function drawCorridor(', start);
const drawBoss = source.slice(start, end);

test('boss hit feedback never fills the rectangular sprite bounds', () => {
  assert.ok(start >= 0 && end > start, 'drawBoss function is present');
  const hitFlash = drawBoss.match(/if\(e\.hitFlash>0\)\{([^}]*)\}/)?.[1] || '';
  assert.match(hitFlash, /ctx\.arc\(/, 'boss hits use a localized round core flash');
  assert.doesNotMatch(hitFlash, /fillRect\(-w\/2,-h\/2,w,h\)/, 'boss hit feedback does not tint the image rectangle');
});
