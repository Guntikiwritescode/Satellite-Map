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
  private baseUrl = 'https://www.space-track.org';

  constructor() {
    console.log('SpaceTrackAPI initialized - requires authentication for real data');
  }

  async getLEOSatellites(limit: number = 200): Promise<Satellite[]> {
    // Space-Track.org requires user authentication which we can't provide in a demo
    // For now, we'll throw an error to fall back to alternative data sources
    throw new Error('Space-Track.org requires user authentication. Please register at space-track.org for access to real-time satellite data.');
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
}

export const spaceTrackAPI = new SpaceTrackAPI();