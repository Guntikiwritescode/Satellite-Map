import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { spaceTrackAPI } from '../services/spaceTrackAPI';

export const useSatelliteData = () => {
  const { setSatellites, setError, setLoading } = useSatelliteStore();

  // Fetch satellite data
  const { 
    data: satellites = [], 
    error: satelliteError, 
    isLoading: satelliteLoading,
    refetch: refetchSatellites 
  } = useQuery({
    queryKey: ['satellites', 'unlimited'],
    queryFn: async () => {
      console.log('Starting satellite data fetch...');
      
      // Test connectivity first
      try {
        console.log('Testing connectivity to API...');
        const testResponse = await fetch('/api/space-track-proxy', {
          method: 'OPTIONS'
        });
        console.log('Connectivity test result:', testResponse.status);
      } catch (error) {
        console.error('Connectivity test failed:', error);
        throw new Error('Cannot connect to satellite data service. The service may be temporarily unavailable.');
      }
      
      try {
        const result = await spaceTrackAPI.getAllActiveSatellites();
        console.log(`Successfully fetched ${result.length} satellites`);
        return result;
      } catch (error) {
        console.error('Satellite fetch error:', error);
        // More specific error handling
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network connection failed. The satellite data service is not responding.');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to satellite data service. Please try refreshing the page.');
        }
        throw error;
      }
    },
    refetchInterval: 10 * 60 * 1000, // 10 minutes - reduced frequency for performance
    staleTime: 0, // Force immediate refresh to see the change
    retry: 3
  });

  // Update store with satellite data
  useEffect(() => {
    if (satellites.length > 0) {
      setSatellites(satellites);
    }
  }, [satellites, setSatellites]);

  // Update store with loading state
  useEffect(() => {
    setLoading(satelliteLoading);
  }, [satelliteLoading, setLoading]);

  // Update store with error state
  useEffect(() => {
    if (satelliteError) {
      setError(`Failed to load satellite data: ${satelliteError.message}`);
    } else {
      setError(null);
    }
  }, [satelliteError, setError]);

  // Optimized real-time position updates with error handling and reduced frequency
  useEffect(() => {
    if (satellites.length === 0) return;

    const updatePositions = async () => {
      try {
        // Process satellites in smaller batches to avoid blocking (reduced for performance)
        const batchSize = 50; // Reduced from 100
        const updatedSatellites = [...satellites];
        
        for (let i = 0; i < satellites.length; i += batchSize) {
          const batch = satellites.slice(i, i + batchSize);
          
          batch.forEach((sat, index) => {
            try {
              // Only update if TLE data is valid
              if (sat.tle?.line1 && sat.tle?.line2 && sat.tle.line1.length > 10 && sat.tle.line2.length > 10) {
                const position = spaceTrackAPI.calculatePosition(sat.tle.line1, sat.tle.line2);
                const actualIndex = i + index;
                updatedSatellites[actualIndex] = {
                  ...sat,
                  position: {
                    ...position,
                    timestamp: Date.now()
                  }
                };
              }
            } catch (error) {
              // Silently fail for individual satellites to avoid console spam
              // Keep original position data
            }
          });
          
          // Yield control to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        setSatellites(updatedSatellites);
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    };

    // Reduced frequency from 10 seconds to 15 seconds for weaker devices
    const interval = setInterval(updatePositions, 15000);
    return () => clearInterval(interval);
  }, [satellites.length, setSatellites]); // Only depend on satellites.length, not the entire array

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // User location logic can be added here if needed
        },
        (error) => {
          console.warn('Could not get user location:', error);
        }
      );
    }
  }, []);

  return {
    satellites,
    isLoading: satelliteLoading,
    error: satelliteError,
    refetch: refetchSatellites
  };
};