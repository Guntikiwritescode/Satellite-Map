import { useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSatelliteStore } from '../stores/satelliteStore';
import { spaceTrackAPI } from '../services/spaceTrackAPI';
import { logger } from '../lib/logger';
import { 
  PERFORMANCE_CONFIG, 
  API_CONFIG, 
  ERROR_MESSAGES, 
  FEATURE_FLAGS 
} from '../lib/constants';

const COMPONENT_CONTEXT = { component: 'useSatelliteData' };

export const useSatelliteData = () => {
  const { setSatellites, setError, setLoading } = useSatelliteStore();

  // Test connectivity with better error handling
  const testConnectivity = useCallback(async (): Promise<void> => {
    try {
      logger.debug('Testing API connectivity', {
        ...COMPONENT_CONTEXT,
        action: 'testConnectivity'
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/space-track-proxy', {
        method: 'OPTIONS',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Connectivity test failed: ${response.status}`);
      }
      
      logger.debug('API connectivity test passed', COMPONENT_CONTEXT);
    } catch (error) {
      logger.error('API connectivity test failed', COMPONENT_CONTEXT, error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Connection timeout. The service may be temporarily unavailable.');
      }
      
      throw new Error('Cannot connect to satellite data service. The service may be temporarily unavailable.');
    }
  }, []);

  // Optimized satellite fetching function
  const fetchSatelliteData = useCallback(async () => {
    logger.info('Starting satellite data fetch', {
      ...COMPONENT_CONTEXT,
      action: 'fetchSatelliteData'
    });
    
    // Test connectivity first
    await testConnectivity();
    
    try {
      const result = await spaceTrackAPI.getAllActiveSatellites();
      
      if (!result || result.length === 0) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }
      
      logger.info('Successfully fetched satellite data', {
        ...COMPONENT_CONTEXT,
        action: 'fetchSatelliteData'
      }, { count: result.length });
      
      return result;
    } catch (error) {
      logger.error('Satellite fetch error', {
        ...COMPONENT_CONTEXT,
        action: 'fetchSatelliteData'
      }, error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }
        if (error.message.includes('timeout')) {
          throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error(ERROR_MESSAGES.API_ERROR);
        }
      }
      
      throw error;
    }
  }, [testConnectivity]);

  // Fetch satellite data with proper error handling and caching
  const { 
    data: satellites = [], 
    error: satelliteError, 
    isLoading: satelliteLoading,
    refetch: refetchSatellites 
  } = useQuery({
    queryKey: ['satellites', 'unlimited'],
    queryFn: fetchSatelliteData,
    refetchInterval: PERFORMANCE_CONFIG.DATA_REFRESH_INTERVAL,
    staleTime: PERFORMANCE_CONFIG.DATA_REFRESH_INTERVAL / 2,
    retry: API_CONFIG.MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Memoize satellite processing to avoid unnecessary recalculations
  const processedSatellites = useMemo(() => {
    if (!satellites.length) return [];
    
    // Validate and filter satellites
    return satellites.filter(sat => {
      return sat && 
             sat.id && 
             sat.name && 
             typeof sat.position?.latitude === 'number' &&
             typeof sat.position?.longitude === 'number';
    });
  }, [satellites]);

  // Update store with satellite data
  useEffect(() => {
    if (processedSatellites.length > 0) {
      setSatellites(processedSatellites);
    }
  }, [processedSatellites, setSatellites]);

  // Update store with loading state
  useEffect(() => {
    setLoading(satelliteLoading);
  }, [satelliteLoading, setLoading]);

  // Update store with error state
  useEffect(() => {
    if (satelliteError) {
      const errorMessage = satelliteError instanceof Error 
        ? satelliteError.message 
        : ERROR_MESSAGES.UNKNOWN_ERROR;
      
      logger.error('Satellite data error', COMPONENT_CONTEXT, satelliteError);
      setError(`Failed to load satellite data: ${errorMessage}`);
    } else {
      setError(null);
    }
  }, [satelliteError, setError]);

  // Optimized real-time position updates with better performance
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_REAL_TIME_UPDATES || processedSatellites.length === 0) {
      return;
    }

    let isActive = true;
    let timeoutId: NodeJS.Timeout;

    const updatePositions = async () => {
      if (!isActive) return;
      
      try {
        // Process satellites in smaller batches to avoid blocking
        const batchSize = API_CONFIG.BATCH_SIZE;
        const updatedSatellites = [...processedSatellites];
        
        for (let i = 0; i < processedSatellites.length && isActive; i += batchSize) {
          const batch = processedSatellites.slice(i, i + batchSize);
          
          batch.forEach((sat, index) => {
            if (!isActive) return;
            
            try {
              // Only update if TLE data is valid
              if (sat.tle?.line1?.length > 10 && sat.tle?.line2?.length > 10) {
                const position = spaceTrackAPI.calculatePosition(sat.tle.line1, sat.tle.line2);
                const actualIndex = i + index;
                
                if (actualIndex < updatedSatellites.length) {
                  updatedSatellites[actualIndex] = {
                    ...sat,
                    position: {
                      ...position,
                      timestamp: Date.now()
                    }
                  };
                }
              }
            } catch (error) {
              // Silently handle individual satellite errors to avoid console spam
              logger.debug('Error updating individual satellite position', {
                ...COMPONENT_CONTEXT,
                action: 'updatePositions'
              }, { satelliteId: sat.id, error });
            }
          });
          
          // Yield control to prevent blocking
          if (isActive) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        if (isActive) {
          setSatellites(updatedSatellites);
        }
      } catch (error) {
        logger.error('Error updating satellite positions', {
          ...COMPONENT_CONTEXT,
          action: 'updatePositions'
        }, error);
      } finally {
        if (isActive) {
          timeoutId = setTimeout(updatePositions, PERFORMANCE_CONFIG.POSITION_UPDATE_INTERVAL);
        }
      }
    };

    // Start position updates
    timeoutId = setTimeout(updatePositions, PERFORMANCE_CONFIG.POSITION_UPDATE_INTERVAL);

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [processedSatellites.length, setSatellites]);

  // Get user location with improved error handling
  useEffect(() => {
    if (!navigator.geolocation) {
      logger.debug('Geolocation not supported', COMPONENT_CONTEXT);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        logger.debug('User location obtained', {
          ...COMPONENT_CONTEXT,
          action: 'getUserLocation'
        }, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        // User location logic can be added here if needed
      },
      (error) => {
        // Only log significant errors
        if (error.code === error.PERMISSION_DENIED) {
          logger.debug('Geolocation permission denied', COMPONENT_CONTEXT);
        } else {
          logger.warn('Could not get user location', {
            ...COMPONENT_CONTEXT,
            action: 'getUserLocation'
          }, error);
        }
      },
      options
    );
  }, []);

  return {
    satellites: processedSatellites,
    isLoading: satelliteLoading,
    error: satelliteError,
    refetch: refetchSatellites
  };
};