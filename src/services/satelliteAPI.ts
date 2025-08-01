import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Real satellite data from public APIs
const CELESTRAK_API = 'https://tle.ivanstanojevic.me/api/tle';
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Real satellite NORAD IDs - ONLY satellites that have been verified to work from network requests
const KNOWN_SATELLITES = [
  // Space Stations (verified working from network logs)
  { id: 25544, name: 'ISS (ZARYA)', type: 'space-station' as SatelliteType, agency: 'NASA/Roscosmos', country: 'International' },
  { id: 48274, name: 'CSS (TIANHE)', type: 'space-station' as SatelliteType, agency: 'CNSA', country: 'China' },
  
  // Weather Satellites (verified working from network logs)
  { id: 41866, name: 'GOES 16', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43226, name: 'GOES 17', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 51850, name: 'GOES 18', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 40732, name: 'METEOSAT-11 (MSG-4)', type: 'weather' as SatelliteType, agency: 'EUMETSAT', country: 'Europe' },
  { id: 36411, name: 'EWS-G2 (GOES 15)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },

  // Communication Satellites (verified working from network logs)
  { id: 42432, name: 'SES-10', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 43175, name: 'SES-14', type: 'communication' as SatelliteType, agency: 'SES', country: 'Europe' },
  { id: 44476, name: 'INTELSAT 39 (IS-39)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41748, name: 'INTELSAT 33E (IS-33E)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 40874, name: 'INTELSAT 34 (IS-34)', type: 'communication' as SatelliteType, agency: 'Intelsat', country: 'International' },
  { id: 41552, name: 'THAICOM 8', type: 'communication' as SatelliteType, agency: 'Thaicom', country: 'Thailand' },

  // GPS Navigation (verified working from network logs)
  { id: 40730, name: 'GPS BIIF-10', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 43873, name: 'GPS BIII-1', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 46826, name: 'GPS BIII-4', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },
  { id: 48859, name: 'GPS BIII-5 (PRN 11)', type: 'navigation' as SatelliteType, agency: 'US Space Force', country: 'USA' },

  // Galileo Navigation (verified working from network logs)  
  { id: 37846, name: 'GSAT0101 (GALILEO-PFM)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 37847, name: 'GSAT0102 (GALILEO-FM2)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40128, name: 'GSAT0201 (GALILEO 5)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 40129, name: 'GSAT0202 (GALILEO 6)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 43564, name: 'GSAT0221 (GALILEO 25)', type: 'navigation' as SatelliteType, agency: 'ESA', country: 'Europe' },

  // Earth Observation (verified working from network logs)
  { id: 25994, name: 'TERRA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 27424, name: 'AQUA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 40697, name: 'SENTINEL-2A', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 42063, name: 'SENTINEL-2B', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 39084, name: 'LANDSAT 8', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 43013, name: 'NOAA 20 (JPSS-1)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 43613, name: 'ICESAT-2', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 28376, name: 'AURA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },

  // Scientific Satellites (verified working from network logs)
  { id: 40482, name: 'MMS 1', type: 'scientific' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 30942, name: 'FENGYUN 1C DEB', type: 'scientific' as SatelliteType, agency: 'CNSA', country: 'China' },

  // Starlink Constellation (verified working from network logs)
  { id: 44713, name: 'STARLINK-1007', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 44714, name: 'STARLINK-1008', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 47964, name: 'SMOG-1', type: 'constellation' as SatelliteType, agency: 'BME', country: 'Hungary' },

  // Additional verified satellites
  { id: 45439, name: 'ONEWEB-0096', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' },
  { id: 45438, name: 'ONEWEB-0085', type: 'constellation' as SatelliteType, agency: 'OneWeb', country: 'UK' }
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
    console.log(`Total satellites to process: ${KNOWN_SATELLITES.length}`);
    const satellites: Satellite[] = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const satInfo of KNOWN_SATELLITES) {
      try {
        console.log(`Processing satellite ${successCount + failCount + 1}/${KNOWN_SATELLITES.length}: ${satInfo.name} (ID: ${satInfo.id})`);
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
          successCount++;
          console.log(`✅ Successfully loaded: ${satInfo.name}`);
        } else {
          failCount++;
          console.log(`❌ Failed to load: ${satInfo.name} (no TLE data)`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to process satellite ${satInfo.name}:`, error);
        // Continue processing other satellites instead of failing completely
      }
    }
    
    console.log(`🎯 Final Results: ${successCount} successful, ${failCount} failed, ${satellites.length} total loaded`);
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

  // Load all real satellite data - no more fallback restrictions
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    console.log('Loading all verified satellite data...');
    console.log(`Attempting to load ${KNOWN_SATELLITES.length} satellites`);
    
    const realSatellites = await this.getSatellites();
    console.log(`Successfully loaded ${realSatellites.length} satellites out of ${KNOWN_SATELLITES.length} attempted`);
    
    return realSatellites;
  }
}

export const satelliteAPI = new RealSatelliteAPI();