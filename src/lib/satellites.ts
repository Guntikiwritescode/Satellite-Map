import { propagate, type OMMJsonObject, type SatRec } from 'satellite.js';

export type Category =
  'station' | 'starlink' | 'oneweb' | 'navigation' | 'weather' | 'imaging' | 'science' | 'communication' | 'other';

export type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO';

export interface Sat {
  id: number;
  name: string;
  cospar: string;
  category: Category;
  orbit: OrbitClass;
  owner: string;
  launched: string;
  inclination: number;
  eccentricity: number;
  period: number;
  apogee: number;
  perigee: number;
  epoch: string;
  omm: OMMJsonObject;
}

const EARTH_RADIUS_KM = 6371;
const EQUATOR_RADIUS_KM = 6378.137;
const MU = 398600.4418;

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'station', label: 'Stations', color: '#fff' },
  { id: 'starlink', label: 'Starlink', color: '#4af' },
  { id: 'oneweb', label: 'OneWeb', color: '#a6f' },
  { id: 'communication', label: 'Communications', color: '#0cc' },
  { id: 'navigation', label: 'Navigation', color: '#fc0' },
  { id: 'weather', label: 'Weather', color: '#f80' },
  { id: 'imaging', label: 'Earth observation', color: '#4c4' },
  { id: 'science', label: 'Science', color: '#f4a' },
  { id: 'other', label: 'Other', color: '#888' },
];

export const ORBITS: OrbitClass[] = ['LEO', 'MEO', 'GEO', 'HEO'];

const PATTERNS: [Category, RegExp][] = [
  ['station', /^(ISS|CSS) \(|TIANGONG/],
  ['starlink', /^STARLINK/],
  ['oneweb', /^ONEWEB/],
  ['navigation', /^(NAVSTAR|GPS |BEIDOU|IRNSS|NVS-|QZS)|^COSMOS \d+ \(\d{3}[A-Z]?\)$|GLONASS|GALILEO/],
  ['weather', /^(NOAA|GOES|METEOSAT|METOP|METEOR-M|HIMAWARI|FENGYUN|FY-|DMSP|ELEKTRO|ARKTIKA|GK-2A|INSAT-3D|TIANMU)/],
  [
    'imaging',
    /^(LANDSAT|SENTINEL|WORLDVIEW|FLOCK|SKYSAT|SPOT|PLEIADES|PELICAN|TANAGER|ICEYE|CAPELLA|UMBRA|LEGION|LEMUR|JILIN|SUPERVIEW|GAOFEN|HUANJING|ZIYUAN|KOMPSAT|RADARSAT|COSMO-SKYMED|SAOCOM|GOKTURK|CO3D|TERRA$|AQUA$)/,
  ],
  [
    'science',
    /^(HST|CXO|TESS|SWIFT|FERMI|NUSTAR|CHANDRA|XMM|INTEGRAL|GAIA|CHEOPS|IXPE|EINSTEIN PROBE|SVOM|ICESAT|GRACE|CALIPSO|CLOUDSAT|SWARM|MMS )/,
  ],
  [
    'communication',
    /^(IRIDIUM|GLOBALSTAR|ORBCOMM|KUIPER|INTELSAT|SES|EUTELSAT|INMARSAT|VIASAT|TDRS|ECHOSTAR|DIRECTV|SIRIUS|XM-|ASTRA|HOTBIRD|TELSTAR|THURAYA|AMAZONAS|HISPASAT|YAHSAT|ARABSAT|NILESAT|TURKSAT|CHINASAT|APSTAR|ASIASAT|JCSAT|SKYNET|MUOS|WGS|AEHF|O3B|LUCH|EXPRESS|YAMAL|QIANFAN|GUOWANG|AST SPACEMOBILE|BLUEBIRD)/,
  ],
];

const OWNER_NAMES: Record<string, string> = {
  US: 'United States',
  PRC: 'China',
  UK: 'United Kingdom',
  CIS: 'Russia',
  JPN: 'Japan',
  IT: 'Italy',
  IND: 'India',
  SKOR: 'South Korea',
  GER: 'Germany',
  ESA: 'European Space Agency',
  FR: 'France',
  SPN: 'Spain',
  CA: 'Canada',
  TURK: 'Turkey',
  AUS: 'Australia',
  ARGN: 'Argentina',
  ROC: 'Taiwan',
  FIN: 'Finland',
  UAE: 'United Arab Emirates',
  GREC: 'Greece',
  NOR: 'Norway',
  ISRA: 'Israel',
  SING: 'Singapore',
  SAUD: 'Saudi Arabia',
};

export function ownerName(code: string) {
  return OWNER_NAMES[code] ?? code;
}

export function categorize(name: string): Category {
  for (const [category, pattern] of PATTERNS) if (pattern.test(name)) return category;
  return 'other';
}

export function orbitClass(period: number, eccentricity: number, apogee: number): OrbitClass {
  if (eccentricity > 0.25) return 'HEO';
  if (apogee < 2000) return 'LEO';
  if (period > 1400 && period < 1480 && eccentricity < 0.1) return 'GEO';
  return 'MEO';
}

export function toSat(omm: OMMJsonObject, owners: Record<string, [string, string]>): Sat {
  const meanMotion = Number(omm.MEAN_MOTION);
  const eccentricity = Number(omm.ECCENTRICITY);
  const radPerSec = (meanMotion * 2 * Math.PI) / 86400;
  const semiMajor = Math.cbrt(MU / (radPerSec * radPerSec));
  const apogee = semiMajor * (1 + eccentricity) - EQUATOR_RADIUS_KM;
  const perigee = semiMajor * (1 - eccentricity) - EQUATOR_RADIUS_KM;
  const period = 1440 / meanMotion;
  const id = Number(omm.NORAD_CAT_ID);
  const [owner, launched] = owners[id] ?? ['', ''];
  return {
    id,
    name: omm.OBJECT_NAME,
    cospar: omm.OBJECT_ID,
    category: categorize(omm.OBJECT_NAME),
    orbit: orbitClass(period, eccentricity, apogee),
    owner,
    launched: launched || omm.OBJECT_ID.slice(0, 4),
    inclination: Number(omm.INCLINATION),
    eccentricity,
    period,
    apogee,
    perigee,
    epoch: omm.EPOCH,
    omm,
  };
}

export function propagateAt(satrec: SatRec, date: Date) {
  const pv = propagate(satrec, date);
  if (!pv || typeof pv.position !== 'object' || typeof pv.velocity !== 'object' || !Number.isFinite(pv.position.x)) return null;
  return pv;
}

// ECI km (z north) to scene units (earth radius 1, y up)
export function eciToScene(p: { x: number; y: number; z: number }, out: number[] | Float32Array, offset = 0) {
  out[offset] = p.x / EARTH_RADIUS_KM;
  out[offset + 1] = p.z / EARTH_RADIUS_KM;
  out[offset + 2] = -p.y / EARTH_RADIUS_KM;
}
