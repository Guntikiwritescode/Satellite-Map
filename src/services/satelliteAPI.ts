import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Alternative satellite data APIs
const CELESTRAK_API = 'https://celestrak.org/NORAD/elements/gp.php';
const CELESTRAK_GROUPS = {
  stations: 'stations',
  visual: 'visual', 
  active: 'active'
};
const N2YO_API = 'https://api.n2yo.com/rest/v1/satellite';
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Well-known satellite NORAD IDs
const KNOWN_SATELLITES = [
  { id: 25544, name: 'ISS (ZARYA)', type: 'space-station' as SatelliteType, agency: 'NASA/Roscosmos', country: 'International' },
  { id: 44713, name: 'STARLINK-1019', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 44714, name: 'STARLINK-1021', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 29601, name: 'GPS BIIR-2 (PRN 13)', type: 'navigation' as SatelliteType, agency: 'US Air Force', country: 'USA' },
  { id: 25994, name: 'TERRA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 41866, name: 'GOES-16', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 40697, name: 'SENTINEL-2A', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 43013, name: 'STARLINK-1130', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 27424, name: 'AQUA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 39084, name: 'NOAA-20 (JPSS-1)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' }
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

  async fetchCelestrakData(group: string = 'stations'): Promise<any[]> {
    try {
      const response = await fetch(`${CELESTRAK_API}?GROUP=${group}&FORMAT=json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from CelesTrak: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched ${data.length} satellites from CelesTrak ${group} group`);
      return data;
    } catch (error) {
      console.error(`Error fetching CelesTrak ${group} data:`, error);
      return [];
    }
  }

  calculateSatellitePosition(tleData: any): Satellite['position'] {
    try {
      const satrec = satellite.twoline2satrec(tleData.TLE_LINE1, tleData.TLE_LINE2);
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

  calculateOrbitalParameters(tleData: any) {
    try {
      const satrec = satellite.twoline2satrec(tleData.TLE_LINE1, tleData.TLE_LINE2);
      
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
    console.log('Attempting to load real satellite data from CelesTrak...');
    const satellites: Satellite[] = [];
    
    try {
      // Fetch from multiple CelesTrak groups for variety
      const [stationsData, visualData] = await Promise.all([
        this.fetchCelestrakData('stations'),
        this.fetchCelestrakData('visual')
      ]);
      
      const allSatelliteData = [...stationsData.slice(0, 5), ...visualData.slice(0, 10)];
      
      for (const satData of allSatelliteData) {
        try {
          const position = this.calculateSatellitePosition(satData);
          const orbital = this.calculateOrbitalParameters(satData);
          
          // Determine satellite type based on name and data
          const satType = this.determineSatelliteType(satData.OBJECT_NAME || satData.COMMON_NAME);
          
          const satellite: Satellite = {
            id: satData.NORAD_CAT_ID.toString(),
            name: satData.OBJECT_NAME || satData.COMMON_NAME,
            type: satType,
            country: this.determineCountry(satData.OBJECT_NAME || satData.COMMON_NAME),
            agency: this.determineAgency(satData.OBJECT_NAME || satData.COMMON_NAME),
            launchDate: satData.LAUNCH_DATE || '2000-01-01',
            status: 'active' as SatelliteStatus,
            orbital,
            position,
            tle: {
              line1: satData.TLE_LINE1,
              line2: satData.TLE_LINE2
            },
            footprint: this.calculateFootprint(orbital.altitude)
          };
          
          satellites.push(satellite);
        } catch (error) {
          console.error(`Failed to process satellite ${satData.OBJECT_NAME}:`, error);
        }
      }
      
      console.log(`Successfully loaded ${satellites.length} real satellites from CelesTrak`);
      this.cachedSatellites = satellites;
      return satellites;
    } catch (error) {
      console.error('Error fetching from CelesTrak:', error);
      return [];
    }
  }

  determineSatelliteType(name: string): SatelliteType {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('ISS') || nameUpper.includes('STATION')) return 'space-station';
    if (nameUpper.includes('STARLINK') || nameUpper.includes('ONEWEB')) return 'constellation';
    if (nameUpper.includes('GPS') || nameUpper.includes('GLONASS') || nameUpper.includes('GALILEO')) return 'navigation';
    if (nameUpper.includes('GOES') || nameUpper.includes('NOAA') || nameUpper.includes('METOP')) return 'weather';
    if (nameUpper.includes('LANDSAT') || nameUpper.includes('TERRA') || nameUpper.includes('AQUA') || nameUpper.includes('SENTINEL')) return 'earth-observation';
    if (nameUpper.includes('INTELSAT') || nameUpper.includes('EUTELSAT')) return 'communication';
    return 'earth-observation'; // default
  }

  determineCountry(name: string): string {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('ISS')) return 'International';
    if (nameUpper.includes('STARLINK') || nameUpper.includes('GPS') || nameUpper.includes('GOES') || nameUpper.includes('NOAA') || nameUpper.includes('LANDSAT')) return 'USA';
    if (nameUpper.includes('SENTINEL') || nameUpper.includes('METOP')) return 'Europe';
    if (nameUpper.includes('GLONASS')) return 'Russia';
    if (nameUpper.includes('BEIDOU')) return 'China';
    return 'International';
  }

  determineAgency(name: string): string {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('ISS')) return 'NASA/Roscosmos';
    if (nameUpper.includes('STARLINK')) return 'SpaceX';
    if (nameUpper.includes('GPS')) return 'US Air Force';
    if (nameUpper.includes('GOES') || nameUpper.includes('NOAA')) return 'NOAA';
    if (nameUpper.includes('LANDSAT')) return 'NASA/USGS';
    if (nameUpper.includes('SENTINEL') || nameUpper.includes('METOP')) return 'ESA';
    if (nameUpper.includes('TERRA') || nameUpper.includes('AQUA')) return 'NASA';
    return 'Various';
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
    
    // Update satellite positions every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        if (this.cachedSatellites.length > 0) {
          console.log('Updating positions for', this.cachedSatellites.length, 'satellites');
          
          // For mock satellites, simulate movement
          const updatedSatellites = this.cachedSatellites.map(satellite => {
            const time = Date.now() / 1000;
            const orbitSpeed = 0.1; // degrees per second
            const baseOffset = parseInt(satellite.id) / 10000; // Use satellite ID for offset
            
            return {
              ...satellite,
              position: {
                ...satellite.position,
                latitude: Math.sin(time * orbitSpeed + baseOffset) * 60,
                longitude: ((time * orbitSpeed + baseOffset * 45) % 360) - 180,
                timestamp: Date.now()
              }
            };
          });
          
          callback(updatedSatellites);
        }
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    }, 30000); // 30 seconds
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
      types: ['space-station', 'constellation', 'navigation', 'weather', 'earth-observation'] as SatelliteType[],
      countries: ['USA', 'International', 'Europe'],
      agencies: ['NASA', 'SpaceX', 'ESA', 'NOAA'],
      statuses: ['active'] as SatelliteStatus[]
    };
  }

  // Fallback to mock data if real API fails
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Attempting to load real satellite data...');
      const realSatellites = await this.getSatellites();
      if (realSatellites.length > 0) {
        console.log('Successfully loaded real satellite data:', realSatellites.length);
        return realSatellites;
      }
    } catch (error) {
      console.warn('Real satellite API failed, using mock data:', error);
    }
    
    // Fallback to mock data
    console.log('Using mock satellite data as fallback');
    const mockSatellites = this.getMockSatellites();
    this.cachedSatellites = mockSatellites; // Cache the mock data
    return mockSatellites;
  }

  getMockSatellites(): Satellite[] {
    console.log('Generating realistic mock satellite data with proper orbital parameters...');
    
    // Generate realistic moving positions for mock satellites
    const generatePosition = (baseLatOffset: number, baseLonOffset: number) => {
      const time = Date.now() / 1000;
      const orbitSpeed = 0.05; // Much slower, more realistic
      
      return {
        latitude: Math.sin(time * orbitSpeed + baseLatOffset) * 60, // ±60 degrees
        longitude: ((time * orbitSpeed + baseLonOffset) % 360) - 180, // -180 to +180
        altitude: 0, // This will be overridden by orbital.altitude
        timestamp: Date.now()
      };
    };
    
    const mockSatellites: Satellite[] = [
      {
        id: '25544',
        name: 'ISS (ZARYA)',
        type: 'space-station',
        country: 'International',
        agency: 'NASA/Roscosmos',
        launchDate: '1998-11-20',
        status: 'active',
        orbital: {
          altitude: 408, // Realistic ISS altitude
          period: 92.68, // Realistic ISS period
          inclination: 51.6, // Realistic ISS inclination
          eccentricity: 0.0001,
          velocity: 7.66
        },
        position: generatePosition(0, 0),
        tle: {
          line1: '1 25544U 98067A   25213.00000000  .00001742  00000-0  37350-4 0  9990',
          line2: '2 25544  51.6393 339.2928 0001897  95.8340 264.3200 15.49299371367649'
        },
        footprint: 4500
      },
      {
        id: '44713',
        name: 'STARLINK-1019',
        type: 'constellation',
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2019-05-24',
        status: 'active',
        orbital: {
          altitude: 550, // Realistic Starlink altitude
          period: 95.4,
          inclination: 53.0, // Realistic Starlink inclination
          eccentricity: 0.0001,
          velocity: 7.57
        },
        position: generatePosition(1, 60),
        tle: {
          line1: '1 44713U 19074A   25213.00000000  .00001345  00000-0  10270-3 0  9991',
          line2: '2 44713  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234'
        },
        footprint: 1000
      },
      {
        id: '29601',
        name: 'GPS BIIR-2 (PRN 13)',
        type: 'navigation',
        country: 'USA',
        agency: 'US Air Force',
        launchDate: '1997-07-23',
        status: 'active',
        orbital: {
          altitude: 20200, // Realistic GPS altitude
          period: 717.97, // 12 hour orbit
          inclination: 55.0, // Realistic GPS inclination
          eccentricity: 0.0048,
          velocity: 3.87
        },
        position: generatePosition(2, 120),
        tle: {
          line1: '1 24876U 97035A   25213.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 24876  54.9988 123.4567 0048123  45.6789 314.5678  2.00564321123456'
        },
        footprint: 12000
      },
      {
        id: '25994',
        name: 'TERRA',
        type: 'earth-observation',
        country: 'USA',
        agency: 'NASA',
        launchDate: '1999-12-18',
        status: 'active',
        orbital: {
          altitude: 705, // Realistic Terra altitude  
          period: 98.8,
          inclination: 98.2, // Sun-synchronous polar orbit
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: generatePosition(3, 180),
        tle: {
          line1: '1 25994U 99068A   25213.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 25994  98.2123  45.6789 0001234  87.6543 272.3456 14.57123456789012'
        },
        footprint: 2800
      },
      {
        id: '41866',
        name: 'GOES-16',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2016-11-19',
        status: 'active',
        orbital: {
          altitude: 35786, // Geostationary altitude
          period: 1436.1, // 24 hour period
          inclination: 0.1, // Nearly equatorial
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(0.1, 240), // Nearly equatorial
        tle: {
          line1: '1 41866U 16071A   25213.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 41866   0.0567 123.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },
      // Add more realistic satellites...
      {
        id: '43070',
        name: 'GOES-17',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2018-03-01',
        status: 'active',
        orbital: {
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(0.1, 300),
        tle: {
          line1: '1 43070U 18016A   25213.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 43070   0.0567 123.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },
      {
        id: '48274',
        name: 'STARLINK-3401',
        type: 'constellation',
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2021-05-04',
        status: 'active',
        orbital: {
          altitude: 550,
          period: 95.4,
          inclination: 53.0,
          eccentricity: 0.0001,
          velocity: 7.57
        },
        position: generatePosition(1.5, 30),
        tle: {
          line1: '1 48274U 21036A   25213.00000000  .00001345  00000-0  10270-3 0  9991',
          line2: '2 48274  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234'
        },
        footprint: 1000
      }
    ];
    
    console.log(`Generated ${mockSatellites.length} realistic mock satellites`);
    return mockSatellites;
  }
}

export const satelliteAPI = new RealSatelliteAPI();