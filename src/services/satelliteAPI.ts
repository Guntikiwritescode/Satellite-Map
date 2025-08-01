import { Satellite, Launch } from '../types/satellite.types';
import { satelliteMapAPI } from './satelliteMapAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Fetching real satellite data from Celestrak...');
      // Use the existing satelliteMapAPI which fetches real data from Celestrak
      const satellites = await satelliteMapAPI.fetchLEOSatellites();
      
      if (satellites && satellites.length > 0) {
        console.log(`Successfully fetched ${satellites.length} real satellites from Celestrak`);
        return satellites;
      } else {
        throw new Error('No satellites returned from Celestrak API');
      }
    } catch (error) {
      console.error('Error fetching real satellite data:', error);
      throw new Error('Failed to fetch real satellite data. Please check your internet connection and try again.');
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

};