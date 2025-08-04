import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { spaceTrackAPI } from '../services/spaceTrackAPI';

// Development logging helper
const isDev = import.meta.env.DEV;
const log = (...args: unknown[]) => isDev && console.log(...args);
const logError = (...args: unknown[]) => console.error(...args);
const logWarn = (...args: unknown[]) => isDev && console.warn(...args);

export const useSatelliteData = () => {
  const { setSatellites, setLoading, setError, satellites, setSatellites: updateSatellites } = useSatelliteStore();

  const fetchSatellites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      log('Starting satellite data fetch...');
      
      // Test connectivity first
      try {
        log('Testing connectivity to API...');
        const testResponse = await fetch('/api/space-track-proxy', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test' })
        });
        log('Connectivity test result:', testResponse.status);
      } catch (error) {
        logError('Connectivity test failed:', error);
        throw new Error('Unable to connect to satellite API');
      }

      const result = await spaceTrackAPI.getAllActiveSatellites();
      log(`Successfully fetched ${result.length} satellites`);
      setSatellites(result);
    } catch (error) {
      logError('Satellite fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch satellite data');
    } finally {
      setLoading(false);
    }
  }, [setSatellites, setLoading, setError]);

  // Stabilize updateSatellites function to prevent useEffect dependency issues
  const stableUpdateSatellites = useCallback((updatedSatellites: Satellite[]) => {
    updateSatellites(updatedSatellites);
  }, [updateSatellites]);

  // Optimized real-time position updates with error handling and reduced frequency
  useEffect(() => {
    const updatePositions = () => {
      if (satellites.length === 0) return;
      
      try {
        const positionUpdates = satellites.map(sat => {
          if (sat.tle?.line1 && sat.tle?.line2) {
            const position = spaceTrackAPI.calculatePosition(sat.tle.line1, sat.tle.line2);
            return { id: sat.id, position: { ...position, timestamp: Date.now() } };
          }
          return { id: sat.id, position: sat.position };
        });

        const updatedSatellites = satellites.map((sat, index) => ({
          ...sat,
          position: positionUpdates[index].position
        }));
        
        stableUpdateSatellites(updatedSatellites);
      } catch (error) {
        logError('Error updating satellite positions:', error);
      }
    };

    // Reduced frequency from 10 seconds to 15 seconds for weaker devices
    const interval = setInterval(updatePositions, 15000);
    return () => clearInterval(interval);
  }, [satellites, stableUpdateSatellites]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // User location logic can be added here if needed
        },
        (error) => {
          logWarn('Could not get user location:', error);
        }
      );
    }
  }, []);

  return { fetchSatellites };
};