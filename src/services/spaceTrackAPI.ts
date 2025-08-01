import { Satellite } from '../types/satellite.types';
import * as satellite from 'satellite.js';

interface SpaceTrackGPData {
  NORAD_CAT_ID: number;
  OBJECT_NAME: string;
  OBJECT_TYPE: string;
  CLASSIFICATION_TYPE: string;
  INTLDES: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  SEMIMAJOR_AXIS: number;
  PERIOD: number;
  APOAPSIS: number;
  PERIAPSIS: number;
  OBJECT_ID: string;
  OBJECT_NUMBER: number;
  TLE_LINE1: string;
  TLE_LINE2: string;
  COUNTRY_CODE: string;
  LAUNCH_DATE: string;
  SITE: string;
  DECAY_DATE?: string;
  FILE: number;
  LAUNCH_YEAR: number;
  LAUNCH_NUM: number;
  LAUNCH_PIECE: string;
  CURRENT: string;
  CREATION_DATE: string;
  ORIGINATOR: string;
  CCSDS_OMM_VERS: string;
  COMMENT: string;
  CONSTELLATION?: string;
}

export class SpaceTrackAPI {
  private proxyUrl = 'https://dnjhvmwznqsunjpabacg.supabase.co/functions/v1/space-track-proxy';
  private credentials = {
    username: 'nihanth20@gmail.com',
    password: 'CS2wTBBW.*LjZeY'
  };
  private lastRequest = 0;
  private requestQueue: Promise<any> = Promise.resolve();
  
  // Rate limiting: 30 requests per minute, 300 per hour
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests to be safe

  constructor() {
    console.log('SpaceTrackAPI initialized with Supabase proxy');
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.requestQueue = this.requestQueue.then(async () => {
      await this.rateLimit();
      return requestFn();
    });
  }

