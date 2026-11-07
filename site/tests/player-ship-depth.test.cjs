const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const shipStart = source.indexOf('function ship(');
const shipEnd = source.indexOf('\nfunction shipEvolution(', shipStart);
const ship = source.slice(shipStart, shipEnd);
const depthStart = source.indexOf('function drawShipDepth(');
const depthEnd = source.indexOf('\nfunction shipEvolution(', depthStart);
const depth = source.slice(depthStart, depthEnd);

test('player ship render adds a compact cast shadow and metal depth highlights', () => {
  assert.ok(shipStart >= 0 && shipEnd > shipStart, 'player ship renderer is present');
  assert.ok(depthStart >= 0 && depthEnd > depthStart, 'player ship depth pass is present');
  assert.ok(ship.indexOf('drawImage(image') < ship.indexOf('drawShipDepth('), 'depth details are layered over the rendered hull');
  assert.match(ship, /shadowOffsetY=/, 'the hull casts a grounded shadow');
  assert.match(depth, /globalCompositeOperation='screen'/, 'metal highlights use additive light');
  assert.match(depth, /quadraticCurveTo\(/, 'curved canopy glass receives a specular highlight');
  assert.match(depth, /stroke\(\)/, 'armor bevel seams are visibly drawn');
});
