import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Real satellite data from public APIs
const CELESTRAK_API = 'https://tle.ivanstanojevic.me/api/tle';
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
            launchDate: '2000-01-01', // Would need additional API for launch dates
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
      }
    }
    
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
    
    // Initial load
    this.getSatellites().then(callback);
    
    // Update satellite positions every 30 seconds (real tracking rate)
    this.updateInterval = setInterval(async () => {
      try {
        const updatedSatellites = await Promise.all(
          this.cachedSatellites.map(async (sat) => {
            const tleData = {
              satelliteId: parseInt(sat.id),
              name: sat.name,
              line1: sat.tle.line1,
              line2: sat.tle.line2
            };
            
            const newPosition = this.calculateSatellitePosition(tleData);
            return {
              ...sat,
              position: newPosition
            };
          })
        );
        
        callback(updatedSatellites);
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
    return this.getMockSatellites();
  }

  getMockSatellites(): Satellite[] {
    return [
      {
        id: '25544',
        name: 'ISS (ZARYA)',
        type: 'space-station',
        country: 'International',
        agency: 'NASA/Roscosmos',
        launchDate: '1998-11-20',
        status: 'active',
        orbital: {
          altitude: 408,
          period: 92.68,
          inclination: 51.6,
          eccentricity: 0.0001,
          velocity: 7.66
        },
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          altitude: 408,
          timestamp: Date.now()
        },
        tle: {
          line1: '1 25544U 98067A   23001.00000000  .00001742  00000-0  37350-4 0  9990',
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
          altitude: 550,
          period: 95.4,
          inclination: 53.0,
          eccentricity: 0.0001,
          velocity: 7.57
        },
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          altitude: 550,
          timestamp: Date.now()
        },
        tle: {
          line1: '1 44713U 19074A   23001.00000000  .00001345  00000-0  10270-3 0  9991',
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
          altitude: 20200,
          period: 717.97,
          inclination: 55.0,
          eccentricity: 0.0048,
          velocity: 3.87
        },
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          altitude: 20200,
          timestamp: Date.now()
        },
        tle: {
          line1: '1 24876U 97035A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
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
          altitude: 705,
          period: 98.8,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          altitude: 705,
          timestamp: Date.now()
        },
        tle: {
          line1: '1 25994U 99068A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
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
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180,
          altitude: 35786,
          timestamp: Date.now()
        },
        tle: {
          line1: '1 41866U 16071A   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 41866   0.0567 123.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      }
    ];
  }
}

export const satelliteAPI = new RealSatelliteAPI();