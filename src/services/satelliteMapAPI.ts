import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// SatelliteMap.space inspired API - Using Celestrak data with enhanced tracking
// This provides accurate LEO satellite tracking with real-time position calculation

interface SatelliteMapData {
  noradId: number;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  tle1: string;
  tle2: string;
  epoch: string;
  period: number;
  inclination: number;
  eccentricity: number;
  perigee: number;
  apogee: number;
  constellation?: string;
  country?: string;
  type: SatelliteType;
  status: SatelliteStatus;
}

// Focus on LEO satellites for accurate tracking like satellitemap.space
const LEO_SATELLITE_SOURCES = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', // Space stations
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json&LIMIT=1000', // Starlink LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json', // OneWeb LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=planet&FORMAT=json', // Planet Labs LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=spire&FORMAT=json', // Spire Global LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=swarm&FORMAT=json', // Swarm Technologies LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=doves&FORMAT=json', // Dove satellites LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=json', // Iridium NEXT LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=json', // Globalstar LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=json', // ORBCOMM LEO
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json&LIMIT=2000', // Active satellites
];

// CelesTrak satellite data interface
interface CelestrakSatellite {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  SEMIMAJOR_AXIS?: number;
  PERIOD?: number;
  APOAPSIS?: number;
  PERIAPSIS?: number;
  OBJECT_TYPE?: string;
  RCS_SIZE?: string;
  COUNTRY_CODE?: string;
  LAUNCH_DATE?: string;
  SITE?: string;
  DECAY_DATE?: string;
  FILE?: number;
  GP_ID?: number;
  TLE_LINE0?: string;
  TLE_LINE1?: string;
  TLE_LINE2?: string;
}

class SatelliteMapAPI {
  private updateInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: ((satellites: Satellite[]) => void) | null = null;
  private cachedSatellites: Map<number, SatelliteMapData> = new Map();
  private lastUpdateTime: number = 0;
  
