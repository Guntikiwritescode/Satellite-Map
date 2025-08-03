import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { spaceTrackAPI } from '../services/spaceTrackAPI';
import { getPerformanceSettings } from '../utils/performance';

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
      
      // Test connectivity first with more detailed error handling
      try {
        console.log('Testing connectivity to Supabase edge function...');
        const testUrl = 'https://dnjhvmwznqsunjpabacg.supabase.co/functions/v1/space-track-proxy';
        console.log('Testing URL:', testUrl);
        
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuamh2bXd6bnFzdW5qcGFiYWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTQ0MjksImV4cCI6MjA2OTM5MDQyOX0.dLdc08Hq6IpvjSb8cmVNwaTz8s2h439aMviVvNIxYNM`
          },
          body: JSON.stringify({ action: 'authenticate' })
        });
        console.log('Test response status:', testResponse.status);
        console.log('Test response headers:', [...testResponse.headers.entries()]);
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('Test response error:', errorText);
          throw new Error(`Edge function test failed: ${testResponse.status} - ${errorText}`);
        }
      } catch (error) {
        console.error('Connectivity test failed:', error);
        throw new Error(`Cannot connect to satellite data service: ${error.message}`);
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
    refetchInterval: 15 * 60 * 1000, // 15 minutes - optimized for performance
    staleTime: 5 * 60 * 1000, // 5 minutes cache time
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
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
        // Use adaptive batch size based on device performance
        const { batchSize } = getPerformanceSettings();
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

    // Use adaptive update interval based on device performance
    const { updateInterval } = getPerformanceSettings();
    const interval = setInterval(updatePositions, updateInterval);
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