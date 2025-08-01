import React, { useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Globe, Satellite as SatelliteIcon, Clock, MapPin, Zap, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import FilterPanel from './FilterPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite, SatelliteType } from '../types/satellite.types';

const SatelliteTable: React.FC = React.memo(() => {
  const { 
    satellites,
    filteredSatellites, 
    filters, 
    updateFilters, 
    setSelectedSatellite,
    globeSettings 
  } = useSatelliteStore();

  // Memoize logging to reduce console spam
  const logData = useMemo(() => ({
    totalSatellites: satellites.length, 
    filteredCount: filteredSatellites.length,
    filters 
  }), [satellites.length, filteredSatellites.length, filters]);

  // Only log every 10th render to reduce console spam
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    if (renderCount.current % 10 === 0) {
      console.log('SatelliteTable render (every 10th):', logData);
    }
  }, [logData]);

  const handleSatelliteSelect = (satellite: Satellite) => {
    setSelectedSatellite(satellite.id);
  };

  const formatAltitude = (altitude: number) => {
    return altitude > 1000 ? `${(altitude / 1000).toFixed(1)}K km` : `${altitude.toFixed(0)} km`;
  };

  const formatVelocity = (velocity: number) => {
    return `${velocity.toFixed(2)} km/s`;
  };

  const formatPeriod = (period: number) => {
    const hours = Math.floor(period / 60);
    const minutes = Math.floor(period % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTypeIcon = (type: SatelliteType) => {
    switch (type) {
      case 'space-station': return '🚀';
      case 'constellation': return '🛰️';
      case 'navigation': return '🧭';
      case 'weather': return '🌤️';
      case 'earth-observation': return '🌍';
      case 'communication': return '📡';
      case 'scientific': return '🔬';
      case 'military': return '🛡️';
      default: return '🛰️';
    }
  };

  const getTypeColor = (type: SatelliteType) => {
    switch (type) {
      case 'space-station': return 'bg-stellar-cyan/20 text-stellar-cyan border-stellar-cyan/30';
      case 'constellation': return 'bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/30';
      case 'navigation': return 'bg-jupiter-amber/20 text-jupiter-amber border-jupiter-amber/30';
      case 'weather': return 'bg-nebula-purple/20 text-nebula-purple border-nebula-purple/30';
      case 'earth-observation': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'communication': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'scientific': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'military': return 'bg-mars-red/20 text-mars-red border-mars-red/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'inactive': return 'bg-asteroid-gray/20 text-asteroid-gray border-asteroid-gray/30';
      case 'decayed': return 'bg-mars-red/20 text-mars-red border-mars-red/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SatelliteIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold bg-gradient-aurora bg-clip-text text-transparent">
            Satellites
          </h2>
        </div>
        <Badge variant="outline" className="cosmic-border text-xs">
          {filteredSatellites.length}
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="glass-panel p-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search satellites..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="pl-7 h-8 text-xs bg-muted/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <FilterPanel />
        </div>
      </Card>

      {/* Satellite List - Fixed height with scroll */}
      <div className="flex-1 min-h-0 max-h-[60vh] overflow-hidden">
        <div className="h-full overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {filteredSatellites.map((satellite) => (
            <Card
              key={satellite.id}
              className={`p-2 cursor-pointer transition-all duration-200 hover:shadow-sm text-xs ${
                globeSettings.selectedSatelliteId === satellite.id 
                  ? 'cosmic-border bg-primary/5' 
                  : 'glass-panel hover:bg-card/80'
              }`}
              onClick={() => handleSatelliteSelect(satellite)}
            >
              <div className="space-y-1">
                {/* Satellite Header - Condensed */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center space-x-1 min-w-0 flex-1">
                    <span className="text-sm flex-shrink-0">{getTypeIcon(satellite.type)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-xs text-foreground line-clamp-1">
                        {satellite.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{satellite.agency}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                    <Badge className={`text-xs px-1.5 py-0.5 ${getTypeColor(satellite.type)}`}>
                      {satellite.type.replace('-', ' ')}
                    </Badge>
                    <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(satellite.status)}`}>
                      {satellite.status}
                    </Badge>
                  </div>
                </div>

                {/* Key Metrics - Condensed */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Alt:</span>
                      <span className="font-mono text-primary">
                        {formatAltitude(satellite.orbital.altitude)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vel:</span>
                      <span className="font-mono text-stellar-cyan">
                        {formatVelocity(satellite.orbital.velocity)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-mono text-jupiter-amber">
                        {formatPeriod(satellite.orbital.period)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Inc:</span>
                      <span className="font-mono text-nebula-purple">
                        {satellite.orbital.inclination.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Position - Minimal */}
                <div className="bg-muted/30 rounded px-2 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-mono text-primary">
                      {satellite.position.latitude.toFixed(2)}°, {satellite.position.longitude.toFixed(2)}°
                    </span>
                  </div>
                </div>

                {/* Description - Show if available */}
                {satellite.description && (
                  <div className="bg-muted/20 rounded px-2 py-1.5">
                    <h4 className="text-xs font-medium text-foreground mb-1">About</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {satellite.description}
                    </p>
                  </div>
                )}

                {/* Wikipedia Link - Show if available */}
                {satellite.wikipediaUrl && (
                  <div className="flex justify-end">
                    <a
                      href={satellite.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Learn more</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {filteredSatellites.length === 0 && (
            <Card className="glass-panel p-6 text-center">
              <SatelliteIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">No satellites found</h3>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});

SatelliteTable.displayName = 'SatelliteTable';

export default SatelliteTable;