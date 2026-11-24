import { writeFileSync } from 'node:fs';

const url = 'https://celestrak.org/pub/satcat.csv';

function splitCsv(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
if (!res.ok) throw new Error(`${url} returned ${res.status}`);

const [header, ...rows] = (await res.text()).trim().split(/\r?\n/);
const col = Object.fromEntries(splitCsv(header).map((name, i) => [name, i]));
const owners = {};
for (const row of rows) {
  const c = splitCsv(row);
  if (c[col.DECAY_DATE] || c[col.OBJECT_TYPE] !== 'PAY') continue;
  owners[c[col.NORAD_CAT_ID]] = [c[col.OWNER], c[col.LAUNCH_DATE]];
}
writeFileSync(new URL('../public/owners.json', import.meta.url), JSON.stringify(owners));
