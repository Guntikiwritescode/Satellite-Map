import { Satellite } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Development logging helper
const isDev = import.meta.env.DEV;
const log = (...args: unknown[]) => isDev && console.log(...args);
const logError = (...args: unknown[]) => console.error(...args);
const logWarn = (...args: unknown[]) => isDev && console.warn(...args);

interface SpaceTrackGPData {
  NORAD_CAT_ID: number;
  OBJECT_NAME: string;
  OBJECT_TYPE: string;
  EPOCH: string;
  MEAN_MOTION: number | string;
  ECCENTRICITY: number | string;
  INCLINATION: number | string;
  SEMIMAJOR_AXIS: number | string;
  PERIOD: number | string;
  APOAPSIS: number | string;
  PERIAPSIS: number | string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  COUNTRY_CODE: string;
  LAUNCH_DATE: string;
  CONSTELLATION?: string;
}

interface SpaceTrackResponse {
  error?: string;
  [key: string]: unknown;
}

export class SpaceTrackAPI {
  private proxyUrl = '/api/space-track-proxy';
  private lastRequest = 0;
  private requestQueue: Promise<unknown> = Promise.resolve();
  private readonly RATE_LIMIT_DELAY = 2000;

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

  private async makeProxyRequest(endpoint: string): Promise<SpaceTrackGPData[]> {
    return this.queueRequest(async () => {
      log('Making proxy request to:', this.proxyUrl);
      log('Request payload:', { action: 'fetch', endpoint });
      
      try {
        const response = await fetch(this.proxyUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'fetch', endpoint })
        });

        log('Response status:', response.status);
        log('Response headers:', response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          logError('Proxy request failed:', response.status, errorText);
          throw new Error(`Proxy request failed: ${response.status} - ${errorText}`);
        }

        const data: SpaceTrackResponse = await response.json();
        log('Response data received:', Array.isArray(data) ? `${data.length} items` : 'Non-array data');
        
        if (data.error) {
          throw new Error(`Space-Track API error: ${data.error}`);
        }
        
        return data as SpaceTrackGPData[];
      } catch (error) {
        logError('Fetch error details:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to satellite data service. Please check if the service is running.');
        }
        throw error;
      }
    });
  }

  async getAllActiveSatellites(): Promise<Satellite[]> {
    try {
      // Get all active satellites regardless of orbit type - much more comprehensive
      const endpoint = `/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/orderby/NORAD_CAT_ID asc/format/json`;
      const data: SpaceTrackGPData[] = await this.makeProxyRequest(endpoint);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No satellite data received');
      }

      return data.map(sat => {
        const convertedSat = this.convertToSatellite(sat);
        try {
          // Add more defensive programming here
          if (convertedSat.tle?.line1 && convertedSat.tle?.line2) {
            const position = this.calculatePosition(convertedSat.tle.line1, convertedSat.tle.line2);
            return { 
              ...convertedSat, 
              position: { 
                ...position, 
                timestamp: Date.now() 
              } 
            };
          } else {
            logWarn(`Invalid TLE data for satellite ${convertedSat.id}`);
            return convertedSat;
          }
        } catch (error) {
          logWarn(`Error calculating position for satellite ${convertedSat.id}:`, error);
          return convertedSat;
        }
      }).filter(sat => sat !== null); // Remove any null satellites
    } catch (error) {
      logError('Error fetching satellites:', error);
      throw error;
    }
  }

  async getLEOSatellites(limit: number = 200): Promise<Satellite[]> {
    try {
      const endpoint = `/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/MEAN_MOTION/>11/orderby/NORAD_CAT_ID asc/limit/${limit}/format/json`;
      const data: SpaceTrackGPData[] = await this.makeProxyRequest(endpoint);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No satellite data received');
      }

      return data.map(sat => this.convertToSatellite(sat)).map(sat => {
        try {
          const position = this.calculatePosition(sat.tle.line1, sat.tle.line2);
          return { ...sat, position: { ...position, timestamp: Date.now() } };
        } catch (error) {
          return sat;
        }
      });
    } catch (error) {
      logError('Error fetching satellites:', error);
      throw error;
    }
  }

  private convertToSatellite(sat: SpaceTrackGPData): Satellite {
    return {
      id: sat.NORAD_CAT_ID.toString(),
      name: sat.OBJECT_NAME || `NORAD ${sat.NORAD_CAT_ID}`,
      type: this.determineSatelliteType(sat.OBJECT_NAME, sat.OBJECT_TYPE),
      status: 'active',
      position: {
        latitude: 0,
        longitude: 0,
        altitude: this.safeParseFloat(sat.SEMIMAJOR_AXIS) ? (this.safeParseFloat(sat.SEMIMAJOR_AXIS) - 6371) : 400,
        timestamp: Date.now()
      },
      velocity: 7.8,
      heading: 0,
      orbital: {
        period: this.safeParseFloat(sat.PERIOD) || 90,
        inclination: this.safeParseFloat(sat.INCLINATION) || 0,
        eccentricity: this.safeParseFloat(sat.ECCENTRICITY) || 0,
        perigee: this.safeParseFloat(sat.PERIAPSIS) || 400,
        apogee: this.safeParseFloat(sat.APOAPSIS) || 450,
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
      if (!tle1 || !tle2) {
        return { latitude: 0, longitude: 0, altitude: 400 };
      }
      
      const satrec = satellite.twoline2satrec(tle1, tle2);
      if (!satrec) {
        return { latitude: 0, longitude: 0, altitude: 400 };
      }
      
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      // First check if positionAndVelocity is null or undefined
      if (!positionAndVelocity) {
        return { latitude: 0, longitude: 0, altitude: 400 };
      }
      
      // More robust checking for positionAndVelocity
      if (typeof positionAndVelocity !== 'object') {
        return { latitude: 0, longitude: 0, altitude: 400 };
      }
      
      // Check if position exists and is valid
      if (positionAndVelocity.position && 
          typeof positionAndVelocity.position === 'object' && 
          positionAndVelocity.position !== null &&
          'x' in positionAndVelocity.position &&
          'y' in positionAndVelocity.position &&
          'z' in positionAndVelocity.position) {
        
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const altitude = positionGd.height;
        
        return {
          latitude: isNaN(latitude) ? 0 : latitude,
          longitude: isNaN(longitude) ? 0 : longitude,
          altitude: isNaN(altitude) ? 400 : altitude
        };
      }
      
      return { latitude: 0, longitude: 0, altitude: 400 };
    } catch (error) {
      logWarn('Error calculating satellite position:', error);
      return { latitude: 0, longitude: 0, altitude: 400 };
    }
  }

  private determineSatelliteType(name: string, objectType: string) {
    const lowerName = name.toLowerCase();
    const lowerType = objectType.toLowerCase();
    
    if (lowerName.includes('iss') || lowerName.includes('station')) return 'space-station';
    if (lowerName.includes('starlink') || lowerName.includes('oneweb') || lowerName.includes('kuiper')) return 'constellation';
    if (lowerName.includes('gps') || lowerName.includes('galileo') || lowerName.includes('glonass') || lowerName.includes('beidou')) return 'navigation';
    if (lowerName.includes('weather') || lowerName.includes('meteo') || lowerName.includes('goes') || lowerName.includes('noaa')) return 'weather';
    if (lowerName.includes('telescope') || lowerName.includes('hubble') || lowerName.includes('kepler') || lowerName.includes('tess')) return 'scientific';
    if (lowerName.includes('landsat') || lowerName.includes('worldview') || lowerName.includes('sentinel') || lowerName.includes('spot')) return 'earth-observation';
    if (lowerType.includes('rocket') || lowerName.includes('r/b') || lowerName.includes('rocket body')) return 'rocket-body';
    if (lowerName.includes('military') || lowerName.includes('defense') || lowerName.includes('classified')) return 'military';
    
    return 'communication';
  }

  private extractConstellation(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('starlink')) return 'Starlink';
    if (lowerName.includes('oneweb')) return 'OneWeb';
    if (lowerName.includes('kuiper')) return 'Project Kuiper';
    if (lowerName.includes('gps')) return 'GPS';
    if (lowerName.includes('galileo')) return 'Galileo';
    if (lowerName.includes('glonass')) return 'GLONASS';
    if (lowerName.includes('beidou')) return 'BeiDou';
    if (lowerName.includes('iridium')) return 'Iridium';
    if (lowerName.includes('globalstar')) return 'Globalstar';
    if (lowerName.includes('orbcomm')) return 'ORBCOMM';
    
    return 'Other';
  }

  private determinePurpose(name: string, objectType: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('iss')) return 'Space Station';
    if (lowerName.includes('starlink')) return 'Internet Constellation';
    if (lowerName.includes('gps')) return 'Navigation';
    if (lowerName.includes('weather')) return 'Weather Monitoring';
    if (lowerName.includes('telescope')) return 'Space Telescope';
    
    return 'Satellite Operations';
  }

  private safeParseFloat(value: number | string | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return 0;
  }
}

export const spaceTrackAPI = new SpaceTrackAPI();