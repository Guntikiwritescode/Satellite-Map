import React, { useState } from 'react';
import { 
  BookOpen, ExternalLink, Filter, Search, Zap, 
  Globe, Navigation, Radio, Eye, Satellite, Telescope,
  Shield, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSatelliteStore } from '../stores/satelliteStore';
import { SatelliteType } from '../types/satellite.types';

const SatelliteInfo = () => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(true);
  const { satellites, filters, updateFilters, resetFilters } = useSatelliteStore();

  // Calculate specifications from current satellites
  const specs = React.useMemo(() => {
    if (!satellites.length) return null;

    const altitudes = satellites.map(s => s.orbital.altitude).filter(a => a > 0);
    const periods = satellites.map(s => s.orbital.period).filter(p => p > 0);
    const inclinations = satellites.map(s => s.orbital.inclination).filter(i => i >= 0);
    
    const typeCount = satellites.reduce((acc, sat) => {
      acc[sat.type] = (acc[sat.type] || 0) + 1;
      return acc;
    }, {} as Record<SatelliteType, number>);

    const countryCount = satellites.reduce((acc, sat) => {
      acc[sat.country] = (acc[sat.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSatellites: satellites.length,
      altitudeRange: {
        min: Math.min(...altitudes),
        max: Math.max(...altitudes),
        avg: Math.round(altitudes.reduce((a, b) => a + b, 0) / altitudes.length)
      },
      periodRange: {
        min: Math.min(...periods),
        max: Math.max(...periods),
        avg: Math.round(periods.reduce((a, b) => a + b, 0) / periods.length)
      },
      inclinationRange: {
        min: Math.min(...inclinations),
        max: Math.max(...inclinations),
        avg: Math.round(inclinations.reduce((a, b) => a + b, 0) / inclinations.length)
      },
      typeDistribution: typeCount,
      countryDistribution: countryCount
    };
  }, [satellites]);

  const getSatelliteTypeIcon = (type: SatelliteType) => {
    switch (type) {
      case 'space-station': return <Satellite className="h-4 w-4" />;
      case 'constellation': return <Zap className="h-4 w-4" />;
      case 'navigation': return <Navigation className="h-4 w-4" />;
      case 'weather': return <Globe className="h-4 w-4" />;
      case 'communication': return <Radio className="h-4 w-4" />;
      case 'earth-observation': return <Eye className="h-4 w-4" />;
      case 'scientific': return <Telescope className="h-4 w-4" />;
      case 'military': return <Shield className="h-4 w-4" />;
      default: return <Satellite className="h-4 w-4" />;
    }
  };

  const handleTypeFilter = (type: SatelliteType, checked: boolean) => {
    const newTypes = checked 
      ? [...(filters.types || []), type]
      : (filters.types || []).filter(t => t !== type);
    updateFilters({ types: newTypes });
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

  return (
    <div className="space-y-4">
      {/* History Section */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Satellite History & Usage</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="h-8 w-8 p-0"
            >
              {isHistoryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Artificial satellites revolutionized global communications, navigation, and Earth observation since Sputnik 1 in 1957. 
              Today, over 8,000 active satellites provide essential services including GPS navigation, weather forecasting, 
              internet connectivity, and scientific research.
            </p>
            
            {isHistoryExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Satellite className="h-4 w-4 mr-1 text-primary" />
                      Key Milestones
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 1957: Sputnik 1 (First artificial satellite)</li>
                      <li>• 1960: TIROS-1 (First weather satellite)</li>
                      <li>• 1962: Telstar (First transatlantic TV)</li>
                      <li>• 1978: GPS Block I (Navigation era)</li>
                      <li>• 2019: Starlink (Mega-constellations)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Globe className="h-4 w-4 mr-1 text-primary" />
                      Modern Applications
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Global Internet & Communications</li>
                      <li>• GPS Navigation & Timing</li>
                      <li>• Weather & Climate Monitoring</li>
                      <li>• Earth Observation & Mapping</li>
                      <li>• Scientific Research & Exploration</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open('https://en.wikipedia.org/wiki/Satellite', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Wikipedia: Satellites
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open('https://en.wikipedia.org/wiki/Timeline_of_artificial_satellites_and_space_probes', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Satellite Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications & Filtering */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <span>Specifications & Filters</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
              className="h-8 w-8 p-0"
            >
              {isSpecsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {specs && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">{specs.totalSatellites}</div>
                  <div className="text-xs text-muted-foreground">Total Satellites</div>
                </div>
                <div className="text-center p-3 bg-secondary/10 rounded-lg">
                  <div className="text-lg font-bold text-secondary-foreground">{specs.altitudeRange.avg}km</div>
                  <div className="text-xs text-muted-foreground">Avg Altitude</div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-accent-foreground">{specs.periodRange.avg}min</div>
                  <div className="text-xs text-muted-foreground">Avg Period</div>
                </div>
                <div className="text-center p-3 bg-muted/10 rounded-lg">
                  <div className="text-lg font-bold text-muted-foreground">{specs.inclinationRange.avg}°</div>
                  <div className="text-xs text-muted-foreground">Avg Inclination</div>
                </div>
              </div>

              {isSpecsExpanded && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <Separator />
                  
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Satellites</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, agency, or country..."
                        value={filters.searchQuery || ''}
                        onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Altitude Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Orbital Altitude</label>
                    <Select onValueChange={handleAltitudeFilter} defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Select altitude range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Altitudes</SelectItem>
                        <SelectItem value="leo">Low Earth Orbit (0-2,000km)</SelectItem>
                        <SelectItem value="meo">Medium Earth Orbit (2,000-35,786km)</SelectItem>
                        <SelectItem value="geo">Geostationary Orbit (35,786km+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Satellite Types Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Satellite Types</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(specs.typeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={filters.types?.includes(type as SatelliteType) ?? false}
                            onCheckedChange={(checked) => handleTypeFilter(type as SatelliteType, checked as boolean)}
                          />
                          <label
                            htmlFor={type}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2"
                          >
                            {getSatelliteTypeIcon(type as SatelliteType)}
                            <span className="capitalize">{type.replace('-', ' ')}</span>
                            <Badge variant="secondary" className="text-xs">{count}</Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specifications Ranges */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Specification Ranges
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <div className="font-medium mb-1">Altitude Range</div>
                        <div className="text-muted-foreground space-y-1">
                          <div>Min: {specs.altitudeRange.min.toLocaleString()}km</div>
                          <div>Max: {specs.altitudeRange.max.toLocaleString()}km</div>
                          <div>Avg: {specs.altitudeRange.avg.toLocaleString()}km</div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <div className="font-medium mb-1">Orbital Period</div>
                        <div className="text-muted-foreground space-y-1">
                          <div>Min: {specs.periodRange.min}min</div>
                          <div>Max: {specs.periodRange.max}min</div>
                          <div>Avg: {specs.periodRange.avg}min</div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <div className="font-medium mb-1">Inclination</div>
                        <div className="text-muted-foreground space-y-1">
                          <div>Min: {specs.inclinationRange.min}°</div>
                          <div>Max: {specs.inclinationRange.max}°</div>
                          <div>Avg: {specs.inclinationRange.avg}°</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SatelliteInfo;