import { create } from 'zustand';
import type { Category, OrbitClass, Sat } from './lib/satellites.ts';

export interface Filters {
  query: string;
  categories: Category[];
  orbit: OrbitClass | 'all';
  owner: string;
}

interface State {
  sats: Sat[];
  status: 'loading' | 'ready' | 'error';
  error: string;
  fetchedAt: number;
  tick: number;
  table: boolean;
  menu: 'filters' | 'help' | null;
  selectedId: number | null;
  filters: Filters;
  dayNight: boolean;
}

export const defaultFilters: Filters = { query: '', categories: [], orbit: 'all', owner: 'all' };

export const useStore = create<State>()(() => ({
  sats: [],
  status: 'loading',
  error: '',
  fetchedAt: 0,
  tick: 0,
  table: false,
  menu: null,
  selectedId: null,
  filters: defaultFilters,
  dayNight: true,
}));

export const set = useStore.setState;

export function setFilters(filters: Partial<Filters>) {
  set((s) => ({ filters: { ...s.filters, ...filters } }));
}

// written by the worker every second, outside React state to avoid re-renders
export const live = {
  positions: new Float32Array(0),
  geo: new Float32Array(0),
};

export function geoOf(index: number) {
  const g = live.geo;
  return { lat: g[index * 4], lon: g[index * 4 + 1], alt: g[index * 4 + 2], speed: g[index * 4 + 3] };
}

export function matches(sat: Sat, f: Filters) {
  if (f.categories.length && !f.categories.includes(sat.category)) return false;
  if (f.orbit !== 'all' && sat.orbit !== f.orbit) return false;
  if (f.owner !== 'all' && sat.owner !== f.owner) return false;
  const q = f.query.trim().toLowerCase();
  if (q && !sat.name.toLowerCase().includes(q) && String(sat.id) !== q && !sat.cospar.toLowerCase().startsWith(q)) {
    return false;
  }
  return true;
}
