import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Satellite, SatelliteFilters, Launch, UserLocation, Globe3DSettings } from '../types/satellite.types';
import { logger } from '../lib/logger';
import { PERFORMANCE_CONFIG, ERROR_MESSAGES } from '../lib/constants';

interface SatelliteStore {
  // Data
  satellites: Satellite[];
  launches: Launch[];
  userLocation: UserLocation | null;
  
  // UI State
  filters: SatelliteFilters;
  globeSettings: Globe3DSettings;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  viewMode: 'globe' | 'spreadsheet' | 'guide' | 'education';
  maxDisplaySatellites: number;
  
  // Computed
  filteredSatellites: Satellite[];
  
  // Actions
  setSatellites: (satellites: Satellite[]) => void;
  updateSatellitePositions: (positionUpdates: { id: string; position: Satellite['position'] }[]) => void;
  updateSatellitePosition: (id: string, position: Satellite['position']) => void;
  setLaunches: (launches: Launch[]) => void;
  setUserLocation: (location: UserLocation) => void;
  updateFilters: (filters: Partial<SatelliteFilters>) => void;
  updateGlobeSettings: (settings: Partial<Globe3DSettings>) => void;
  setSelectedSatellite: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'globe' | 'spreadsheet' | 'guide' | 'education') => void;
  setMaxDisplaySatellites: (max: number) => void;
  
  // Utility
  getSatelliteById: (id: string) => Satellite | undefined;
  getSelectedSatellite: () => Satellite | undefined;
  resetFilters: () => void;
  applyFilters: (satellites: Satellite[], filters: SatelliteFilters) => Satellite[];
}

const defaultFilters: SatelliteFilters = {
  types: [],
  countries: [],
  agencies: [],
  status: [],
  altitudeRange: [0, 50000],
  launchDateRange: [null, null],
  searchQuery: '',
  showOnlyVisible: false,
};

const defaultGlobeSettings: Globe3DSettings = {
  showFootprints: false,
  showCities: true,
  showTerminator: true,
  timeSpeed: 1,
  isPaused: false,
  selectedSatelliteId: null,
};

const COMPONENT_CONTEXT = { component: 'SatelliteStore' };

