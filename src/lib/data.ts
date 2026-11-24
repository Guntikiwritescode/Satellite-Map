import type { OMMJsonObject } from 'satellite.js';

const GP_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json';
// CelesTrak updates GP data every 2 hours
export const MAX_AGE = 2 * 60 * 60 * 1000;

export interface Elements {
  records: OMMJsonObject[];
  fetchedAt: number;
  stale: boolean;
}

async function readCache(): Promise<{ cache: Cache | null; copy: Elements | null }> {
  try {
    const cache = await caches.open('satellite-map');
    const res = await cache.match(GP_URL);
    if (!res) return { cache, copy: null };
    const fetchedAt = Number(res.headers.get('x-fetched-at'));
    const records = await res.json();
    return { cache, copy: { records, fetchedAt, stale: Date.now() - fetchedAt > MAX_AGE } };
  } catch {
    return { cache: null, copy: null };
  }
}

let pending: Promise<Elements> | null = null;

export function loadElements(): Promise<Elements> {
  pending ??= fetchElements().finally(() => (pending = null));
  return pending;
}

async function fetchElements(): Promise<Elements> {
  const { cache, copy } = await readCache();
  if (copy && !copy.stale) return copy;

  let records: OMMJsonObject[];
  try {
    const res = await fetch(GP_URL);
    const text = await res.text();
    records = res.ok && text.startsWith('[') ? JSON.parse(text) : [];
    if (!records.length) throw new Error(text.trim() || `CelesTrak returned ${res.status}`);
  } catch (err) {
    if (copy) return copy;
    throw err;
  }

  const fetchedAt = Date.now();
  try {
    await cache?.put(GP_URL, new Response(JSON.stringify(records), { headers: { 'x-fetched-at': String(fetchedAt) } }));
  } catch {
    // storage full or blocked
  }
  return { records, fetchedAt, stale: false };
}

export async function loadOwners(): Promise<Record<string, [string, string]>> {
  try {
    return await (await fetch('/owners.json')).json();
  } catch {
    return {};
  }
}