  // Calculate accurate position using satellite.js library
  private calculatePosition(tle1: string, tle2: string): {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    heading: number;
  } {
    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean' &&
          positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
        
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        // Calculate velocity magnitude
        const velocity = Math.sqrt(
          velocityEci.x * velocityEci.x + 
          velocityEci.y * velocityEci.y + 
          velocityEci.z * velocityEci.z
        );
        
        // Calculate heading (simplified)
        const heading = Math.atan2(velocityEci.y, velocityEci.x) * 180 / Math.PI;
        
        return {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: positionGd.height,
          velocity: velocity,
          heading: (heading + 360) % 360
        };
      }
    } catch (error) {
      console.error('Error calculating satellite position:', error);
    }
    
    // Fallback
    return {
      latitude: 0,
      longitude: 0,
      altitude: 400,
      velocity: 7.8,
      heading: 0
    };
  }

  // Determine satellite type based on name and orbital characteristics
  private determineSatelliteType(name: string, altitude: number): SatelliteType {
    const nameUpper = name.toUpperCase();
    
    // Space stations
    if (nameUpper.includes('ISS') || nameUpper.includes('ZARYA') || nameUpper.includes('TIANHE') ||
        nameUpper.includes('TIANGONG') || nameUpper.includes('CSS')) {
      return 'space-station';
    }
    
    // LEO constellations
    if (nameUpper.includes('STARLINK') || nameUpper.includes('ONEWEB') || nameUpper.includes('IRIDIUM') ||
        nameUpper.includes('PLANET') || nameUpper.includes('DOVE') || nameUpper.includes('SPIRE') ||
        nameUpper.includes('SWARM') || nameUpper.includes('GLOBALSTAR') || nameUpper.includes('ORBCOMM')) {
      return 'constellation';
    }
    
    // Navigation satellites (usually MEO)
    if (nameUpper.includes('GPS') || nameUpper.includes('GALILEO') || nameUpper.includes('GLONASS') || 
        nameUpper.includes('BEIDOU') || nameUpper.includes('NAVSTAR')) {
      return 'navigation';
    }
    
    // Earth observation
    if (nameUpper.includes('LANDSAT') || nameUpper.includes('SENTINEL') || nameUpper.includes('TERRA') || 
        nameUpper.includes('AQUA') || nameUpper.includes('MODIS') || nameUpper.includes('WORLDVIEW') ||
        nameUpper.includes('QUICKBIRD') || nameUpper.includes('SPOT')) {
      return 'earth-observation';
    }
    
    // Scientific
    if (nameUpper.includes('HUBBLE') || nameUpper.includes('JWST') || nameUpper.includes('KEPLER') || 
        nameUpper.includes('TESS') || nameUpper.includes('GAIA') || nameUpper.includes('CLUSTER')) {
      return 'scientific';
    }
    
    // Weather
    if (nameUpper.includes('GOES') || nameUpper.includes('METEOSAT') || nameUpper.includes('NOAA') || 
        nameUpper.includes('DMSP') || nameUpper.includes('HIMAWARI') || nameUpper.includes('WEATHER')) {
      return 'weather';
    }
    
    // Communication
    if (nameUpper.includes('INTELSAT') || nameUpper.includes('SES') || nameUpper.includes('EUTELSAT') || 
        nameUpper.includes('ASTRA') || nameUpper.includes('DIRECTV') || nameUpper.includes('ECHOSTAR') ||
        nameUpper.includes('VIASAT') || nameUpper.includes('THAICOM')) {
      return 'communication';
    }
    
    // Military
    if (nameUpper.includes('USA') || nameUpper.includes('NROL') || nameUpper.includes('MILSTAR') || 
        nameUpper.includes('AEHF') || nameUpper.includes('WGS') || nameUpper.includes('SBIRS')) {
      return 'military';
    }
    
    // Default based on altitude for LEO satellites
    if (altitude < 2000) {
      return 'constellation'; // Most LEO satellites are constellation satellites
    }
    
    return 'scientific';
  }

  // Filter for LEO satellites only (like satellitemap.space focus)
  private isLEOSatellite(altitude: number): boolean {
    return altitude >= 160 && altitude <= 2000; // LEO range
  }

  // Convert CelesTrak data to our format
  private convertToSatelliteMapData(celestrakSat: CelestrakSatellite): SatelliteMapData | null {
    try {
      // Use actual TLE lines from CelesTrak if available, otherwise create simplified ones
      const tle1 = celestrakSat.TLE_LINE1 || `1 ${celestrakSat.NORAD_CAT_ID.toString().padStart(5, '0')}U ${celestrakSat.OBJECT_ID} 21001.00000000  .00000000  00000-0  00000-0 0    10`;
      const tle2 = celestrakSat.TLE_LINE2 || `2 ${celestrakSat.NORAD_CAT_ID.toString().padStart(5, '0')} ${celestrakSat.INCLINATION.toFixed(4).padStart(8, ' ')} ${celestrakSat.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' ')} ${(celestrakSat.ECCENTRICITY * 1e7).toFixed(0).padStart(7, '0')} ${celestrakSat.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' ')} ${celestrakSat.MEAN_ANOMALY.toFixed(4).padStart(8, ' ')} ${celestrakSat.MEAN_MOTION.toFixed(8)}00010`;
      
      const position = this.calculatePosition(tle1, tle2);
      
      // Only include LEO satellites
      if (!this.isLEOSatellite(position.altitude)) {
        return null;
      }
      
      const type = this.determineSatelliteType(celestrakSat.OBJECT_NAME, position.altitude);
      
      // Calculate orbital period
      const earthRadius = 6371; // km
      const mu = 398600.4418; // Earth's gravitational parameter
      const orbitalRadius = earthRadius + position.altitude;
      const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / mu) / 60; // minutes
      
      // Calculate apogee and perigee
      const semimajorAxis = Math.pow(mu / Math.pow(celestrakSat.MEAN_MOTION * 2 * Math.PI / (24 * 60), 2), 1/3);
      const apogee = semimajorAxis * (1 + celestrakSat.ECCENTRICITY) - earthRadius;
      const perigee = semimajorAxis * (1 - celestrakSat.ECCENTRICITY) - earthRadius;
      
      return {
        noradId: celestrakSat.NORAD_CAT_ID,
        name: celestrakSat.OBJECT_NAME,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        velocity: position.velocity,
        heading: position.heading,
        tle1: tle1,
        tle2: tle2,
        epoch: celestrakSat.EPOCH,
        period: period,
        inclination: celestrakSat.INCLINATION,
        eccentricity: celestrakSat.ECCENTRICITY,
        perigee: Math.max(0, perigee),
        apogee: apogee,
        constellation: this.getConstellation(celestrakSat.OBJECT_NAME),
        country: this.getCountry(celestrakSat.OBJECT_NAME, celestrakSat.COUNTRY_CODE),
        type: type,
        status: 'active' as SatelliteStatus
      };
    } catch (error) {
      console.error('Error converting satellite data:', error);
      return null;
    }
  }

  private getConstellation(name: string): string {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('STARLINK')) return 'Starlink';
    if (nameUpper.includes('ONEWEB')) return 'OneWeb';
    if (nameUpper.includes('IRIDIUM')) return 'Iridium';
    if (nameUpper.includes('PLANET') || nameUpper.includes('DOVE')) return 'Planet Labs';
    if (nameUpper.includes('SPIRE')) return 'Spire Global';
    if (nameUpper.includes('SWARM')) return 'Swarm';
    if (nameUpper.includes('GLOBALSTAR')) return 'Globalstar';
    if (nameUpper.includes('ORBCOMM')) return 'ORBCOMM';
    return 'Individual';
  }

  private getCountry(name: string, countryCode?: string): string {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('ISS') || nameUpper.includes('INTERNATIONAL')) return 'International';
    if (nameUpper.includes('STARLINK') || nameUpper.includes('DRAGON')) return 'USA';
    if (nameUpper.includes('TIANHE') || nameUpper.includes('TIANGONG') || nameUpper.includes('CSS')) return 'China';
    
    const countryMap: Record<string, string> = {
      'US': 'USA',
      'RU': 'Russia',
      'CN': 'China',
      'EU': 'Europe',
      'FR': 'France',
      'DE': 'Germany',
      'GB': 'United Kingdom',
      'JP': 'Japan',
      'IN': 'India',
      'CA': 'Canada'
    };
    
    return countryMap[countryCode || ''] || countryCode || 'Unknown';
  }

  // Convert to our Satellite interface
  private convertToSatellite(satMapData: SatelliteMapData): Satellite {
    return {
      id: satMapData.noradId.toString(),
      name: satMapData.name,
      type: satMapData.type,
      status: satMapData.status,
      position: {
        latitude: satMapData.latitude,
        longitude: satMapData.longitude,
        altitude: satMapData.altitude,
        timestamp: Date.now()
      },
      velocity: satMapData.velocity,
      heading: satMapData.heading,
      orbital: {
        period: satMapData.period,
        inclination: satMapData.inclination,
        eccentricity: satMapData.eccentricity,
        perigee: satMapData.perigee,
        apogee: satMapData.apogee,
        epoch: satMapData.epoch
      },
      metadata: {
        constellation: satMapData.constellation,
        country: satMapData.country,
        launchDate: new Date().toISOString(), // Would need separate API for launch data
        purpose: satMapData.type === 'constellation' ? 'Communication' : 'Various'
      },
      tle: {
        line1: satMapData.tle1,
        line2: satMapData.tle2
      }
    };
  }

  // Fetch LEO satellites from CelesTrak
  async fetchLEOSatellites(): Promise<Satellite[]> {
    const allSatellites: SatelliteMapData[] = [];
    const seenNoradIds = new Set<number>();

    try {
      console.log('Fetching LEO satellites from multiple sources...');
      
      const fetchPromises = LEO_SATELLITE_SOURCES.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data: CelestrakSatellite[] = await response.json();
          return data;
        } catch (error) {
          console.warn(`Failed to fetch from ${url}:`, error);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      
      for (const satelliteGroup of results) {
        for (const celestrakSat of satelliteGroup) {
          // Avoid duplicates
          if (seenNoradIds.has(celestrakSat.NORAD_CAT_ID)) continue;
          seenNoradIds.add(celestrakSat.NORAD_CAT_ID);

          const satMapData = this.convertToSatelliteMapData(celestrakSat);
          if (satMapData) {
            allSatellites.push(satMapData);
          }
        }
      }

      console.log(`Processed ${allSatellites.length} LEO satellites`);
      
      // Update cache
      this.cachedSatellites.clear();
      allSatellites.forEach(sat => {
        this.cachedSatellites.set(sat.noradId, sat);
      });
      
      this.lastUpdateTime = Date.now();
      
      return allSatellites.map(sat => this.convertToSatellite(sat));
      
    } catch (error) {
      console.error('Error fetching LEO satellites:', error);
      throw error;
    }
  }

  // Real-time position updates (like satellitemap.space)
  startRealTimeUpdates(onUpdate: (satellites: Satellite[]) => void) {
    console.log('Starting real-time LEO satellite tracking...');
    this.onDataUpdate = onUpdate;
    
    // Update positions every 5 seconds for smooth tracking
    this.updateInterval = setInterval(() => {
      this.updateSatellitePositions();
    }, 5000);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.onDataUpdate = null;
  }

  private updateSatellitePositions() {
    if (!this.onDataUpdate || this.cachedSatellites.size === 0) return;

    const updatedSatellites: Satellite[] = [];
    
    this.cachedSatellites.forEach((satData) => {
      try {
        // Recalculate position
        const newPosition = this.calculatePosition(satData.tle1, satData.tle2);
        
        // Update the cached data
        satData.latitude = newPosition.latitude;
        satData.longitude = newPosition.longitude;
        satData.altitude = newPosition.altitude;
        satData.velocity = newPosition.velocity;
        satData.heading = newPosition.heading;
        
        // Convert and add to update list
        updatedSatellites.push(this.convertToSatellite(satData));
      } catch (error) {
        console.error(`Error updating position for ${satData.name}:`, error);
      }
    });

    console.log(`Updated positions for ${updatedSatellites.length} LEO satellites`);
    this.onDataUpdate(updatedSatellites);
  }

  // Get launches (keep existing implementation for now)
  async getLaunches(): Promise<Launch[]> {
    try {
      const response = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return data.results.map((launch: any) => ({
        id: launch.id,
        name: launch.name,
        date: launch.net,
        status: launch.status.name,
        mission: launch.mission?.name || 'Unknown Mission',
        rocket: launch.rocket?.configuration?.name || 'Unknown Rocket',
        launchSite: launch.pad?.name || 'Unknown Location',
        description: launch.mission?.description || ''
      }));
    } catch (error) {
      console.error('Error fetching launches:', error);
      return [];
    }
  }
}

// Export singleton instance
export const satelliteMapAPI = new SatelliteMapAPI();
