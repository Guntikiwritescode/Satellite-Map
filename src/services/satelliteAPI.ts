import { Satellite, Launch } from '../types/satellite.types';
import { spaceTrackAPI } from './spaceTrackAPI';

export const satelliteAPI = {
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    try {
      console.log('Fetching real satellite data from Space-Track.org...');
      // Use only Space-Track.org API with authenticated credentials
      const satellites = await spaceTrackAPI.getLEOSatellites(200);
      
      if (satellites && satellites.length > 0) {
        console.log(`Successfully fetched ${satellites.length} real satellites from Space-Track.org`);
        return satellites;
      } else {
        throw new Error('No satellites returned from Space-Track.org API');
      }
    } catch (error) {
      console.error('Error fetching real satellite data from Space-Track.org:', error);
      throw new Error(`Failed to fetch real satellite data from Space-Track.org: ${error.message}`);
    }
  },

  async getLaunches(): Promise<Launch[]> {
    // Space-Track.org doesn't provide launch data, return empty array
    return [];
  },

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void): void {
    // Implement real-time updates using only Space-Track.org TLE data
    let updateInterval: NodeJS.Timeout;
    let currentSatellites: Satellite[] = [];

    const updatePositions = async () => {
      try {
        // Refresh satellite data from Space-Track.org periodically
        if (currentSatellites.length === 0 || Math.random() < 0.05) { // 5% chance to refresh from Space-Track.org API
          currentSatellites = await this.getSatellitesWithFallback();
        } else {
          // Update positions using official TLE propagation from Space-Track.org data
          const updatedSatellites = currentSatellites.map(sat => {
            try {
              const position = spaceTrackAPI.calculatePosition(sat.tle.line1, sat.tle.line2);
              return {
                ...sat,
                position: {
                  ...position,
                  timestamp: Date.now()
                },
                velocity: position.velocity || sat.velocity,
                heading: position.heading || sat.heading
              };
            } catch (error) {
              console.warn(`Failed to update position for satellite ${sat.name}:`, error);
              return sat; // Return satellite unchanged if TLE calculation fails
            }
          });
          
          currentSatellites = updatedSatellites;
        }

        callback(currentSatellites);
      } catch (error) {
        console.error('Error updating satellite positions from Space-Track.org:', error);
        // Don't callback with empty data, keep showing last known positions
      }
    };

    // Update positions every 10 seconds using official TLE data
    updateInterval = setInterval(updatePositions, 10000);
    
    // Store the interval for cleanup
    (this as any)._updateInterval = updateInterval;
    
    // Initial update
    updatePositions();
  },

  stopRealTimeUpdates(): void {
    if ((this as any)._updateInterval) {
      clearInterval((this as any)._updateInterval);
      (this as any)._updateInterval = null;
    }
  },

};