// Optimized filter function with memoization-friendly approach
const createFilteredSatellites = (satellites: Satellite[], filters: SatelliteFilters, maxDisplay: number): Satellite[] => {
  // Early return for empty data
  if (satellites.length === 0) {
    return [];
  }
  
  // Use a single pass filter with early exits for better performance
  const filtered = satellites.filter(satellite => {
    // Type filter - early exit
    if (filters.types.length > 0 && !filters.types.includes(satellite.type)) {
      return false;
    }
    
    // Country filter - early exit
    const country = satellite.metadata?.country || 'Unknown';
    if (filters.countries.length > 0 && !filters.countries.includes(country)) {
      return false;
    }
    
    // Agency filter - early exit
    const agency = satellite.metadata?.constellation || 'Individual';
    if (filters.agencies.length > 0 && !filters.agencies.includes(agency)) {
      return false;
    }
    
    // Status filter - early exit
    if (filters.status.length > 0 && !filters.status.includes(satellite.status)) {
      return false;
    }
    
    // Altitude range filter - early exit
    const altitude = satellite.position?.altitude || 0;
    const [minAlt, maxAlt] = filters.altitudeRange;
    if (altitude < minAlt || altitude > maxAlt) {
      return false;
    }
    
    // Search query filter - early exit
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const name = satellite.name.toLowerCase();
      const constellation = (satellite.metadata?.constellation || '').toLowerCase();
      const satelliteCountry = (satellite.metadata?.country || '').toLowerCase();
      const type = satellite.type.toLowerCase();
      
      if (!name.includes(query) && !constellation.includes(query) && 
          !satelliteCountry.includes(query) && !type.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Optimized sorting - only sort if needed and multiple items exist
  if (filtered.length > 1) {
    filtered.sort((a, b) => (a.position?.altitude || 0) - (b.position?.altitude || 0));
  }
  
  // Apply limit efficiently
  return filtered.length > maxDisplay ? filtered.slice(0, maxDisplay) : filtered;
};

export const useSatelliteStore = create<SatelliteStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    satellites: [],
    launches: [],
    userLocation: null,
    filters: defaultFilters,
    globeSettings: defaultGlobeSettings,
    isLoading: false,
    error: null,
    lastUpdate: 0,
    viewMode: 'globe',
    maxDisplaySatellites: PERFORMANCE_CONFIG.MAX_DISPLAY_SATELLITES,
    
    // Computed - cached for performance
    filteredSatellites: [],
    
    // Actions
    setSatellites: (satellites) => {
      try {
        const state = get();
        const filtered = createFilteredSatellites(satellites, state.filters, state.maxDisplaySatellites);
        set({ 
          satellites, 
          filteredSatellites: filtered,
          lastUpdate: Date.now(),
          error: null 
        });
      } catch (error) {
        logger.error('Error setting satellites', {
          ...COMPONENT_CONTEXT,
          action: 'setSatellites'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    updateSatellitePositions: (positionUpdates) => {
      try {
        set((state) => {
          const updatedSatellites = state.satellites.map(satellite => {
            const update = positionUpdates.find(u => u.id === satellite.id);
            return update ? { ...satellite, position: update.position } : satellite;
          });
          
          const filtered = createFilteredSatellites(updatedSatellites, state.filters, state.maxDisplaySatellites);
          return {
            satellites: updatedSatellites,
            filteredSatellites: filtered,
            lastUpdate: Date.now()
          };
        });
      } catch (error) {
        logger.error('Error updating satellite positions', {
          ...COMPONENT_CONTEXT,
          action: 'updateSatellitePositions'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    updateSatellitePosition: (id, position) => {
      try {
        set((state) => {
          const updatedSatellites = state.satellites.map(sat =>
            sat.id === id ? { ...sat, position } : sat
          );
          const filtered = createFilteredSatellites(updatedSatellites, state.filters, state.maxDisplaySatellites);
          return {
            satellites: updatedSatellites,
            filteredSatellites: filtered,
            lastUpdate: Date.now()
          };
        });
      } catch (error) {
        logger.error('Error updating satellite position', {
          ...COMPONENT_CONTEXT,
          action: 'updateSatellitePosition'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    setLaunches: (launches) => set({ launches }),
    
    setUserLocation: (userLocation) => set({ userLocation }),
    
    updateFilters: (newFilters) => {
      try {
        const state = get();
        const updatedFilters = { ...state.filters, ...newFilters };
        const filtered = createFilteredSatellites(state.satellites, updatedFilters, state.maxDisplaySatellites);
        set({ 
          filters: updatedFilters,
          filteredSatellites: filtered
        });
      } catch (error) {
        logger.error('Error updating filters', {
          ...COMPONENT_CONTEXT,
          action: 'updateFilters'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    updateGlobeSettings: (newSettings) => {
      try {
        set((state) => ({
          globeSettings: { ...state.globeSettings, ...newSettings }
        }));
      } catch (error) {
        logger.error('Error updating globe settings', {
          ...COMPONENT_CONTEXT,
          action: 'updateGlobeSettings'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    setSelectedSatellite: (id) => {
      try {
        logger.debug('Selecting satellite', {
          ...COMPONENT_CONTEXT,
          action: 'setSelectedSatellite'
        }, { satelliteId: id });
        
        set((state) => ({
          globeSettings: { ...state.globeSettings, selectedSatelliteId: id }
        }));
      } catch (error) {
        logger.error('Error setting selected satellite', {
          ...COMPONENT_CONTEXT,
          action: 'setSelectedSatellite'
        }, error);
        
        const errorMessage = error instanceof Error 
          ? `Failed to select satellite: ${error.message}` 
          : ERROR_MESSAGES.UNKNOWN_ERROR;
        set({ error: errorMessage });
      }
    },
    
    setLoading: (isLoading) => set({ isLoading }),
    
    setError: (error) => set({ error }),
    
    setViewMode: (viewMode) => set({ viewMode }),
    
    setMaxDisplaySatellites: (maxDisplaySatellites) => {
      try {
        const state = get();
        const filtered = createFilteredSatellites(state.satellites, state.filters, maxDisplaySatellites);
        set({ 
          maxDisplaySatellites,
          filteredSatellites: filtered
        });
      } catch (error) {
        logger.error('Error setting max display satellites', {
          ...COMPONENT_CONTEXT,
          action: 'setMaxDisplaySatellites'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    // Utility functions
    getSatelliteById: (id) => {
      try {
        return get().satellites.find(sat => sat.id === id);
      } catch (error) {
        logger.error('Error getting satellite by ID', {
          ...COMPONENT_CONTEXT,
          action: 'getSatelliteById'
        }, error);
        return undefined;
      }
    },
    
    getSelectedSatellite: () => {
      try {
        const { satellites, globeSettings } = get();
        if (!globeSettings.selectedSatelliteId) return undefined;
        return satellites.find(sat => sat.id === globeSettings.selectedSatelliteId);
      } catch (error) {
        logger.error('Error getting selected satellite', {
          ...COMPONENT_CONTEXT,
          action: 'getSelectedSatellite'
        }, error);
        return undefined;
      }
    },
    
    resetFilters: () => {
      try {
        const state = get();
        const filtered = createFilteredSatellites(state.satellites, defaultFilters, state.maxDisplaySatellites);
        set({ 
          filters: defaultFilters,
          filteredSatellites: filtered
        });
      } catch (error) {
        logger.error('Error resetting filters', {
          ...COMPONENT_CONTEXT,
          action: 'resetFilters'
        }, error);
        set({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
      }
    },
    
    applyFilters: (satellites, filters) => {
      try {
        const maxDisplay = get().maxDisplaySatellites;
        return createFilteredSatellites(satellites, filters, maxDisplay);
      } catch (error) {
        logger.error('Error applying filters', {
          ...COMPONENT_CONTEXT,
          action: 'applyFilters'
        }, error);
        return [];
      }
    },
  }))
);