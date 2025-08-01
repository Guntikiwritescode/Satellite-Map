import { Satellite, Launch } from '../types/satellite.types';
import { satelliteMapAPI } from './satelliteMapAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Fetching LEO satellites from satelliteMapAPI...');
      const satellites = await satelliteMapAPI.fetchLEOSatellites();
      console.log(`Successfully loaded ${satellites.length} LEO satellites`);
      return satellites.length > 0 ? satellites : this.generateMockSatellites();
    } catch (error) {
      console.error('Error fetching satellites, using mock data:', error);
      return this.generateMockSatellites();
    }
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
  },

  async getLaunches(): Promise<Launch[]> {
    return [];
  },

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    satelliteMapAPI.startRealTimeUpdates(callback);
  },

  stopRealTimeUpdates(): void {
    satelliteMapAPI.stopRealTimeUpdates();
  }
};