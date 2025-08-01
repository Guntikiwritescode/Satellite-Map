import { Satellite, Launch } from '../types/satellite.types';
import { satelliteMapAPI } from './satelliteMapAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Fetching satellite data from alternative sources...');
      // Use N2YO API as alternative
      const response = await fetch('https://api.n2yo.com/rest/v1/satellite/above/41.702/-76.014/0/90/18/&apiKey=demo');
      const data = await response.json();
      
      if (data.above) {
        return data.above.map((sat: any) => ({
          id: sat.satid.toString(),
          name: sat.satname,
          type: 'constellation' as const,
          status: 'active' as const,
          position: {
            latitude: sat.satlat,
            longitude: sat.satlng,
            altitude: sat.satalt,
            timestamp: Date.now()
          },
          velocity: 7.8,
          heading: 0,
          orbital: {
            period: 90,
            inclination: 53,
            eccentricity: 0.001,
            perigee: sat.satalt - 50,
            apogee: sat.satalt + 50,
            epoch: new Date().toISOString()
          },
          metadata: {
            constellation: 'Various',
            country: 'Various',
            launchDate: new Date().toISOString(),
            purpose: 'Satellite tracking and monitoring'
          },
          tle: {
            line1: `1 ${sat.satid}`,
            line2: `2 ${sat.satid}`
          }
        }));
      }
      
      return satelliteAPI.generateMockSatellites();
    } catch (error) {
      console.error('Error fetching satellites, using mock data:', error);
      return satelliteAPI.generateMockSatellites();
    }
  },

  async getLaunches(): Promise<Launch[]> {
    return [];
  },

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    satelliteMapAPI.startRealTimeUpdates(callback);
  },

  stopRealTimeUpdates(): void {
    satelliteMapAPI.stopRealTimeUpdates();
  },

  generateMockSatellites(): Satellite[] {
    const mockSatellites: Satellite[] = [];
    for (let i = 0; i < 50; i++) {
      const altitude = 400 + Math.random() * 1600;
      mockSatellites.push({
        id: `MOCK-${i}`,
        name: `Satellite ${i + 1}`,
        type: 'constellation' as const,
        status: 'active' as const,
        position: {
          latitude: (Math.random() - 0.5) * 180,
          longitude: (Math.random() - 0.5) * 360,
          altitude: altitude,
          timestamp: Date.now()
        },
        velocity: 7.8,
        heading: Math.random() * 360,
        orbital: {
          period: 90 + Math.random() * 30,
          inclination: Math.random() * 180,
          eccentricity: 0.001,
          perigee: altitude - 50,
          apogee: altitude + 50,
          epoch: new Date().toISOString()
        },
        metadata: {
          constellation: 'Test Constellation',
          country: 'USA',
          launchDate: new Date().toISOString(),
          purpose: 'Testing and demonstration'
        },
        tle: {
          line1: `1 ${i}`,
          line2: `2 ${i}`
        }
      });
    }
    return mockSatellites;
  }
};