import { degreesLat, degreesLong, eciToGeodetic, gstime, json2satrec, type OMMJsonObject, type SatRec } from 'satellite.js';
import { eciToScene, propagateAt } from './satellites.ts';

let satrecs: (SatRec | null)[] = [];
let gen = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function step() {
  const time = Date.now();
  const date = new Date(time);
  const gmst = gstime(date);
  const positions = new Float32Array(satrecs.length * 3);
  const geo = new Float32Array(satrecs.length * 4).fill(NaN);

  satrecs.forEach((satrec, i) => {
    if (!satrec) return;
    const pv = propagateAt(satrec, date);
    if (!pv) return;
    const { position, velocity } = pv;
    eciToScene(position, positions, i * 3);
    const gd = eciToGeodetic(position, gmst);
    geo[i * 4] = degreesLat(gd.latitude);
    geo[i * 4 + 1] = degreesLong(gd.longitude);
    geo[i * 4 + 2] = gd.height;
    geo[i * 4 + 3] = Math.hypot(velocity.x, velocity.y, velocity.z);
  });

  postMessage({ gen, time, positions, geo }, { transfer: [positions.buffer, geo.buffer] });
}

onmessage = (e: MessageEvent<{ gen: number; records: OMMJsonObject[] }>) => {
  gen = e.data.gen;
  satrecs = e.data.records.map((omm) => {
    try {
      return json2satrec(omm);
    } catch {
      return null;
    }
  });
  clearInterval(timer);
  step();
  timer = setInterval(step, 1000);
};
