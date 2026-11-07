const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

test('player ship uses a high-resolution transparent volumetric render', () => {
  const imagePath = path.join(__dirname, '..', 'assets', 'wayfarer-volumetric.png');
  const image = fs.readFileSync(imagePath);
  assert.match(source, /wayfarer-volumetric\.png/, 'player renderer loads the volumetric art');
  assert.equal(image.toString('ascii', 1, 4), 'PNG', 'ship art is a PNG asset');
  assert.equal(image.readUInt32BE(16), 1182, 'sprite preserves detailed horizontal resolution');
  assert.equal(image.readUInt32BE(20), 1330, 'sprite preserves detailed vertical resolution');
  assert.equal(image[25], 6, 'sprite retains an alpha channel for clean compositing');
  assert.doesNotMatch(source, /function drawShipDepth\(/, 'volume comes from the 3D ship asset itself');
});

test('the game and offline cache use the volumetric ship artwork', () => {
  const game = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
  const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(game, /wayfarer-volumetric\.png/, 'player sprite points to the raised 3D artwork');
  assert.match(serviceWorker, /assets\/wayfarer-volumetric\.png/, 'offline play caches the new player sprite');
});
