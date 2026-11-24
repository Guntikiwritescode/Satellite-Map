import { useMemo, useState } from 'react';
import { geoOf, live, matches, set, useStore } from '../store.ts';
import { CATEGORIES, ownerName, type Sat } from '../lib/satellites.ts';
import { deg, km, kms, latLon, minutes } from '../lib/format.ts';
import VirtualList from './VirtualList.tsx';

type Key = 'name' | 'id' | 'category' | 'owner' | 'orbit' | 'alt' | 'speed' | 'period' | 'inclination';

const COLUMNS: { key: Key; label: string; num?: boolean }[] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'NORAD', num: true },
  { key: 'category', label: 'Type' },
  { key: 'owner', label: 'Owner' },
  { key: 'orbit', label: 'Orbit' },
  { key: 'alt', label: 'Altitude', num: true },
  { key: 'speed', label: 'Velocity', num: true },
  { key: 'period', label: 'Period', num: true },
  { key: 'inclination', label: 'Incl.', num: true },
];

function liveGeo(index: Map<Sat, number>, sat: Sat) {
  return live.geo.length === index.size * 4 ? geoOf(index.get(sat)!) : { lat: NaN, lon: NaN, alt: NaN, speed: NaN };
}

export default function SatTable() {
  const sats = useStore((s) => s.sats);
  const filters = useStore((s) => s.filters);
  useStore((s) => s.tick);
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: 'name', desc: false });

  const index = useMemo(() => new Map(sats.map((s, i) => [s, i])), [sats]);
  const geo = (sat: Sat) => liveGeo(index, sat);

  const rows = useMemo(() => {
    const value = (sat: Sat): string | number => {
      if (sort.key === 'alt' || sort.key === 'speed') return liveGeo(index, sat)[sort.key] || 0;
      if (sort.key === 'owner') return ownerName(sat.owner);
      return sat[sort.key];
    };
    const list = sats.filter((s) => matches(s, filters));
    list.sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const order = typeof x === 'number' ? x - (y as number) || 0 : x.localeCompare(y as string);
      return sort.desc ? -order : order;
    });
    return list;
  }, [sats, filters, sort, index]);

  return (
    <VirtualList
      id="table"
      items={rows}
      itemKey={(sat) => sat.id}
      rowHeight={24}
      header={
        <div className="table-row table-head">
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              className={c.num ? 'num' : ''}
              onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : false }))}
            >
              {c.label}
              {sort.key === c.key && (sort.desc ? ' ▼' : ' ▲')}
            </button>
          ))}
          <span>Position</span>
        </div>
      }
      render={(sat) => {
        const g = geo(sat);
        return (
          <button className="table-row" onClick={() => set({ selectedId: sat.id, table: false })}>
            <span>{sat.name}</span>
            <span className="num">{sat.id}</span>
            <span>{CATEGORIES.find((c) => c.id === sat.category)!.label}</span>
            <span>{sat.owner ? ownerName(sat.owner) : '–'}</span>
            <span>{sat.orbit}</span>
            <span className="num">{km(g.alt)}</span>
            <span className="num">{kms(g.speed)}</span>
            <span className="num">{minutes(sat.period)}</span>
            <span className="num">{deg(sat.inclination)}</span>
            <span className="muted">{latLon(g.lat, g.lon)}</span>
          </button>
        );
      }}
    />
  );
}
