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
    queryKey: ['satellites'],
    queryFn: () => spaceTrackAPI.getLEOSatellites(200),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // Real-time position updates
  useEffect(() => {
    if (satellites.length === 0) return;

    const updatePositions = async () => {
      try {
        const updatedSatellites = satellites.map(sat => {
          try {
            const position = spaceTrackAPI.calculatePosition(sat.tle.line1, sat.tle.line2);
            return {
              ...sat,
              position: {
                ...position,
                timestamp: Date.now()
              }
            };
          } catch (error) {
            return sat;
          }
        });
        setSatellites(updatedSatellites);
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    };

    const interval = setInterval(updatePositions, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [satellites, setSatellites]);

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