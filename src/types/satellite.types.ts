// Base types for better type safety
export type SatelliteId = string;
export type Latitude = number; // -90 to 90
export type Longitude = number; // -180 to 180
export type Altitude = number; // in kilometers
export type Timestamp = number; // Unix timestamp

// Satellite status with strict typing
export type SatelliteStatus = 'active' | 'inactive' | 'decayed' | 'unknown';

// Satellite types with comprehensive categories
export type SatelliteType = 
  | 'communication'
  | 'navigation' 
  | 'weather'
  | 'scientific'
  | 'earth-observation'
  | 'space-station'
  | 'military'
  | 'constellation'
  | 'rocket-body'
  | 'debris'
  | 'unknown';

// Position interface with validation constraints
export interface Position {
  readonly latitude: Latitude;
  readonly longitude: Longitude;
  readonly altitude: Altitude;
  readonly timestamp: Timestamp;
}

// TLE (Two-Line Element) data with validation
export interface TLEData {
  readonly line1: string;
  readonly line2: string;
}

// Orbital parameters with proper ranges
export interface OrbitalParameters {
  readonly period: number; // minutes
  readonly inclination: number; // degrees (0-180)
  readonly eccentricity: number; // (0-1)
  readonly perigee: Altitude; // km
  readonly apogee: Altitude; // km
  readonly epoch: string; // ISO string
}

// Metadata with optional fields properly typed
export interface SatelliteMetadata {
  readonly constellation?: string;
  readonly country?: string;
  readonly launchDate?: string; // ISO string
  readonly purpose?: string;
  readonly owner?: string;
  readonly mass?: number; // kg
  readonly power?: number; // watts
}

// Main satellite interface with readonly properties for immutability
export interface Satellite {
  readonly id: SatelliteId;
  readonly name: string;
  readonly type: SatelliteType;
  readonly status: SatelliteStatus;
  readonly position: Position;
  readonly velocity: number; // km/s
  readonly heading: number; // degrees
  readonly orbital: OrbitalParameters;
  readonly metadata: SatelliteMetadata;
  readonly tle: TLEData;
}

// Filters with proper typing and constraints
export interface SatelliteFilters {
  readonly types: readonly SatelliteType[];
  readonly countries: readonly string[];
  readonly agencies: readonly string[];
  readonly status: readonly SatelliteStatus[];
  readonly altitudeRange: readonly [number, number];
  readonly launchDateRange: readonly [Date | null, Date | null];
  readonly searchQuery: string;
  readonly showOnlyVisible: boolean;
}

// Launch information interface
export interface Launch {
  readonly id: string;
  readonly name: string;
  readonly date: string; // ISO string
  readonly vehicle: string;
  readonly site: string;
  readonly success: boolean;
  readonly payloads: readonly string[];
}

// User location with optional fields
export interface UserLocation {
  readonly latitude: Latitude;
  readonly longitude: Longitude;
  readonly accuracy?: number; // meters
  readonly timestamp?: Timestamp;
}

// Globe 3D settings with proper defaults
export interface Globe3DSettings {
  readonly showFootprints: boolean;
  readonly showCities: boolean;
  readonly showTerminator: boolean;
  readonly timeSpeed: number; // multiplier
  readonly isPaused: boolean;
  readonly selectedSatelliteId: SatelliteId | null;
}

// API Response types for better error handling
export interface APIResponse<T> {
  readonly data?: T;
  readonly error?: string;
  readonly status: number;
  readonly timestamp: Timestamp;
}

export interface SatelliteAPIResponse extends APIResponse<Satellite[]> {}

// Validation helpers
export const ValidationRules = {
  latitude: (value: number): value is Latitude => value >= -90 && value <= 90,
  longitude: (value: number): value is Longitude => value >= -180 && value <= 180,
  altitude: (value: number): value is Altitude => value >= 0 && value <= 50000,
  inclination: (value: number): boolean => value >= 0 && value <= 180,
  eccentricity: (value: number): boolean => value >= 0 && value <= 1,
  satelliteId: (value: string): value is SatelliteId => /^[a-zA-Z0-9\-_]+$/.test(value),
} as const;

// Type guards for runtime validation
export const isValidPosition = (position: unknown): position is Position => {
  return (
    typeof position === 'object' &&
    position !== null &&
    'latitude' in position &&
    'longitude' in position &&
    'altitude' in position &&
    'timestamp' in position &&
    ValidationRules.latitude((position as Position).latitude) &&
    ValidationRules.longitude((position as Position).longitude) &&
    ValidationRules.altitude((position as Position).altitude) &&
    typeof (position as Position).timestamp === 'number'
  );
};

export const isValidSatellite = (satellite: unknown): satellite is Satellite => {
  return (
    typeof satellite === 'object' &&
    satellite !== null &&
    'id' in satellite &&
    'name' in satellite &&
    'type' in satellite &&
    'status' in satellite &&
    'position' in satellite &&
    ValidationRules.satelliteId((satellite as Satellite).id) &&
    typeof (satellite as Satellite).name === 'string' &&
    isValidPosition((satellite as Satellite).position)
  );
};

// Utility types for component props
export type SatelliteListProps = {
  readonly satellites: readonly Satellite[];
  readonly onSatelliteSelect?: (satellite: Satellite) => void;
  readonly selectedSatelliteId?: SatelliteId | null;
};

export type FilterProps = {
  readonly filters: SatelliteFilters;
  readonly onFiltersChange: (filters: Partial<SatelliteFilters>) => void;
  readonly availableTypes: readonly SatelliteType[];
  readonly availableCountries: readonly string[];
};

// Error types for better error handling
export interface SatelliteError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Timestamp;
}

// Event types for analytics (if enabled)
export interface SatelliteEvent {
  readonly type: 'satellite_selected' | 'filter_applied' | 'data_refreshed' | 'error_occurred';
  readonly satelliteId?: SatelliteId;
  readonly timestamp: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

// Export commonly used type aliases
export type SatelliteArray = readonly Satellite[];
export type FilterableField = keyof Pick<Satellite, 'type' | 'status'>;
export type SortableField = keyof Pick<Satellite, 'name' | 'type' | 'altitude'>;

// Constants for type validation
export const SATELLITE_TYPES: readonly SatelliteType[] = [
  'communication',
  'navigation',
  'weather',
  'scientific',
  'earth-observation',
  'space-station',
  'military',
  'constellation',
  'rocket-body',
  'debris',
  'unknown'
] as const;

export const SATELLITE_STATUSES: readonly SatelliteStatus[] = [
  'active',
  'inactive',
  'decayed',
  'unknown'
] as const;