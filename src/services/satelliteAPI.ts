import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Real satellite data from public APIs
const CELESTRAK_API = 'https://tle.ivanstanojevic.me/api/tle';
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Real satellite NORAD IDs - expanded list with GEO and higher orbit satellites
const KNOWN_SATELLITES = [
  // Space Stations
  { id: 25544, name: 'ISS (ZARYA)', type: 'space-station' as SatelliteType, agency: 'NASA/Roscosmos', country: 'International' },
  { id: 48274, name: 'TIANHE', type: 'space-station' as SatelliteType, agency: 'CNSA', country: 'China' },
  
  // Geostationary Weather Satellites
  { id: 41866, name: 'GOES-16', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43226, name: 'GOES-17', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 51850, name: 'GOES-18', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 41552, name: 'METEOSAT-11', type: 'weather' as SatelliteType, agency: 'EUMETSAT', country: 'Europe' },
  { id: 43691, name: 'METEOSAT-12', type: 'weather' as SatelliteType, agency: 'EUMETSAT', country: 'Europe' },
  { id: 40732, name: 'HIMAWARI-9', type: 'weather' as SatelliteType, agency: 'JMA', country: 'Japan' },
  
  // Geostationary Communication Satellites
  { id: 48859, name: 'INTELSAT 40E', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 43748, name: 'INTELSAT 38', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41748, name: 'INTELSAT 36', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 43564, name: 'INTELSAT 37E', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41930, name: 'EUTELSAT 117 WEST B', type: 'communication' as SatelliteType, agency: 'Eutelsat', country: 'Europe' },
  { id: 43613, name: 'EUTELSAT 172B', type: 'communication' as SatelliteType, agency: 'Eutelsat', country: 'Europe' },
  { id: 40874, name: 'ASTRA 2G', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 42432, name: 'SES-15', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 43175, name: 'SES-14', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 44476, name: 'SES-12', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  
  // GPS Constellation (MEO ~20,200 km)
  { id: 29601, name: 'GPS BIIR-2 (PRN 13)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 32260, name: 'GPS BIIR-8 (PRN 31)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 40730, name: 'GPS III SV01', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 43873, name: 'GPS III SV02', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 46826, name: 'GPS III SV03', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  
  // Galileo Navigation (MEO ~23,222 km)
  { id: 37846, name: 'GALILEO-FOC FM1', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 37847, name: 'GALILEO-FOC FM2', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40128, name: 'GALILEO-FOC FM3', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40129, name: 'GALILEO-FOC FM4', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  
  // High-altitude Scientific Satellites
  { id: 28376, name: 'CLUSTER II-FM5', type: 'scientific' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 28377, name: 'CLUSTER II-FM6', type: 'scientific' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 30942, name: 'MMS 1', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 40482, name: 'MMS 2', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 36411, name: 'CHANG\'E 5-T1', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },
  
  // Starlink Constellation (LEO)
  { id: 44713, name: 'STARLINK-1019', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 44714, name: 'STARLINK-1021', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 46539, name: 'STARLINK-1600', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 47964, name: 'STARLINK-2182', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 48274, name: 'STARLINK-2305', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  
  // Earth Observation
  { id: 25994, name: 'TERRA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 27424, name: 'AQUA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 40697, name: 'SENTINEL-2A', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 42063, name: 'SENTINEL-2B', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 39084, name: 'NOAA-20 (JPSS-1)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43013, name: 'NOAA-21 (JPSS-2)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' }
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