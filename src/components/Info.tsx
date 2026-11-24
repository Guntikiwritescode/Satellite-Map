import { geoOf, live, set, useStore } from '../store.ts';
import { CATEGORIES, ownerName } from '../lib/satellites.ts';
import { deg, km, kms, minutes } from '../lib/format.ts';

export default function Info() {
  const sats = useStore((s) => s.sats);
  const selectedId = useStore((s) => s.selectedId);
  useStore((s) => s.tick);

  const index = sats.findIndex((s) => s.id === selectedId);
  if (index < 0) return null;
  const sat = sats[index];
  const g = live.geo.length === sats.length * 4 ? geoOf(index) : { lat: NaN, lon: NaN, alt: NaN, speed: NaN };

  const rows: [string, string][] = [
    ['NORAD ID', String(sat.id)],
    ["Int'l designator", sat.cospar],
    ['Type', CATEGORIES.find((c) => c.id === sat.category)!.label],
    ['Owner', sat.owner ? ownerName(sat.owner) : '–'],
    ['Launched', sat.launched],
    ['Latitude', deg(g.lat, 2)],
    ['Longitude', deg(g.lon, 2)],
    ['Altitude', km(g.alt)],
    ['Velocity', kms(g.speed)],
    ['Orbit', sat.orbit],
    ['Period', minutes(sat.period)],
    ['Inclination', deg(sat.inclination)],
    ['Apogee', km(sat.apogee)],
    ['Perigee', km(sat.perigee)],
    ['Eccentricity', sat.eccentricity.toFixed(4)],
    ['Epoch', sat.epoch.slice(0, 19).replace('T', ' ') + ' UTC'],
  ];

  return (
    <div id="info" className="box">
      <div className="title">
        <span>{sat.name}</span>
        <button aria-label="Close" onClick={() => set({ selectedId: null })}>
          ×
        </button>
      </div>
      {rows.map(([k, v]) => (
        <div className="row" key={k}>
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
      <p style={{ margin: '6px 0 0' }}>
        <a href={`https://celestrak.org/satcat/table-satcat.php?CATNR=${sat.id}`}>CelesTrak entry</a>
      </p>
    </div>
  );
}
