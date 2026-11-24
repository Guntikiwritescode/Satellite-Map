import { useMemo, useState } from 'react';
import { defaultFilters, matches, set, setFilters, useStore } from '../store.ts';
import { CATEGORIES, ORBITS, ownerName, type Category } from '../lib/satellites.ts';
import { count } from '../lib/format.ts';
import VirtualList from './VirtualList.tsx';

export default function Menu() {
  const menu = useStore((s) => s.menu);
  const table = useStore((s) => s.table);
  const query = useStore((s) => s.filters.query);
  const [results, setResults] = useState(false);

  const toggle = (name: 'filters' | 'help') => set({ menu: menu === name ? null : name });

  return (
    <>
      <div id="menu">
        <input
          id="search"
          aria-label="Search"
          placeholder="Search"
          value={query}
          onFocus={() => setResults(true)}
          onChange={(e) => {
            setFilters({ query: e.target.value });
            setResults(true);
          }}
        />
        <span className="menu-item">
          <button className={`item ${menu === 'filters' ? 'open' : ''}`} onClick={() => toggle('filters')}>
            Filters
          </button>
          {menu === 'filters' && <FilterBox />}
        </span>
        <button className={`item ${table ? 'open' : ''}`} onClick={() => set({ table: !table, menu: null })}>
          Table
        </button>
        <span className="menu-item">
          <button className={`item ${menu === 'help' ? 'open' : ''}`} onClick={() => toggle('help')}>
            Help
          </button>
          {menu === 'help' && <HelpBox />}
        </span>
      </div>
      {results && query && !table && <Results close={() => setResults(false)} />}
    </>
  );
}

function Results({ close }: { close: () => void }) {
  const sats = useStore((s) => s.sats);
  const filters = useStore((s) => s.filters);
  const selectedId = useStore((s) => s.selectedId);
  const list = useMemo(() => sats.filter((s) => matches(s, filters)), [sats, filters]);

  if (list.length === 0) {
    return (
      <div id="search-results" className="box" style={{ padding: 8 }}>
        No matches
      </div>
    );
  }

  return (
    <VirtualList
      id="search-results"
      className="box"
      items={list}
      rowHeight={26}
      itemKey={(sat) => sat.id}
      render={(sat) => (
        <button
          className={`result ${sat.id === selectedId ? 'selected' : ''}`}
          onClick={() => {
            set({ selectedId: sat.id });
            close();
          }}
        >
          <span className="name">{sat.name}</span>
          <span className="muted">{sat.cospar}</span>
        </button>
      )}
    />
  );
}

function FilterBox() {
  const sats = useStore((s) => s.sats);
  const filters = useStore((s) => s.filters);
  const dayNight = useStore((s) => s.dayNight);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const sat of sats) {
      c.set(sat.category, (c.get(sat.category) ?? 0) + 1);
      if (sat.owner) c.set(`owner:${sat.owner}`, (c.get(`owner:${sat.owner}`) ?? 0) + 1);
    }
    return c;
  }, [sats]);

  const owners = [...counts]
    .filter(([k]) => k.startsWith('owner:'))
    .map(([k, n]) => [k.slice(6), n] as const)
    .sort((a, b) => b[1] - a[1]);

  const toggle = (id: Category) =>
    setFilters({
      categories: filters.categories.includes(id) ? filters.categories.filter((c) => c !== id) : [...filters.categories, id],
    });

  return (
    <div className="box dropdown">
      <h3>Type</h3>
      {CATEGORIES.filter((c) => counts.get(c.id)).map((c) => (
        <label key={c.id}>
          <input type="checkbox" checked={filters.categories.includes(c.id)} onChange={() => toggle(c.id)} />
          <span className="dot" style={{ background: c.color }} />
          {c.label}
          <span className="count">{count(counts.get(c.id) ?? 0)}</span>
        </label>
      ))}
      <h3>Orbit</h3>
      <select
        aria-label="Orbit"
        value={filters.orbit}
        onChange={(e) => setFilters({ orbit: e.target.value as typeof filters.orbit })}
      >
        <option value="all">All</option>
        {ORBITS.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <h3>Owner</h3>
      <select aria-label="Owner" value={filters.owner} onChange={(e) => setFilters({ owner: e.target.value })}>
        <option value="all">All</option>
        {owners.map(([code, n]) => (
          <option key={code} value={code}>
            {ownerName(code)} ({count(n)})
          </option>
        ))}
      </select>
      <label style={{ marginTop: 8 }}>
        <input type="checkbox" checked={dayNight} onChange={(e) => set({ dayNight: e.target.checked })} />
        Day and night
      </label>
      {JSON.stringify(filters) !== JSON.stringify(defaultFilters) && (
        <p>
          <a href="" onClick={(e) => (e.preventDefault(), set({ filters: defaultFilters }))}>
            Reset filters
          </a>
        </p>
      )}
    </div>
  );
}

function HelpBox() {
  return (
    <div className="box dropdown" style={{ width: 280 }}>
      <h3>Controls</h3>
      <ul>
        <li>Drag to rotate, scroll to zoom</li>
        <li>Click a satellite for its details</li>
      </ul>
      <h3>Data</h3>
      <p style={{ margin: 0 }}>
        Orbits and owners from <a href="https://celestrak.org">CelesTrak</a>, positions computed with{' '}
        <a href="https://github.com/shashwatak/satellite-js">satellite.js</a>. Earth image: NASA Earth Observatory.
      </p>
    </div>
  );
}
