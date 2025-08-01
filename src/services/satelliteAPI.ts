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
    const types = [...new Set(this.cachedSatellites.map(s => s.type))].sort() as SatelliteType[];
    const countries = [...new Set(this.cachedSatellites.map(s => s.country))].sort();
    const agencies = [...new Set(this.cachedSatellites.map(s => s.agency))].sort();
    const statuses = [...new Set(this.cachedSatellites.map(s => s.status))].sort() as SatelliteStatus[];
    
    return { types, countries, agencies, statuses };
  }
}

export const satelliteAPI = new RealSatelliteAPI();