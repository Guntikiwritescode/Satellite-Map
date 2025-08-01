import { Satellite, Launch } from '../types/satellite.types';
import { satelliteMapAPI } from './satelliteMapAPI';

// New SatelliteMapAPI implementation focused on LEO satellites like satellitemap.space
class SatelliteAPIWrapper {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    console.log('Fetching LEO satellites using SatelliteMap.space approach...');
    return await satelliteMapAPI.fetchLEOSatellites();
  }

  async getLaunches(): Promise<Launch[]> {
    return await satelliteMapAPI.getLaunches();
  }

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    satelliteMapAPI.startRealTimeUpdates(callback);
  }

  stopRealTimeUpdates(): void {
    satelliteMapAPI.stopRealTimeUpdates();
  }
}

// Export the new API instance
export const satelliteAPI = new SatelliteAPIWrapper();