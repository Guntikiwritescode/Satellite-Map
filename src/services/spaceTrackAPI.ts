import { Satellite } from '../types/satellite.types';
import * as satellite from 'satellite.js';
import { logger } from '../lib/logger';
import { 
  API_CONFIG, 
  SATELLITE_CONFIG, 
  ERROR_MESSAGES 
} from '../lib/constants';

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

// Input validation utilities
const validateTLE = (line1: string, line2: string): boolean => {
  return Boolean(
    line1 && 
    line2 && 
    line1.length > SATELLITE_CONFIG.MIN_TLE_LENGTH && 
    line2.length > SATELLITE_CONFIG.MIN_TLE_LENGTH &&
    line1.trim().length > 0 &&
    line2.trim().length > 0
  );
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>'"&]/g, '').trim();
};

const validateNumericRange = (value: number, min: number, max: number): boolean => {
  return !isNaN(value) && value >= min && value <= max;
};

export class SpaceTrackAPI {
  private readonly proxyUrl = '/api/space-track-proxy';
  private lastRequest = 0;
  private requestQueue: Promise<unknown> = Promise.resolve();
  private readonly context = { component: 'SpaceTrackAPI' };

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < API_CONFIG.RATE_LIMIT_DELAY) {
      const delay = API_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest;
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
      // Input validation
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }

      const sanitizedEndpoint = sanitizeInput(endpoint);
      
      logger.debug('Making proxy request', {
        ...this.context,
        action: 'makeProxyRequest'
      });
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(this.proxyUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ action: 'fetch', endpoint: sanitizedEndpoint }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Proxy request failed', {
            ...this.context,
            action: 'makeProxyRequest'
          }, { status: response.status, error: errorText });
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (response.status >= 500) {
            throw new Error(ERROR_MESSAGES.API_ERROR);
          }
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          logger.error('Space-Track API error', {
            ...this.context,
            action: 'makeProxyRequest'
          }, data.error);
          throw new Error(`API error: ${data.error}`);
        }
        
        if (!Array.isArray(data)) {
          logger.warn('Unexpected data format received', {
            ...this.context,
            action: 'makeProxyRequest'
          });
          throw new Error(ERROR_MESSAGES.INVALID_DATA);
        }

        logger.info('Successfully fetched satellite data', {
          ...this.context,
          action: 'makeProxyRequest'
        }, { count: data.length });
        
        return data;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
          }
          if (error.message === 'Failed to fetch') {
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
          }
        }
        throw error;
      }
    });
  }

  async getAllActiveSatellites(): Promise<Satellite[]> {
    try {
      logger.info('Fetching all active satellites', {
        ...this.context,
        action: 'getAllActiveSatellites'
      });

      // Get all active satellites regardless of orbit type - much more comprehensive
      const endpoint = `/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/orderby/NORAD_CAT_ID asc/format/json`;
      const data: SpaceTrackGPData[] = await this.makeProxyRequest(endpoint);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        logger.warn('No satellite data received', {
          ...this.context,
          action: 'getAllActiveSatellites'
        });
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }

      const satellites = data.map(sat => {
        const convertedSat = this.convertToSatellite(sat);
        try {
          if (convertedSat.tle?.line1 && convertedSat.tle?.line2) {
            const position = this.calculatePosition(convertedSat.tle.line1, convertedSat.tle.line2);
            return { 
              ...convertedSat, 
              position: { 
                ...position, 
                timestamp: Date.now() 
              } 
            };
          }
          return convertedSat;
        } catch (error) {
          logger.debug('Position calculation failed for satellite', {
            ...this.context,
            action: 'getAllActiveSatellites'
          }, { satelliteId: convertedSat.id, error });
          return convertedSat;
        }
      }).filter(sat => this.validateSatellite(sat));

      logger.info('Successfully processed satellites', {
        ...this.context,
        action: 'getAllActiveSatellites'
      }, { 
        total: data.length, 
        valid: satellites.length, 
        filtered: data.length - satellites.length 
      });

      return satellites;
    } catch (error) {
      logger.error('Error fetching satellites', {
        ...this.context,
        action: 'getAllActiveSatellites'
      }, error);
      throw error;
    }
  }

  async getLEOSatellites(limit: number = 200): Promise<Satellite[]> {
    try {
      logger.info('Fetching LEO satellites', {
        ...this.context,
        action: 'getLEOSatellites'
      }, { limit });

      // Validate input
      if (!validateNumericRange(limit, 1, 10000)) {
        throw new Error('Invalid limit parameter');
      }

      const endpoint = `/basicspacedata/query/class/gp/decay_date/null-val/epoch/>now-30/MEAN_MOTION/>11/orderby/NORAD_CAT_ID asc/limit/${limit}/format/json`;
      const data: SpaceTrackGPData[] = await this.makeProxyRequest(endpoint);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }

      return data.map(sat => this.convertToSatellite(sat)).map(sat => {
        try {
          const position = this.calculatePosition(sat.tle.line1, sat.tle.line2);
          return { ...sat, position: { ...position, timestamp: Date.now() } };
        } catch {
          return sat;
        }
      });
    } catch (error) {
      logger.error('Error fetching LEO satellites', {
        ...this.context,
        action: 'getLEOSatellites'
      }, error);
      throw error;
    }
  }

  private validateSatellite(satellite: Satellite): boolean {
    return Boolean(
      satellite &&
      satellite.id &&
      satellite.name &&
      satellite.position &&
      typeof satellite.position.latitude === 'number' &&
      typeof satellite.position.longitude === 'number' &&
      !isNaN(satellite.position.latitude) &&
      !isNaN(satellite.position.longitude) &&
      validateNumericRange(satellite.position.latitude, -90, 90) &&
      validateNumericRange(satellite.position.longitude, -180, 180)
    );
  }

  private convertToSatellite(sat: SpaceTrackGPData): Satellite {
    return {
      id: sanitizeInput(sat.NORAD_CAT_ID.toString()),
      name: sanitizeInput(sat.OBJECT_NAME || `NORAD ${sat.NORAD_CAT_ID}`),
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
        constellation: sanitizeInput(sat.CONSTELLATION || this.extractConstellation(sat.OBJECT_NAME)),
        country: sanitizeInput(sat.COUNTRY_CODE || 'Unknown'),
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
      if (!validateTLE(tle1, tle2)) {
        logger.debug('Invalid TLE data provided', {
          ...this.context,
          action: 'calculatePosition'
        });
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
        
        // Validate calculated coordinates
        if (!validateNumericRange(latitude, -90, 90) || 
            !validateNumericRange(longitude, -180, 180) ||
            isNaN(altitude)) {
          return { latitude: 0, longitude: 0, altitude: 400 };
        }
        
        return {
          latitude,
          longitude,
          altitude: Math.max(altitude, 0) // Ensure altitude is not negative
        };
      }
      
      return { latitude: 0, longitude: 0, altitude: 400 };
    } catch (error) {
      logger.debug('Error calculating satellite position', {
        ...this.context,
        action: 'calculatePosition'
      }, error);
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
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}

export const spaceTrackAPI = new SpaceTrackAPI();