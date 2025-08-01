import { Satellite, Launch } from '../types/satellite.types';

// Temporary fix - use CelesTrak data directly with original structure
export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json&LIMIT=1000');
      const data = await response.json();
      
      return data.slice(0, 1000).map((sat: any) => ({
        id: sat.NORAD_CAT_ID.toString(),
        name: sat.OBJECT_NAME,
        type: 'constellation' as const,
        status: 'active' as const,
        position: {
          latitude: Math.random() * 180 - 90,
          longitude: Math.random() * 360 - 180, 
          altitude: 550,
          timestamp: Date.now()
        },
        velocity: 7.8,
        heading: Math.random() * 360,
        orbital: {
          period: sat.PERIOD || 90,
          inclination: sat.INCLINATION,
          eccentricity: sat.ECCENTRICITY,
          perigee: 540,
          apogee: 560,
          epoch: sat.EPOCH
        },
        metadata: {
          constellation: 'Starlink',
          country: 'USA',
          launchDate: new Date().toISOString(),
          purpose: 'Communication'
        },
        tle: {
          line1: `1 ${sat.NORAD_CAT_ID}`,
          line2: `2 ${sat.NORAD_CAT_ID}`
        }
      }));
    } catch (error) {
      console.error('Error fetching satellites:', error);
      return [];
    }
  },

  async getLaunches(): Promise<Launch[]> {
    return [];
  },

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    // No-op for now
  },

  stopRealTimeUpdates(): void {
    // No-op for now
  }
};