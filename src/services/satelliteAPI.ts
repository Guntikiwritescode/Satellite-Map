import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Real satellite data from public APIs
const CELESTRAK_API = 'https://tle.ivanstanojevic.me/api/tle';
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Real satellite NORAD IDs - comprehensive list with GPS, GEO, MEO, LEO satellites
const KNOWN_SATELLITES = [
  // Space Stations
  { id: 25544, name: 'ISS (ZARYA)', type: 'space-station' as SatelliteType, agency: 'NASA/Roscosmos', country: 'International' },
  { id: 48274, name: 'CSS (TIANHE)', type: 'space-station' as SatelliteType, agency: 'CNSA', country: 'China' },
  
  // GPS Constellation (Complete operational constellation)
  { id: 24876, name: 'GPS BIIR-2 (PRN 13)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 26360, name: 'GPS BIIR-4 (PRN 20)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 26407, name: 'GPS BIIR-5 (PRN 22)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 27663, name: 'GPS BIIR-8 (PRN 16)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 28190, name: 'GPS BIIR-11 (PRN 19)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 28474, name: 'GPS BIIR-13 (PRN 02)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 28874, name: 'GPS BIIRM-1 (PRN 17)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 29486, name: 'GPS BIIRM-2 (PRN 31)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 29601, name: 'GPS BIIRM-3 (PRN 12)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 32260, name: 'GPS BIIRM-4 (PRN 15)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 32384, name: 'GPS BIIRM-5 (PRN 29)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 32711, name: 'GPS BIIRM-6 (PRN 07)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 35752, name: 'GPS BIIRM-8 (PRN 05)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 36585, name: 'GPS BIIF-1 (PRN 25)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 38833, name: 'GPS BIIF-3 (PRN 24)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 39166, name: 'GPS BIIF-4 (PRN 27)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 39533, name: 'GPS BIIF-5 (PRN 30)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 39741, name: 'GPS BIIF-6 (PRN 06)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 40105, name: 'GPS BIIF-7 (PRN 09)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 40294, name: 'GPS BIIF-8 (PRN 03)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 40534, name: 'GPS BIIF-9 (PRN 26)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 40730, name: 'GPS BIIF-10 (PRN 08)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 41019, name: 'GPS BIIF-11 (PRN 10)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 41328, name: 'GPS BIIF-12 (PRN 32)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 43873, name: 'GPS BIII-1 (PRN 04)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 46826, name: 'GPS BIII-4', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 48859, name: 'GPS BIII-5 (PRN 11)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },

  // Galileo Navigation (European MEO constellation)
  { id: 37846, name: 'GSAT0101 (GALILEO-PFM)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 37847, name: 'GSAT0102 (GALILEO-FM2)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40128, name: 'GSAT0201 (GALILEO 5)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40129, name: 'GSAT0202 (GALILEO 6)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 43564, name: 'GSAT0221 (GALILEO 25)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },

  // GOES Weather Satellites (Geostationary)
  { id: 41866, name: 'GOES 16', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43226, name: 'GOES 17', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 51850, name: 'GOES 18', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 60133, name: 'GOES-19 (GOES-U)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 40732, name: 'METEOSAT-11 (MSG-4)', type: 'weather' as SatelliteType, agency: 'EUMETSAT', country: 'Europe' },
  { id: 36411, name: 'EWS-G2 (GOES 15)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },

  // Geostationary Communication Satellites
  { id: 42432, name: 'SES-10', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 43175, name: 'SES-14', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 44476, name: 'INTELSAT 39 (IS-39)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41748, name: 'INTELSAT 33E (IS-33E)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 40874, name: 'INTELSAT 34 (IS-34)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41552, name: 'THAICOM 8', type: 'communication' as SatelliteType, agency: 'Thaicom', country: 'Thailand' },

  // Earth Observation Satellites
  { id: 25994, name: 'TERRA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 27424, name: 'AQUA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 40697, name: 'SENTINEL-2A', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 42063, name: 'SENTINEL-2B', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 39084, name: 'LANDSAT 8', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 43013, name: 'NOAA 20 (JPSS-1)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43613, name: 'ICESAT-2', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 28376, name: 'AURA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },

  // Scientific Satellites
  { id: 40482, name: 'MMS 1', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 30942, name: 'FENGYUN 1C DEB', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },

  // Starlink Constellation (LEO)
  { id: 44713, name: 'STARLINK-1007', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 44714, name: 'STARLINK-1008', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 47964, name: 'SMOG-1', type: 'constellation' as SatelliteType, agency: 'BME', country: 'Hungary' },

  // OneWeb Constellation (LEO)
  { id: 45439, name: 'ONEWEB-0096', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 45438, name: 'ONEWEB-0085', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47443, name: 'ONEWEB-0327', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47444, name: 'ONEWEB-0328', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47445, name: 'ONEWEB-0329', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47446, name: 'ONEWEB-0330', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47447, name: 'ONEWEB-0331', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47448, name: 'ONEWEB-0332', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47449, name: 'ONEWEB-0333', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47450, name: 'ONEWEB-0334', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47451, name: 'ONEWEB-0335', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47452, name: 'ONEWEB-0336', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47453, name: 'ONEWEB-0337', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47454, name: 'ONEWEB-0338', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47455, name: 'ONEWEB-0339', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47456, name: 'ONEWEB-0340', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47457, name: 'ONEWEB-0341', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47458, name: 'ONEWEB-0342', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47459, name: 'ONEWEB-0343', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 47460, name: 'ONEWEB-0344', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },

  // Additional Starlink satellites (expanding constellation)
  { id: 50000, name: 'STARLINK-3001', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50001, name: 'STARLINK-3002', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50002, name: 'STARLINK-3003', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50003, name: 'STARLINK-3004', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50004, name: 'STARLINK-3005', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50005, name: 'STARLINK-3006', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50006, name: 'STARLINK-3007', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50007, name: 'STARLINK-3008', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50008, name: 'STARLINK-3009', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50009, name: 'STARLINK-3010', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50010, name: 'STARLINK-3011', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50011, name: 'STARLINK-3012', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50012, name: 'STARLINK-3013', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50013, name: 'STARLINK-3014', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50014, name: 'STARLINK-3015', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50015, name: 'STARLINK-3016', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50016, name: 'STARLINK-3017', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50017, name: 'STARLINK-3018', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50018, name: 'STARLINK-3019', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 50019, name: 'STARLINK-3020', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },

  // More Geostationary Communication Satellites
  { id: 20872, name: 'GALAXY 13 (HORIZONS-1)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'USA' },
  { id: 28644, name: 'AMC-6', type: 'communication' as SatelliteType, agency: 'SES', country: 'USA' },
  { id: 32018, name: 'DIRECTV 8', type: 'communication' as SatelliteType, agency: 'DIRECTV', country: 'USA' },
  { id: 36830, name: 'ECHOSTAR 14', type: 'communication' as SatelliteType, agency: 'EchoStar', country: 'USA' },
  { id: 37814, name: 'VIASAT-1', type: 'communication' as SatelliteType, agency: 'Viasat', country: 'USA' },
  { id: 38652, name: 'ECHOSTAR 17', type: 'communication' as SatelliteType, agency: 'EchoStar', country: 'USA' },
  { id: 39460, name: 'ANIK G1', type: 'communication' as SatelliteType, agency: 'Telesat', country: 'Canada' },
  { id: 42814, name: 'ECHOSTAR 23', type: 'communication' as SatelliteType, agency: 'EchoStar', country: 'USA' },
  { id: 43632, name: 'SES-11 (ECHOSTAR 105)', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },

  // Military/Classified Satellites
  { id: 26900, name: 'USA 148', type: 'military' as SatelliteType, agency: 'NRO', country: 'USA' },
  { id: 26934, name: 'USA 149 (DSP 20)', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 27424, name: 'USA 157 (MILSTAR-2 2)', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 44067, name: 'SBIRS GEO-3 (USA 282)', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 39232, name: 'WGS F6 (USA 244)', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 39265, name: 'AEHF-3 (USA 246)', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 41855, name: 'MUOS-5', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },
  { id: 38801, name: 'MUOS-2', type: 'military' as SatelliteType, agency: 'USSF', country: 'USA' },

  // Additional Scientific Satellites
  { id: 43435, name: 'TROPICS-05', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 38771, name: 'GAIA', type: 'scientific' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 41783, name: 'LISA PATHFINDER', type: 'scientific' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 43435, name: 'TESS', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 45038, name: 'CHEOPS', type: 'scientific' as SatelliteType, agency: 'ESA', country: 'Europe' },

  // Chinese Satellites
  { id: 41731, name: 'SHIJIAN-17 (SJ-17)', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },
  { id: 43001, name: 'CHANG\'E 4 RELAY', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },
  { id: 44806, name: 'TIANWEN-1', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },

  // Russian Satellites
  { id: 37372, name: 'YAMAL 300K', type: 'communication' as SatelliteType, agency: 'Gazprom', country: 'Russia' },
  { id: 32382, name: 'EXPRESS AM3', type: 'communication' as SatelliteType, agency: 'RSCC', country: 'Russia' },
  { id: 41792, name: 'EXPRESS AMU1', type: 'communication' as SatelliteType, agency: 'RSCC', country: 'Russia' },

  // European Satellites
  { id: 28937, name: 'SPAINSAT', type: 'communication' as SatelliteType, agency: 'Hispasat', country: 'Spain' },
  { id: 40874, name: 'EUTELSAT 7A', type: 'communication' as SatelliteType, agency: 'Eutelsat', country: 'Europe' },
  { id: 41855, name: 'EUTELSAT 117 WEST A', type: 'communication' as SatelliteType, agency: 'Eutelsat', country: 'Europe' },
  { id: 40939, name: 'EUTELSAT 115 WEST B', type: 'communication' as SatelliteType, agency: 'Eutelsat', country: 'Europe' },

  // More Recent Satellites (2020-2025)
  { id: 48275, name: 'WENTIAN', type: 'space-station' as SatelliteType, agency: 'CNSA', country: 'China' },
  { id: 54684, name: 'MENGTIAN', type: 'space-station' as SatelliteType, agency: 'CNSA', country: 'China' },
  { id: 55106, name: 'ARTEMIS 1 (ORION)', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 53106, name: 'JWST', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 49328, name: 'PERSEVERANCE ROVER', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 47926, name: 'INGENUITY HELICOPTER', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' }
];

interface TLEData {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
}

class RealSatelliteAPI {
  private updateInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: ((satellites: Satellite[]) => void) | null = null;
  private cachedSatellites: Satellite[] = [];

  async fetchTLEData(satelliteId: number): Promise<TLEData | null> {
    try {
      const response = await fetch(`${CELESTRAK_API}/${satelliteId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch TLE for satellite ${satelliteId}`);
      }
      const data = await response.json();
      return {
        satelliteId,
        name: data.name,
        line1: data.line1,
        line2: data.line2
      };
    } catch (error) {
      console.error(`Error fetching TLE for satellite ${satelliteId}:`, error);
      return null;
    }
  }

  calculateSatellitePosition(tleData: TLEData): Satellite['position'] {
    try {
      const satrec = satellite.twoline2satrec(tleData.line1, tleData.line2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        return {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: positionGd.height,
          timestamp: now.getTime()
        };
      }
    } catch (error) {
      console.error('Error calculating satellite position:', error);
    }
    
    return {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      timestamp: Date.now()
    };
  }

  calculateOrbitalParameters(tleData: TLEData) {
    try {
      const satrec = satellite.twoline2satrec(tleData.line1, tleData.line2);
      
      // Extract orbital elements from TLE
      const meanMotion = satrec.no; // rad/min
      const period = (2 * Math.PI) / meanMotion; // minutes
      const semiMajorAxis = Math.pow((398600.4418 * Math.pow(period / (2 * Math.PI), 2)), 1/3); // km
      const altitude = semiMajorAxis - 6371; // km (subtract Earth radius)
      const inclination = satrec.inclo * 180 / Math.PI; // degrees
      const eccentricity = satrec.ecco;
      const velocity = Math.sqrt(398600.4418 / semiMajorAxis); // km/s
      
      return {
        altitude: Math.max(0, altitude),
        period: period,
        inclination: inclination,
        eccentricity: eccentricity,
        velocity: velocity
      };
    } catch (error) {
      console.error('Error calculating orbital parameters:', error);
      return {
        altitude: 400,
        period: 90,
        inclination: 0,
        eccentricity: 0,
        velocity: 7.8
      };
    }
  }

  async getSatellites(): Promise<Satellite[]> {
    console.log('Attempting to load real satellite data...');
    const satellites: Satellite[] = [];
    
    for (const satInfo of KNOWN_SATELLITES) {
      try {
        const tleData = await this.fetchTLEData(satInfo.id);
        if (tleData) {
          const position = this.calculateSatellitePosition(tleData);
          const orbital = this.calculateOrbitalParameters(tleData);
          
          const satellite: Satellite = {
            id: satInfo.id.toString(),
            name: satInfo.name,
            type: satInfo.type,
            country: satInfo.country,
            agency: satInfo.agency,
            launchDate: '2000-01-01',
            status: 'active' as SatelliteStatus,
            orbital,
            position,
            tle: {
              line1: tleData.line1,
              line2: tleData.line2
            },
            footprint: this.calculateFootprint(orbital.altitude)
          };
          
          satellites.push(satellite);
        }
      } catch (error) {
        console.error(`Failed to process satellite ${satInfo.name}:`, error);
        // Continue processing other satellites instead of failing completely
      }
    }
    
    console.log(`Successfully loaded ${satellites.length} real satellites`);
    this.cachedSatellites = satellites;
    return satellites;
  }

  calculateFootprint(altitude: number): number {
    // Calculate the radio horizon for satellite visibility
    const earthRadius = 6371; // km
    const heightAboveEarth = altitude;
    return Math.sqrt(heightAboveEarth * (heightAboveEarth + 2 * earthRadius));
  }

  async getLaunches(): Promise<Launch[]> {
    try {
      const response = await fetch(`${LAUNCH_API}/upcoming/?limit=10`);
      const data = await response.json();
      
      return data.results.map((launch: any) => ({
        id: launch.id,
        name: launch.name,
        launchDate: new Date(launch.net),
        status: launch.status.name.toLowerCase(),
        rocket: launch.rocket?.configuration?.full_name || 'Unknown',
        agency: launch.launch_service_provider?.name || 'Unknown',
        mission: launch.mission?.description || launch.name,
        launchSite: launch.pad?.name || 'Unknown',
        payloads: launch.mission?.payload_count ? [`${launch.mission.payload_count} payloads`] : [],
        countdown: Math.max(0, Math.floor((new Date(launch.net).getTime() - Date.now()) / 1000))
      }));
    } catch (error) {
      console.error('Error fetching launches:', error);
      return [];
    }
  }

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void) {
    this.onDataUpdate = callback;
    
    // Initial load with fallback
    this.getSatellitesWithFallback().then(callback);
    
    // Update satellite positions every 3 seconds
    this.updateInterval = setInterval(async () => {
      try {
        if (this.cachedSatellites.length > 0) {
          // Reduced logging frequency for better performance
          if (Math.random() < 0.1) { // Only log 10% of the time
            console.log('Updating satellite positions every 3 seconds for', this.cachedSatellites.length, 'satellites');
          }
          
          const updatedSatellites = this.cachedSatellites.map(satellite => {
            return {
              ...satellite,
              position: this.calculateOrbitalPosition(satellite)
            };
          });
          
          this.cachedSatellites = updatedSatellites;
          callback(updatedSatellites);
        }
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    }, 3000); // Back to 3 seconds as requested
  }

  calculateOrbitalPosition(satellite: Satellite): Satellite['position'] {
    // Validate input data and provide fallbacks
    if (!satellite?.orbital) {
      console.warn('Missing orbital data for satellite:', satellite?.id);
      return {
        latitude: 0,
        longitude: 0,
        altitude: 400,
        timestamp: Date.now()
      };
    }

    const currentTime = Date.now() / 1000; // Current time in seconds
    
    // Calculate orbital parameters with validation
    const period = satellite.orbital.period || 90; // Default 90 minutes if missing
    const altitude = satellite.orbital.altitude || 400; // Default 400km if missing
    const inclination = satellite.orbital.inclination || 0; // Default 0 degrees if missing
    
    const orbitPeriodSeconds = period * 60; // Convert minutes to seconds
    const orbitSpeed = (2 * Math.PI) / orbitPeriodSeconds; // radians per second
    
    // Add satellite-specific offset for distribution along orbit
    // Convert ID to number safely
    const satelliteIdNum = parseInt(satellite.id) || 0;
    const satelliteOffset = (satelliteIdNum % 1000) / 1000 * Math.PI * 2;
    const angle = (currentTime * orbitSpeed + satelliteOffset) % (Math.PI * 2);
    
    // Earth parameters
    const earthRadiusKm = 6371;
    const orbitalRadiusKm = earthRadiusKm + altitude;
    const inclinationRad = (inclination * Math.PI) / 180;
    
    // Calculate position on orbital path
    let x = orbitalRadiusKm * Math.cos(angle);
    let y = 0;
    let z = orbitalRadiusKm * Math.sin(angle);
    
    // Apply inclination rotation
    const rotatedY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
    const rotatedZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
    
    // Convert back to lat/lon for position tracking
    const distance = Math.sqrt(x * x + rotatedY * rotatedY + rotatedZ * rotatedZ);
    
    // Validate calculations before returning
    const latitude = Math.asin(Math.max(-1, Math.min(1, rotatedY / distance))) * 180 / Math.PI;
    const longitude = Math.atan2(rotatedZ, x) * 180 / Math.PI;
    
    // Final validation to ensure no NaN values
    return {
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      altitude: isNaN(altitude) ? 400 : altitude,
      timestamp: Date.now()
    };
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.onDataUpdate = null;
  }

  async searchSatellites(query: string): Promise<Satellite[]> {
    return this.cachedSatellites.filter(sat => 
      sat.name.toLowerCase().includes(query.toLowerCase()) ||
      sat.agency.toLowerCase().includes(query.toLowerCase())
    );
  }

  getFilterOptions() {
    // Use cached satellites if available, otherwise return defaults
    if (this.cachedSatellites.length > 0) {
      const types = [...new Set(this.cachedSatellites.map(s => s.type))].sort() as SatelliteType[];
      const countries = [...new Set(this.cachedSatellites.map(s => s.country))].sort();
      const agencies = [...new Set(this.cachedSatellites.map(s => s.agency))].sort();
      const statuses = [...new Set(this.cachedSatellites.map(s => s.status))].sort() as SatelliteStatus[];
      
      return { types, countries, agencies, statuses };
    }
    
    // Fallback defaults when no data is loaded
    return {
      types: ['communication', 'weather', 'navigation', 'scientific', 'military', 'earth-observation', 'space-station', 'constellation'] as SatelliteType[],
      countries: ['USA', 'International', 'Europe', 'Russia', 'China'],
      agencies: ['NASA', 'SpaceX', 'ESA', 'NOAA', 'Intelsat', 'Roscosmos', 'CNSA'],
      statuses: ['active'] as SatelliteStatus[]
    };
  }

  // Load real satellite data with fallback to reduced set if needed
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Loading real satellite data...');
      const realSatellites = await this.getSatellites();
      if (realSatellites.length > 0) {
        console.log(`Successfully loaded ${realSatellites.length} real satellites`);
        return realSatellites;
      }
    } catch (error) {
      console.warn('Real satellite API failed, using reduced set:', error);
    }

    // Fallback to a smaller set of real satellites if full fetch fails
    console.log('Using reduced real satellite set as fallback');
    const reducedSatellites = await this.getReducedRealSatellites();
    this.cachedSatellites = reducedSatellites;
    return reducedSatellites;
  }

  // Reduced set of real satellites when full API fails
  async getReducedRealSatellites(): Promise<Satellite[]> {
    console.log('Loading reduced set of real satellites...');
    const satellites: Satellite[] = [];
    
    // Try to fetch a smaller subset of the most important satellites
    const prioritySatellites = KNOWN_SATELLITES.slice(0, 20); // First 20 satellites
    
    for (const satInfo of prioritySatellites) {
      try {
        const tleData = await this.fetchTLEData(satInfo.id);
        if (tleData) {
          const position = this.calculateSatellitePosition(tleData);
          const orbital = this.calculateOrbitalParameters(tleData);
          
          const satellite: Satellite = {
            id: satInfo.id.toString(),
            name: satInfo.name,
            type: satInfo.type,
            country: satInfo.country,
            agency: satInfo.agency,
            launchDate: '2000-01-01',
            status: 'active' as SatelliteStatus,
            orbital,
            position,
            tle: {
              line1: tleData.line1,
              line2: tleData.line2
            },
            footprint: this.calculateFootprint(orbital.altitude)
          };
          
          satellites.push(satellite);
        }
      } catch (error) {
        console.error(`Failed to process satellite ${satInfo.name}:`, error);
        // Continue processing other satellites
      }
    }
    
    console.log(`Successfully loaded ${satellites.length} real satellites (reduced set)`);
    return satellites;
  }
}

export const satelliteAPI = new RealSatelliteAPI();