import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { satelliteAPI } from '../services/satelliteAPI';

export const useSatelliteData = () => {
  const { setSatellites, updateSatellitePositions, setLaunches, setLoading, setError } = useSatelliteStore();

  // Fetch initial satellite data with fallback
  const { data: satellites, isLoading: satellitesLoading, error: satellitesError } = useQuery({
    queryKey: ['satellites'],
    queryFn: () => satelliteAPI.getSatellitesWithFallback(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch launch data
  const { data: launches, isLoading: launchesLoading, error: launchesError } = useQuery({
    queryKey: ['launches'],
    queryFn: () => satelliteAPI.getLaunches(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });

  // Update store when data changes
  useEffect(() => {
    if (satellites) {
      console.log('Loading satellites:', satellites.length);
      setSatellites(satellites);
    }
  }, [satellites, setSatellites]);

  useEffect(() => {
    if (launches) {
      console.log('Loading launches:', launches.length);
      setLaunches(launches);
    }
  }, [launches, setLaunches]);

  // Handle errors
  useEffect(() => {
    if (satellitesError) {
      console.error('Error loading satellites:', satellitesError);
      setError(`Failed to load satellite data: ${satellitesError.message}`);
    }
    if (launchesError) {
      console.error('Error loading launches:', launchesError);
      setError(`Failed to load launch data: ${launchesError.message}`);
    }
  }, [satellitesError, launchesError, setError]);

  // Update loading state
  useEffect(() => {
    const loading = satellitesLoading || launchesLoading;
    console.log('Loading state:', loading);
    setLoading(loading);
  }, [satellitesLoading, launchesLoading, setLoading]);

  // Start real-time updates with smooth position updates
  useEffect(() => {
    const handlePositionUpdate = (updatedSatellites: any[]) => {
      // Extract only position updates to avoid full re-render
      const positionUpdates = updatedSatellites.map(sat => ({
        id: sat.id,
        position: sat.position
      }));
      
      console.log('Smooth position update for', positionUpdates.length, 'satellites');
      updateSatellitePositions(positionUpdates);
    };

    // Only start real-time updates if we have initial data and avoid dependency loops
    if (satellites && satellites.length > 0) {
      console.log('Starting smooth real-time updates for', satellites.length, 'satellites');
      satelliteAPI.startRealTimeUpdates(handlePositionUpdate);
    }

    return () => {
      satelliteAPI.stopRealTimeUpdates();
    };
  }, [satellites?.length, updateSatellitePositions]); // Only depend on satellite count, not full array

  // Get geolocation for user
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          useSatelliteStore.getState().setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.warn('Failed to get user location:', error);
          // Default to a central location if geolocation fails
          useSatelliteStore.getState().setUserLocation({ 
            latitude: 40.7128, 
            longitude: -74.0060 // New York City
          });
        }
      );
    }
  }, []);

  return {
    isLoading: satellitesLoading || launchesLoading,
    satellites,
    launches,
  };
};