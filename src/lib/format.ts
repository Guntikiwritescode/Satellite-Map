const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const km = (v: number) => (Number.isFinite(v) ? `${number.format(v)} km` : '–');
export const kms = (v: number) => (Number.isFinite(v) ? `${v.toFixed(2)} km/s` : '–');
export const deg = (v: number, digits = 1) => (Number.isFinite(v) ? `${v.toFixed(digits)}°` : '–');
export const count = (v: number) => number.format(v);

export function minutes(v: number) {
  if (v < 120) return `${v.toFixed(1)} min`;
  return `${Math.floor(v / 60)} h ${Math.round(v % 60)} min`;
}

export function latLon(lat: number, lon: number) {
  if (!Number.isFinite(lat)) return '–';
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}

export function clock(time: number) {
  const date = new Date(time);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleString();
}
