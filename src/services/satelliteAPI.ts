import { Satellite, Launch } from '../types/satellite.types';
import { spaceTrackAPI } from './spaceTrackAPI';
import { satelliteMapAPI } from './satelliteMapAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Attempting to fetch real satellite data from Space-Track.org...');
      // Try Space-Track.org API first
      const satellites = await spaceTrackAPI.getLEOSatellites(200);
      
      if (satellites && satellites.length > 0) {
        console.log(`Successfully fetched ${satellites.length} real satellites from Space-Track.org`);
        return satellites;
      }
    } catch (error) {
      console.warn('Space-Track.org not available (requires authentication), falling back to Celestrak...', error.message);
    }

    try {
      console.log('Fetching real satellite data from Celestrak...');
      // Fallback to Celestrak via satelliteMapAPI
      const satellites = await satelliteMapAPI.fetchLEOSatellites();
      
      if (satellites && satellites.length > 0) {
        console.log(`Successfully fetched ${satellites.length} real satellites from Celestrak`);
        return satellites;
      } else {
        throw new Error('No satellites returned from Celestrak API');
      }
    } catch (error) {
      console.error('Error fetching real satellite data from all sources:', error);
      throw new Error('Failed to fetch real satellite data from any source. Please check your internet connection and try again.');
    }
  },

  async getLaunches(): Promise<Launch[]> {
    return [];
  },

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    // Use the existing satelliteMapAPI for real-time updates since it works with Celestrak
    satelliteMapAPI.startRealTimeUpdates(callback);
  },

  stopRealTimeUpdates(): void {
    satelliteMapAPI.stopRealTimeUpdates();
  },

};