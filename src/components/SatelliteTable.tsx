import React, { useMemo } from 'react';
import { Search, Filter, Globe, Satellite as SatelliteIcon, Clock, MapPin, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import FilterPanel from './FilterPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite, SatelliteType } from '../types/satellite.types';

const SatelliteTable: React.FC = () => {
  const { 
    satellites,
    filteredSatellites, 
    filters, 
    updateFilters, 
    setSelectedSatellite,
    globeSettings 
  } = useSatelliteStore();

  console.log('SatelliteTable render:', { 
    totalSatellites: satellites.length, 
    filteredCount: filteredSatellites.length,
    filters 
  });

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
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SatelliteIcon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold bg-gradient-aurora bg-clip-text text-transparent">
            Satellite Tracker
          </h2>
        </div>
        <Badge variant="outline" className="cosmic-border">
          {filteredSatellites.length} satellites
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="glass-panel p-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search satellites, agencies, or countries..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <FilterPanel />
        </div>
      </Card>

      {/* Satellite List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-2 pr-2">
          {filteredSatellites.map((satellite) => (
            <Card
              key={satellite.id}
              className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-orbital ${
                globeSettings.selectedSatelliteId === satellite.id 
                  ? 'cosmic-border bg-primary/5' 
                  : 'glass-panel hover:bg-card/80'
              }`}
              onClick={() => handleSatelliteSelect(satellite)}
            >
              <div className="space-y-3">
                {/* Satellite Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(satellite.type)}</span>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {satellite.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {satellite.agency} • {satellite.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={getTypeColor(satellite.type)}>
                      {satellite.type}
                    </Badge>
                    <Badge className={getStatusColor(satellite.status)}>
                      {satellite.status}
                    </Badge>
                  </div>
                </div>

                {/* Orbital Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Altitude:</span>
                      <span className="font-mono text-primary">
                        {formatAltitude(satellite.orbital.altitude)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Velocity:</span>
                      <span className="font-mono text-stellar-cyan">
                        {formatVelocity(satellite.orbital.velocity)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-mono text-jupiter-amber">
                        {formatPeriod(satellite.orbital.period)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Inclination:</span>
                      <span className="font-mono text-nebula-purple">
                        {satellite.orbital.inclination.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Position */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Position:</span>
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(satellite.position.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-primary">
                    {satellite.position.latitude.toFixed(3)}°, {satellite.position.longitude.toFixed(3)}°
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {filteredSatellites.length === 0 && (
            <Card className="glass-panel p-8 text-center">
              <SatelliteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No satellites found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatelliteTable;