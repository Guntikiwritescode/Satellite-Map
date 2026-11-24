import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { degreesLong, eciToGeodetic, gstime, json2satrec, propagate } from 'satellite.js';
import { categorize, eciToScene, orbitClass, toSat } from '../src/lib/satellites.ts';

const iss = {
  OBJECT_NAME: 'ISS (ZARYA)',
  OBJECT_ID: '1998-067A',
  EPOCH: '2026-11-23T21:54:38.454912',
  MEAN_MOTION: 15.49568558,
  ECCENTRICITY: 0.00073794,
  INCLINATION: 51.6322,
  RA_OF_ASC_NODE: 229.652,
  ARG_OF_PERICENTER: 58.6021,
  MEAN_ANOMALY: 301.5689,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 25544,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 59651,
  BSTAR: 0.00010921139,
  MEAN_MOTION_DOT: 5.691e-5,
  MEAN_MOTION_DDOT: 0,
};

// undo the globe's GMST turn, then read the longitude off the sphere's texture wrap
test('satellites sit over the right longitude on the textured globe', () => {
  const satrec = json2satrec(iss);
  for (let h = 0; h < 24; h += 3) {
    const date = new Date(Date.UTC(2026, 10, 24, h, 17));
    const { position } = propagate(satrec, date);
    const expected = degreesLong(eciToGeodetic(position, gstime(date)).longitude);

    const p = [0, 0, 0];
    eciToScene(position, p);
    const local = new THREE.Vector3(...p).applyAxisAngle(new THREE.Vector3(0, 1, 0), -gstime(date));
    const u = (Math.atan2(local.z, -local.x) / (2 * Math.PI) + 1) % 1;
    const textureLon = u * 360 - 180;

    const diff = ((textureLon - expected + 540) % 360) - 180;
    assert.ok(Math.abs(diff) < 1e-6, `hour ${h}: texture ${textureLon}, expected ${expected}`);
  }
});

test('orbit numbers for the ISS', () => {
  const sat = toSat(iss, { 25544: ['ISS', '1998-11-20'] });
  assert.equal(sat.category, 'station');
  assert.equal(sat.orbit, 'LEO');
  assert.equal(sat.owner, 'ISS');
  assert.ok(sat.period > 92 && sat.period < 94, `period ${sat.period}`);
  assert.ok(sat.perigee > 400 && sat.apogee < 440, `${sat.perigee} to ${sat.apogee}`);
});

test('types and orbits', () => {
  assert.equal(categorize('STARLINK-1007'), 'starlink');
  assert.equal(categorize('GPS BIIR-2  (PRN 13)'), 'navigation');
  assert.equal(categorize('COSMOS 2433 (720)'), 'navigation');
  assert.equal(categorize('GSAT0101 (GALILEO-PFM)'), 'navigation');
  assert.equal(categorize('NOAA 19'), 'weather');
  assert.equal(categorize('COSMOS 2558'), 'other');
  assert.equal(orbitClass(1436, 0.0002, 35790), 'GEO');
  assert.equal(orbitClass(1436, 0.075, 39000), 'GEO');
  assert.equal(orbitClass(718, 0.01, 20200), 'MEO');
  assert.equal(orbitClass(717, 0.7, 39000), 'HEO');
});