  private async makeProxyRequest(endpoint: string): Promise<any> {
    return this.queueRequest(async () => {
      console.log(`Making Space-Track request via proxy: ${endpoint}`);

      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch',
          endpoint,
          credentials: this.credentials
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Space-Track API error: ${data.message || data.error}`);
      }
      
      return data;
    });
  }

  async getLEOSatellites(limit: number = 200): Promise<Satellite[]> {
    try {
      console.log(`Fetching LEO satellites from Space-Track.org (limit: ${limit})...`);
      
      // Get current GP data for LEO satellites (altitude < 2000 km roughly corresponds to mean motion > 11)
      const endpoint = `/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/MEAN_MOTION/>11/orderby/NORAD_CAT_ID asc/limit/${limit}/format/json`;
      
      const data: SpaceTrackGPData[] = await this.makeProxyRequest(endpoint);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No satellite data received from Space-Track.org');
      }

      console.log(`Processing ${data.length} satellites from Space-Track.org...`);

      const satellites: Satellite[] = data.map(sat => this.convertToSatellite(sat));
      
      // Calculate real-time positions for all satellites
      const satellitesWithPositions = satellites.map(sat => {
        try {
          const position = this.calculatePosition(sat.tle.line1, sat.tle.line2);
          return {
            ...sat,
            position: {
              ...position,
              timestamp: Date.now()
            },
            velocity: position.velocity || sat.velocity,
            heading: position.heading || sat.heading
          };
        } catch (error) {
          console.warn(`Failed to calculate position for satellite ${sat.name}:`, error);
          return sat;
        }
      });

      console.log(`Successfully processed ${satellitesWithPositions.length} LEO satellites from Space-Track.org`);
      return satellitesWithPositions;

    } catch (error) {
      console.error('Error fetching LEO satellites from Space-Track.org:', error);
      throw error;
    }
  }

  private convertToSatellite(sat: SpaceTrackGPData): Satellite {
    // Determine satellite type based on object type and name
    const type = this.determineSatelliteType(sat.OBJECT_NAME, sat.OBJECT_TYPE, sat.SEMIMAJOR_AXIS);
    
    // Determine status
    const status = sat.DECAY_DATE ? 'decayed' : 'active';

    return {
      id: sat.NORAD_CAT_ID.toString(),
      name: sat.OBJECT_NAME || `NORAD ${sat.NORAD_CAT_ID}`,
      type,
      status,
      position: {
        latitude: 0, // Will be calculated
        longitude: 0, // Will be calculated
        altitude: (sat.SEMIMAJOR_AXIS - 6371) || 400, // Convert from km radius to altitude
        timestamp: Date.now()
      },
      velocity: 7.8, // Will be calculated
      heading: 0, // Will be calculated
      orbital: {
        period: sat.PERIOD || 90,
        inclination: sat.INCLINATION || 0,
        eccentricity: sat.ECCENTRICITY || 0,
        perigee: sat.PERIAPSIS || 400,
        apogee: sat.APOAPSIS || 450,
        epoch: sat.EPOCH || new Date().toISOString()
      },
      metadata: {
        constellation: sat.CONSTELLATION || this.extractConstellation(sat.OBJECT_NAME),
        country: sat.COUNTRY_CODE || 'Unknown',
        launchDate: sat.LAUNCH_DATE || new Date().toISOString(),
        purpose: this.determinePurpose(sat.OBJECT_NAME, sat.OBJECT_TYPE)
      },
      tle: {
        line1: sat.TLE_LINE1 || `1 ${sat.NORAD_CAT_ID}`,
        line2: sat.TLE_LINE2 || `2 ${sat.NORAD_CAT_ID}`
      }
    };
  }

  calculatePosition(tle1: string, tle2: string) {
    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      if (positionAndVelocity.position && typeof positionAndVelocity.position === 'object') {
        const positionEci = positionAndVelocity.position as any;
        const velocityEci = positionAndVelocity.velocity as any;
        
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const altitude = positionGd.height;
        
        // Calculate velocity magnitude
        let velocity = 7.8;
        let heading = 0;
        
        if (velocityEci && velocityEci.x && velocityEci.y && velocityEci.z) {
          velocity = Math.sqrt(velocityEci.x * velocityEci.x + velocityEci.y * velocityEci.y + velocityEci.z * velocityEci.z);
          heading = Math.atan2(velocityEci.y, velocityEci.x) * (180 / Math.PI);
          if (heading < 0) heading += 360;
        }
        
        return {
          latitude: isNaN(latitude) ? 0 : latitude,
          longitude: isNaN(longitude) ? 0 : longitude,
          altitude: isNaN(altitude) ? 400 : altitude,
          velocity: isNaN(velocity) ? 7.8 : velocity,
          heading: isNaN(heading) ? 0 : heading
        };
      }
    } catch (error) {
      console.warn('Error calculating satellite position:', error);
    }
    
    return {
      latitude: 0,
      longitude: 0,
      altitude: 400,
      velocity: 7.8,
      heading: 0
    };
  }

  private determineSatelliteType(name: string, objectType: string, altitude: number): 'space-station' | 'constellation' | 'earth-observation' | 'communication' {
    const lowerName = name.toLowerCase();
    const lowerType = objectType.toLowerCase();
    
    if (lowerName.includes('iss') || lowerName.includes('international space station')) {
      return 'space-station';
    }
    
    if (lowerType.includes('deb') || lowerName.includes('debris')) {
      return 'earth-observation'; // Classify debris as earth observation for filtering
    }
    
    if (lowerType.includes('rocket') || lowerType.includes('r/b') || lowerName.includes('rocket')) {
      return 'communication'; // Classify rocket bodies as communication for filtering
    }
    
    return 'constellation';
  }

  private extractConstellation(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('starlink')) return 'Starlink';
    if (lowerName.includes('oneweb')) return 'OneWeb';
    if (lowerName.includes('cosmos')) return 'COSMOS';
    if (lowerName.includes('iridium')) return 'Iridium';
    if (lowerName.includes('globalstar')) return 'Globalstar';
    if (lowerName.includes('galileo')) return 'Galileo';
    if (lowerName.includes('gps') || lowerName.includes('navstar')) return 'GPS';
    if (lowerName.includes('glonass')) return 'GLONASS';
    if (lowerName.includes('beidou')) return 'BeiDou';
    
    return 'Other';
  }

  private determinePurpose(name: string, objectType: string): string {
    const lowerName = name.toLowerCase();
    const lowerType = objectType.toLowerCase();
    
    if (lowerName.includes('iss')) return 'Space Station';
    if (lowerName.includes('starlink') || lowerName.includes('oneweb')) return 'Internet Constellation';
    if (lowerName.includes('gps') || lowerName.includes('galileo') || lowerName.includes('glonass') || lowerName.includes('beidou')) return 'Navigation';
    if (lowerName.includes('weather') || lowerName.includes('noaa')) return 'Weather Monitoring';
    if (lowerName.includes('telescope') || lowerName.includes('hubble')) return 'Space Telescope';
    if (lowerType.includes('deb')) return 'Space Debris';
    if (lowerType.includes('rocket')) return 'Rocket Body';
    
    return 'Satellite Operations';
  }
}

export const spaceTrackAPI = new SpaceTrackAPI();