import React, { useState, useMemo } from 'react';
import { ChevronDown, Filter, X, Search, Globe, Navigation, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSatelliteStore } from '../stores/satelliteStore';
import { SatelliteType } from '../types/satellite.types';
import { Slider } from '@/components/ui/slider';

const FilterPanel: React.FC = React.memo(() => {
  const { filters, updateFilters, satellites } = useSatelliteStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Optimized filter options generation with better memoization
  const filterOptions = useMemo(() => {
    if (satellites.length === 0) {
      return { types: [], countries: [], agencies: [], statuses: [] };
    }
    
    // Use Set for better performance with large datasets
    const typesSet = new Set<string>();
    const countriesSet = new Set<string>();
    const agenciesSet = new Set<string>();
    const statusesSet = new Set<string>();
    
    // Single pass through satellites for all filter options
    satellites.forEach(s => {
      typesSet.add(s.type);
      statusesSet.add(s.status);
      if (s.metadata?.country) countriesSet.add(s.metadata.country);
      if (s.metadata?.constellation) agenciesSet.add(s.metadata.constellation);
    });
    
    return {
      types: Array.from(typesSet).sort(),
      countries: Array.from(countriesSet).sort(),
      agencies: Array.from(agenciesSet).sort(),
      statuses: Array.from(statusesSet).sort()
    };
  }, [satellites]); // Include satellites to ensure options update when satellite data changes

  // Memoized options for better performance
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(satellites.map(sat => sat.type)));
    return types.sort();
  }, [satellites]);

  const countryOptions = useMemo(() => {
    const countries = Array.from(new Set(satellites.map(sat => sat.metadata?.country || 'Unknown')));
    return countries.sort();
  }, [satellites]);

  const agencyOptions = useMemo(() => {
    const agencies = Array.from(new Set(satellites.map(sat => sat.metadata?.constellation || 'Individual')));
    return agencies.sort();
  }, [satellites]);

  const activeFilterCount = [
    filters.types.length,
    filters.countries.length,
    filters.agencies.length,
    filters.status.length,
    filters.searchQuery ? 1 : 0,
    filters.altitudeRange[0] > 0 || filters.altitudeRange[1] < 50000 ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.types, type as SatelliteType]
      : filters.types.filter(t => t !== type);
    updateFilters({ types: newTypes });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = checked 
      ? [...filters.countries, country]
      : filters.countries.filter(c => c !== country);
    updateFilters({ countries: newCountries });
  };

  const handleAgencyChange = (agency: string, checked: boolean) => {
    const newAgencies = checked 
      ? [...filters.agencies, agency]
      : filters.agencies.filter(a => a !== agency);
    updateFilters({ agencies: newAgencies });
  };

  const handleAltitudeFilter = (range: string) => {
    let altitudeRange: [number, number];
    switch (range) {
      case 'leo': altitudeRange = [0, 2000]; break;
      case 'meo': altitudeRange = [2000, 35786]; break;
      case 'geo': altitudeRange = [35786, 50000]; break;
      default: altitudeRange = [0, 50000];
    }
    updateFilters({ altitudeRange });
  };

  const clearAllFilters = () => {
    updateFilters({
      types: [],
      countries: [],
      agencies: [],
      status: [],
      searchQuery: '',
      altitudeRange: [0, 50000]
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8"
      >
        <Filter className="h-3 w-3 mr-1" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-80 bg-card border-l shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              placeholder="Search satellites..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            />
          </div>

          {/* Satellite Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Satellite Types</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {typeOptions.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={filters.types.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...filters.types, type]
                        : filters.types.filter(t => t !== type);
                      updateFilters({ types: newTypes });
                    }}
                  />
                  <label htmlFor={type} className="text-sm capitalize">
                    {type.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="text-sm font-medium mb-2 block">Countries</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {countryOptions.slice(0, 10).map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={country}
                    checked={filters.countries.includes(country)}
                    onCheckedChange={(checked) => {
                      const newCountries = checked
                        ? [...filters.countries, country]
                        : filters.countries.filter(c => c !== country);
                      updateFilters({ countries: newCountries });
                    }}
                  />
                  <label htmlFor={country} className="text-sm">
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Altitude Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Altitude Range: {filters.altitudeRange[0]} - {filters.altitudeRange[1]} km
            </label>
            <Slider
              value={filters.altitudeRange}
              onValueChange={(value) => updateFilters({ altitudeRange: value as [number, number] })}
              max={50000}
              min={0}
              step={100}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;