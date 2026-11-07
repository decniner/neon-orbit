const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const core = require('../core.js');
const gameSource = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('visual size choices range from normal to small to tiny', () => {
  assert.equal(core.visualSizeScale('normal'), 1);
  assert.ok(core.visualSizeScale('small') < core.visualSizeScale('normal'));
  assert.ok(core.visualSizeScale('tiny') < core.visualSizeScale('small'));
  assert.equal(core.visualSizeScale('unknown'), 1);
});

test('pre-flight size selector offers accessible Normal, Small, and Tiny options', () => {
  assert.match(html, /aria-label="Choose ship and weapon size"/);
  for (const size of ['normal', 'small', 'tiny']) assert.match(html, new RegExp(`data-visual-size="${size}"`));
  assert.match(gameSource, /visualSize:'normal'/, 'Normal remains the default for existing profiles');
  assert.match(gameSource, /saveProfile\(\);renderVisualSize\(\)/, 'the selected size is saved in the pilot profile');
});

test('ship, enemy, boss, drone, and missile artwork use the selected visual scale', () => {
  for (const name of ['ship', 'enemyCraft', 'drawBoss', 'drawDrone', 'missileCraft']) {
    const start = gameSource.indexOf(`function ${name}(`);
    const end = gameSource.indexOf('\nfunction ', start + 1);
    const body = gameSource.slice(start, end < 0 ? undefined : end);
    assert.match(body, /activeVisualScale/, `${name} artwork is scaled`);
  }
  assert.match(gameSource, /withVisualScale\(b\.x,b\.y\)/, 'projectile weapons are scaled at their visual centers');
});
