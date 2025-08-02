import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Satellite, SatelliteFilters, Launch, UserLocation, Globe3DSettings, SatelliteType, SatelliteStatus } from '../types/satellite.types';

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
  viewMode: 'globe' | 'spreadsheet' | 'guide';
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
  setViewMode: (mode: 'globe' | 'spreadsheet' | 'guide') => void;
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
    maxDisplaySatellites: 500, // Reduced from 1000 for better performance
    
    // Computed - since Zustand getters don't work well, we'll use a selector
    filteredSatellites: [],
    
    // Actions
    setSatellites: (satellites) => {
      const filtered = get().applyFilters(satellites, get().filters);
      set({ 
        satellites, 
        filteredSatellites: filtered,
        lastUpdate: Date.now(),
        error: null 
      });
    },
    
    updateSatellitePositions: (positionUpdates) => set((state) => {
      const updatedSatellites = state.satellites.map(satellite => {
        const update = positionUpdates.find(u => u.id === satellite.id);
        return update ? { ...satellite, position: update.position } : satellite;
      });
      
      const filtered = state.applyFilters(updatedSatellites, state.filters);
      return {
        satellites: updatedSatellites,
        filteredSatellites: filtered,
        lastUpdate: Date.now()
      };
    }),
    
    updateSatellitePosition: (id, position) => set((state) => {
      const updatedSatellites = state.satellites.map(sat =>
        sat.id === id ? { ...sat, position } : sat
      );
      const filtered = state.applyFilters(updatedSatellites, state.filters);
      return {
        satellites: updatedSatellites,
        filteredSatellites: filtered,
        lastUpdate: Date.now()
      };
    }),
    
    setLaunches: (launches) => set({ launches }),
    
    setUserLocation: (userLocation) => set({ userLocation }),
    
    updateFilters: (newFilters) => {
      const state = get();
      const updatedFilters = { ...state.filters, ...newFilters };
      const filtered = state.applyFilters(state.satellites, updatedFilters);
      set({ 
        filters: updatedFilters,
        filteredSatellites: filtered
      });
    },
    
    updateGlobeSettings: (newSettings) => set((state) => ({
      globeSettings: { ...state.globeSettings, ...newSettings }
    })),
    
    setSelectedSatellite: (id) => {
      try {
        console.log('Selecting satellite:', id);
        set((state) => ({
          globeSettings: { ...state.globeSettings, selectedSatelliteId: id }
        }));
      } catch (error) {
        console.error('Error setting selected satellite:', error);
        set({ error: `Failed to select satellite: ${error.message}` });
      }
    },
    
    setLoading: (isLoading) => set({ isLoading }),
    
    setError: (error) => set({ error }),
    
    setViewMode: (viewMode) => set({ viewMode }),
    
    setMaxDisplaySatellites: (maxDisplaySatellites) => {
      const state = get();
      const filtered = state.applyFilters(state.satellites, state.filters);
      set({ 
        maxDisplaySatellites,
        filteredSatellites: filtered
      });
    },
    
    // Utility functions
    getSatelliteById: (id) => {
      return get().satellites.find(sat => sat.id === id);
    },
    
    getSelectedSatellite: () => {
      const { satellites, globeSettings } = get();
      if (!globeSettings.selectedSatelliteId) return undefined;
      return satellites.find(sat => sat.id === globeSettings.selectedSatelliteId);
    },
    
    resetFilters: () => {
      const state = get();
      const filtered = state.applyFilters(state.satellites, defaultFilters);
      set({ 
        filters: defaultFilters,
        filteredSatellites: filtered
      });
    },
    
    applyFilters: (satellites, filters) => {
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
      
      // Optimized sorting - only sort if needed
      if (filtered.length > 1) {
        filtered.sort((a, b) => (a.position?.altitude || 0) - (b.position?.altitude || 0));
      }
      
      // Apply limit efficiently
      const maxDisplay = get().maxDisplaySatellites;
      return filtered.length > maxDisplay ? filtered.slice(0, maxDisplay) : filtered;
    },
  }))
);