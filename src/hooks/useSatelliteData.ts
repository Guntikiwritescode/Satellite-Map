import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { satelliteAPI } from '../services/satelliteAPI';

export const useSatelliteData = () => {
  const { setSatellites, setLaunches, setLoading, setError } = useSatelliteStore();

  // Fetch initial satellite data
  const { data: satellites, isLoading: satellitesLoading } = useQuery({
    queryKey: ['satellites'],
    queryFn: () => satelliteAPI.getSatellites(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch launch data
  const { data: launches, isLoading: launchesLoading } = useQuery({
    queryKey: ['launches'],
    queryFn: () => satelliteAPI.getLaunches(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });

  // Update store when data changes
  useEffect(() => {
    if (satellites) {
      setSatellites(satellites);
    }
  }, [satellites, setSatellites]);

  useEffect(() => {
    if (launches) {
      setLaunches(launches);
    }
  }, [launches, setLaunches]);

  // Update loading state
  useEffect(() => {
    setLoading(satellitesLoading || launchesLoading);
  }, [satellitesLoading, launchesLoading, setLoading]);

  // Start real-time updates
  useEffect(() => {
    const handleRealTimeUpdate = (updatedSatellites: any[]) => {
      setSatellites(updatedSatellites);
    };

    satelliteAPI.startRealTimeUpdates(handleRealTimeUpdate);

    return () => {
      satelliteAPI.stopRealTimeUpdates();
    };
  }, [setSatellites]);

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