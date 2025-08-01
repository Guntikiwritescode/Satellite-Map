export interface Satellite {
  id: string;
  name: string;
  type: SatelliteType;
  country: string;
  agency: string;
  launchDate: string;
  status: SatelliteStatus;
  description?: string; // Historical summary and role description
  wikipediaUrl?: string; // Link to Wikipedia page
  orbital: {
    altitude: number; // km
    period: number; // minutes
    inclination: number; // degrees
    eccentricity: number;
    velocity: number; // km/s
  };
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: number;
  };
  tle: {
    line1: string;
    line2: string;
  };
  nextPasses?: PassInfo[];
  footprint?: number; // radius in km
}

export interface PassInfo {
  startTime: Date;
  maxElevation: number;
  duration: number; // minutes
  direction: string;
}

export type SatelliteType = 
  | 'communication'
  | 'weather'
  | 'navigation'
  | 'scientific'
  | 'military'
  | 'earth-observation'
  | 'space-station'
  | 'constellation'
  | 'commercial';

export type SatelliteStatus = 'active' | 'inactive' | 'decayed' | 'unknown';

export interface Launch {
  id: string;
  name: string;
  launchDate: Date;
  status: LaunchStatus;
  rocket: string;
  agency: string;
  mission: string;
  launchSite: string;
  payloads: string[];
  countdown?: number;
}

export type LaunchStatus = 'scheduled' | 'successful' | 'failed' | 'in-flight' | 'cancelled';

export interface SatelliteFilters {
  types: SatelliteType[];
  countries: string[];
  agencies: string[];
  status: SatelliteStatus[];
  altitudeRange: [number, number];
  launchDateRange: [Date | null, Date | null];
  searchQuery: string;
  showOnlyVisible: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface Globe3DSettings {
  showFootprints: boolean;
  showCities: boolean;
  showTerminator: boolean;
  timeSpeed: number; // multiplier for real-time
  isPaused: boolean;
  selectedSatelliteId: string | null;
  cameraFollowSatellite: boolean;
}