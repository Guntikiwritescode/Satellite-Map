import React, { useState, useMemo } from 'react';
import { ChevronDown, Filter, X, Search, Globe, Navigation, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSatelliteStore } from '../stores/satelliteStore';
import { satelliteAPI } from '../services/satelliteAPI';

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, satellites } = useSatelliteStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get filter options from the actual loaded satellites
  const filterOptions = useMemo(() => {
    if (satellites.length === 0) {
      return satelliteAPI.getFilterOptions(); // fallback options
    }
    
    const types = [...new Set(satellites.map(s => s.type))].sort();
    const countries = [...new Set(satellites.map(s => s.country))].sort();
    const agencies = [...new Set(satellites.map(s => s.agency))].sort();
    const statuses = [...new Set(satellites.map(s => s.status))].sort();
    
    return { types, countries, agencies, statuses };
  }, [satellites]);
  
  console.log('FilterPanel render:', { 
    satellitesCount: satellites.length, 
    filterOptions, 
    currentFilters: filters 
  });
  
  const activeFilterCount = [
    ...filters.types,
    ...filters.countries,
    ...filters.agencies,
    ...filters.status
  ].length + (filters.searchQuery ? 1 : 0);

  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.types, type as any]
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="cosmic-border">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-background border border-border shadow-lg z-50" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Filter Satellites</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Search</h5>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search satellites..."
                value={filters.searchQuery || ''}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Separator />

          {/* Altitude Range */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Orbital Altitude</h5>
            <Select onValueChange={handleAltitudeFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All altitudes" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">All Altitudes</SelectItem>
                <SelectItem value="leo">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Low Earth Orbit (0-2,000km)</span>
                  </div>
                </SelectItem>
                <SelectItem value="meo">
                  <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4" />
                    <span>Medium Earth Orbit (2,000-35,786km)</span>
                  </div>
                </SelectItem>
                <SelectItem value="geo">
                  <div className="flex items-center space-x-2">
                    <Satellite className="h-4 w-4" />
                    <span>Geostationary Orbit (35,786km+)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Satellite Types */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Satellite Types</h5>
            <div className="space-y-2">
              {filterOptions.types.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.types.includes(type)}
                    onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                  />
                  <label 
                    htmlFor={`type-${type}`}
                    className="text-sm text-muted-foreground capitalize cursor-pointer"
                  >
                    {type.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Countries</h5>
            <div className="space-y-2">
              {filterOptions.countries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country}`}
                    checked={filters.countries.includes(country)}
                    onCheckedChange={(checked) => handleCountryChange(country, !!checked)}
                  />
                  <label 
                    htmlFor={`country-${country}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Agencies */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Agencies</h5>
            <div className="space-y-2">
              {filterOptions.agencies.map((agency) => (
                <div key={agency} className="flex items-center space-x-2">
                  <Checkbox
                    id={`agency-${agency}`}
                    checked={filters.agencies.includes(agency)}
                    onCheckedChange={(checked) => handleAgencyChange(agency, !!checked)}
                  />
                  <label 
                    htmlFor={`agency-${agency}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {agency}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPanel;