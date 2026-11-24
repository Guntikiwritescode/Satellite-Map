import { lazy, Suspense, useEffect } from 'react';
import { live, set, useStore } from './store.ts';
import { loadElements, loadOwners, MAX_AGE } from './lib/data.ts';
import { toSat } from './lib/satellites.ts';
import { clock, count } from './lib/format.ts';
import Menu from './components/Menu.tsx';
import Info from './components/Info.tsx';
import SatTable from './components/SatTable.tsx';

const Globe = lazy(() => import('./components/Globe.tsx'));

export default function App() {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const table = useStore((s) => s.table);
  const total = useStore((s) => s.sats.length);
  const fetchedAt = useStore((s) => s.fetchedAt);

  useEffect(() => {
    const worker = new Worker(new URL('./lib/propagator.worker.ts', import.meta.url), { type: 'module' });
    let gen = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    worker.onmessage = (e) => {
      if (e.data.gen !== gen) return;
      live.positions = e.data.positions;
      live.geo = e.data.geo;
      set({ tick: e.data.time });
    };

    async function load() {
      let next = 30 * 60 * 1000;
      try {
        const [elements, owners] = await Promise.all([loadElements(), loadOwners()]);
        if (cancelled) return;
        gen++;
        live.positions = new Float32Array(0);
        live.geo = new Float32Array(0);
        worker.postMessage({ gen, records: elements.records });
        const sats = elements.records.map((r) => toSat(r, owners));
        set((s) => ({
          sats,
          status: 'ready',
          fetchedAt: elements.fetchedAt,
          selectedId: sats.some((sat) => sat.id === s.selectedId) ? s.selectedId : null,
        }));
        if (!elements.stale) next = Math.max(elements.fetchedAt + MAX_AGE - Date.now(), 60 * 1000);
      } catch (err) {
        if (!cancelled && useStore.getState().status !== 'ready') {
          set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
      }
      if (!cancelled) timer = setTimeout(load, next);
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      worker.terminate();
    };
  }, []);

  if (status === 'loading') return <div id="message">Loading satellites...</div>;
  if (status === 'error') {
    return (
      <div id="message">
        <div>
          Could not load satellite data from CelesTrak.
          <p className="muted">{error}</p>
          <a href="">Reload</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="canvas">
        <Suspense fallback={null}>
          <Globe active={!table} />
        </Suspense>
      </div>
      <Menu />
      {table ? <SatTable /> : <Info />}
      {!table && (
        <div id="status">
          {count(total)} satellites, data from {clock(fetchedAt)}
        </div>
      )}
    </>
  );
}
