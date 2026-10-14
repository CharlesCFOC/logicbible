import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeCoastline, decodeCountryBorders, globePoint, projectGlobePoint, rotateGlobePoint } from '../lib/prayer/interactive-globe.js';

test('geographic points are normalized before rotation', () => {
  for (const [latitude, longitude] of [[0, 0], [45, -73], [-30, 151], [90, 0]]) {
    const point = globePoint(latitude, longitude);
    assert.ok(Math.abs(Math.hypot(point.x, point.y, point.z) - 1) < 1e-12);
  }
});

test('yaw and pitch rotate a globe point in all directions without changing its depth bounds', () => {
  const point = globePoint(0, 0);
  const facing = rotateGlobePoint(point, 0, 0);
  const turned = rotateGlobePoint(point, Math.PI / 2, 0);
  const tilted = projectGlobePoint(point, 0, Math.PI / 2);
  assert.deepEqual(facing, { x: 0, y: 0, z: 1 });
  assert.ok(Math.abs(turned.x - 1) < 1e-12 && Math.abs(turned.z) < 1e-12);
  assert.ok(Math.abs(tilted.y + 1) < 1e-12 && tilted.z < 1e-12);
  assert.ok(tilted.scale >= .84 && tilted.scale <= 1);
});

test('country topology becomes geographic rings that can be projected on the globe', () => {
  const topology = {
    transform: { scale: [1, 1], translate: [0, 0] },
    arcs: [[[0, 0], [10, 0], [0, 10], [-10, 0], [0, -10]]],
    objects: { countries: { geometries: [{ type: 'Polygon', arcs: [[0]] }] } },
  };
  const borders = decodeCountryBorders(topology);
  assert.equal(borders.length, 1);
  assert.equal(borders[0].rings[0].length, 5);
  assert.ok(borders[0].rings[0].every(point => Math.abs(Math.hypot(point.x, point.y, point.z) - 1) < .000001));
});

test('land topology becomes coastline rings without country border metadata', () => {
  const topology = {
    transform: { scale: [1, 1], translate: [0, 0] },
    arcs: [[[0, 0], [10, 0], [0, 10], [-10, 0], [0, -10]]],
    objects: { land: { geometries: [{ type: 'Polygon', arcs: [[0]] }] } },
  };
  const coastline = decodeCoastline(topology);
  assert.equal(coastline.length, 1);
  assert.equal(coastline[0].length, 5);
  assert.ok(coastline[0].every(point => Math.abs(Math.hypot(point.x, point.y, point.z) - 1) < .000001));
});
