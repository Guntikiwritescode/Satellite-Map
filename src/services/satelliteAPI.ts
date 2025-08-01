import { Satellite, Launch } from '../types/satellite.types';
import { satelliteMapAPI } from './satelliteMapAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Fetching LEO satellites from satelliteMapAPI...');
      const satellites = await satelliteMapAPI.fetchLEOSatellites();
      console.log(`Successfully loaded ${satellites.length} LEO satellites`);
      return satellites;
    } catch (error) {
      console.error('Error fetching satellites:', error);
      return [];
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
  }
};