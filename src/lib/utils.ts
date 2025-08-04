import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  Satellite, 
  Position, 
  ValidationRules, 
  SatelliteId, 
  Timestamp,
  SatelliteType,
  SatelliteStatus
} from '@/types/satellite.types'
import { SATELLITE_CONFIG } from '@/lib/constants'

// Original utility function for Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Satellite-specific utility functions

/**
 * Safely formats a number to a specified number of decimal places
 */
export const formatNumber = (value: number | undefined, decimals: number = 2): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
};

/**
 * Formats altitude in kilometers with appropriate units
 */
export const formatAltitude = (altitude: number | undefined): string => {
  if (typeof altitude !== 'number' || isNaN(altitude)) {
    return 'N/A';
  }
  
  if (altitude > 1000) {
    return `${formatNumber(altitude / 1000, 1)}k km`;
  }
  return `${formatNumber(altitude)} km`;
};

/**
 * Formats coordinates with proper precision
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  if (!ValidationRules.latitude(latitude) || !ValidationRules.longitude(longitude)) {
    return 'Invalid coordinates';
  }
  
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';
  
  return `${formatNumber(Math.abs(latitude), 4)}°${latDirection}, ${formatNumber(Math.abs(longitude), 4)}°${lonDirection}`;
};

/**
 * Calculates the distance between two positions using Haversine formula
 */
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const R = SATELLITE_CONFIG.EARTH_RADIUS; // Earth's radius in km
  const dLat = toRadians(pos2.latitude - pos1.latitude);
  const dLon = toRadians(pos2.longitude - pos1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pos1.latitude)) * 
    Math.cos(toRadians(pos2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Converts degrees to radians
 */
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Converts radians to degrees
 */
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Validates and sanitizes satellite data
 */
export const sanitizeSatellite = (satellite: Partial<Satellite>): Satellite | null => {
  try {
    if (!satellite.id || !satellite.name) {
      return null;
    }

    // Ensure required fields exist with defaults
    const sanitized: Satellite = {
      id: String(satellite.id).trim(),
      name: String(satellite.name).trim(),
      type: isValidSatelliteType(satellite.type) ? satellite.type : 'unknown',
      status: isValidSatelliteStatus(satellite.status) ? satellite.status : 'unknown',
      position: sanitizePosition(satellite.position) || {
        latitude: 0,
        longitude: 0,
        altitude: SATELLITE_CONFIG.DEFAULT_ALTITUDE,
        timestamp: Date.now(),
      },
      velocity: typeof satellite.velocity === 'number' ? satellite.velocity : SATELLITE_CONFIG.DEFAULT_VELOCITY,
      heading: typeof satellite.heading === 'number' ? satellite.heading : 0,
      orbital: {
        period: typeof satellite.orbital?.period === 'number' ? satellite.orbital.period : 90,
        inclination: clampValue(satellite.orbital?.inclination || 0, 0, 180),
        eccentricity: clampValue(satellite.orbital?.eccentricity || 0, 0, 1),
        perigee: Math.max(0, satellite.orbital?.perigee || SATELLITE_CONFIG.DEFAULT_ALTITUDE),
        apogee: Math.max(0, satellite.orbital?.apogee || 450),
        epoch: satellite.orbital?.epoch || new Date().toISOString(),
      },
      metadata: {
        constellation: satellite.metadata?.constellation || 'Other',
        country: satellite.metadata?.country || 'Unknown',
        launchDate: satellite.metadata?.launchDate || new Date().toISOString(),
        purpose: satellite.metadata?.purpose || 'Satellite Operations',
        owner: satellite.metadata?.owner,
        mass: typeof satellite.metadata?.mass === 'number' ? satellite.metadata.mass : undefined,
        power: typeof satellite.metadata?.power === 'number' ? satellite.metadata.power : undefined,
      },
      tle: {
        line1: satellite.tle?.line1 || `1 ${satellite.id}`,
        line2: satellite.tle?.line2 || `2 ${satellite.id}`,
      },
    };

    return sanitized;
  } catch (error) {
    return null;
  }
};

/**
 * Sanitizes position data
 */
export const sanitizePosition = (position: Partial<Position> | undefined): Position | null => {
  if (!position) return null;

  const latitude = typeof position.latitude === 'number' ? position.latitude : 0;
  const longitude = typeof position.longitude === 'number' ? position.longitude : 0;
  const altitude = typeof position.altitude === 'number' ? position.altitude : SATELLITE_CONFIG.DEFAULT_ALTITUDE;

  if (!ValidationRules.latitude(latitude) || !ValidationRules.longitude(longitude)) {
    return null;
  }

  return {
    latitude: clampValue(latitude, -90, 90),
    longitude: clampValue(longitude, -180, 180),
    altitude: Math.max(0, altitude),
    timestamp: position.timestamp || Date.now(),
  };
};

/**
 * Clamps a value between min and max
 */
export const clampValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Type guards for satellite properties
 */
export const isValidSatelliteType = (type: unknown): type is SatelliteType => {
  const validTypes: SatelliteType[] = [
    'communication', 'navigation', 'weather', 'scientific', 'earth-observation',
    'space-station', 'military', 'constellation', 'rocket-body', 'debris', 'unknown'
  ];
  return typeof type === 'string' && validTypes.includes(type as SatelliteType);
};

export const isValidSatelliteStatus = (status: unknown): status is SatelliteStatus => {
  const validStatuses: SatelliteStatus[] = ['active', 'inactive', 'decayed', 'unknown'];
  return typeof status === 'string' && validStatuses.includes(status as SatelliteStatus);
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Formats timestamp to human-readable date
 */
export const formatTimestamp = (timestamp: Timestamp): string => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

/**
 * Formats time difference to human-readable format
 */
export const formatTimeDifference = (timestamp: Timestamp): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};

/**
 * Generates a unique identifier
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Creates a deep copy of an object (for immutability)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Removes undefined and null values from an object
 */
export const removeEmptyValues = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  
  return result;
};

/**
 * Determines if a satellite is currently visible (above horizon)
 */
export const isSatelliteVisible = (satellite: Satellite, userPosition?: Position): boolean => {
  if (!userPosition) return false;
  
  // Simple visibility check based on altitude angle
  // This is a simplified calculation - real visibility depends on many factors
  const distance = calculateDistance(satellite.position, userPosition);
  const altitudeAngle = Math.atan2(satellite.position.altitude, distance);
  
  // Satellite is visible if altitude angle > 0 degrees (above horizon)
  return altitudeAngle > 0;
};

/**
 * Calculates orbital period using Kepler's third law (simplified)
 */
export const calculateOrbitalPeriod = (altitude: number): number => {
  const earthRadius = SATELLITE_CONFIG.EARTH_RADIUS;
  const semiMajorAxis = earthRadius + altitude;
  const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
  
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu) / 60; // Convert to minutes
};
