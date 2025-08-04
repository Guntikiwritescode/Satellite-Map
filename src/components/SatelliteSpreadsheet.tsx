import React, { useMemo, useState, useCallback } from 'react';
import { Search, ExternalLink, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Satellite, SatelliteType } from '../types/satellite.types';
import SatelliteDetail from './SatelliteDetail';

const SatelliteSpreadsheet: React.FC = () => {
  const { 
    filteredSatellites, 
    filters, 
    updateFilters, 
    setSelectedSatellite,
    globeSettings 
  } = useSatelliteStore();

  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Optimized event handlers with useCallback
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const toggleRowExpansion = useCallback((satelliteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(satelliteId)) {
        newSet.delete(satelliteId);
      } else {
        newSet.add(satelliteId);
      }
      return newSet;
    });
  }, []);

  const sortedSatellites = useMemo(() => {
    if (!sortField) return filteredSatellites;

    return [...filteredSatellites].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      // Handle nested properties
      if (sortField === 'altitude') {
        aVal = a.position.altitude;
        bVal = b.position.altitude;
      } else if (sortField === 'velocity') {
        aVal = a.velocity;
        bVal = b.velocity;
      } else if (sortField === 'period') {
        aVal = a.orbital.period;
        bVal = b.orbital.period;
      } else if (sortField === 'inclination') {
        aVal = a.orbital.inclination;
        bVal = b.orbital.inclination;
      } else {
        aVal = a[sortField as keyof Satellite];
        bVal = b[sortField as keyof Satellite];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }

      return 0;
    });
  }, [filteredSatellites, sortField, sortDirection]);

  const formatAltitude = (altitude: number | undefined) => {
    if (!altitude) return 'N/A';
    return altitude > 1000 ? `${(altitude / 1000).toFixed(1)}K km` : `${altitude.toFixed(0)} km`;
  };

  const formatVelocity = (velocity: number | undefined) => {
    if (!velocity) return 'N/A';
    return `${velocity.toFixed(2)} km/s`;
  };

  const formatPeriod = (period: number) => {
    const hours = Math.floor(period / 60);
    const minutes = Math.floor(period % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 font-medium text-xs hover:bg-muted/50"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-aurora bg-clip-text text-transparent">
          Satellite Database
        </h2>
        <Badge variant="outline" className="cosmic-border">
          {filteredSatellites.length} satellites
        </Badge>
      </div>

      {/* Search */}
      <Card className="glass-panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search satellites by name, agency, or country..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="glass-panel flex-1 min-h-0">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50">
              <tr>
                <th className="text-left p-3 font-medium">
                  <SortButton field="name">Name</SortButton>
                </th>
                <th className="text-left p-3 font-medium">
                  <SortButton field="type">Type</SortButton>
                </th>
                <th className="text-left p-3 font-medium">
                  <SortButton field="agency">Agency</SortButton>
                </th>
                <th className="text-left p-3 font-medium">
                  <SortButton field="country">Country</SortButton>
                </th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="altitude">Altitude</SortButton>
                </th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="velocity">Velocity</SortButton>
                </th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="period">Period</SortButton>
                </th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="inclination">Inclination</SortButton>
                </th>
                <th className="text-center p-3 font-medium">Position</th>
                <th className="text-center p-3 font-medium">Links</th>
                <th className="text-center p-3 font-medium w-12">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedSatellites.map((satellite) => (
                <React.Fragment key={satellite.id}>
                  <tr
                    className={`border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors ${
                      globeSettings.selectedSatelliteId === satellite.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => setSelectedSatellite(satellite.id)}
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-foreground">{satellite.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1 max-w-xs">
                          {satellite.metadata?.purpose || 'Satellite'}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-xs ${getTypeColor(satellite.type)}`}>
                        {satellite.type.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{satellite.metadata?.constellation || 'Unknown'}</td>
                    <td className="p-3 text-muted-foreground">{satellite.metadata?.country || 'Unknown'}</td>
                    <td className="p-3">
                      <Badge className={`text-xs ${getStatusColor(satellite.status)}`}>
                        {satellite.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono text-primary">
                      {formatAltitude(satellite.position.altitude)}
                    </td>
                    <td className="p-3 text-right font-mono text-stellar-cyan">
                      {formatVelocity(satellite.velocity)}
                    </td>
                    <td className="p-3 text-right font-mono text-jupiter-amber">
                      {formatPeriod(satellite.orbital.period)}
                    </td>
                    <td className="p-3 text-right font-mono text-nebula-purple">
                      {satellite.orbital.inclination.toFixed(1)}°
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs font-mono text-muted-foreground">
                        {satellite.position.latitude.toFixed(2)}°,<br />
                        {satellite.position.longitude.toFixed(2)}°
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {/* No external links available */}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => toggleRowExpansion(satellite.id, e)}
                        className="h-6 w-6 p-0 hover:bg-muted"
                      >
                        {expandedRows.has(satellite.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {expandedRows.has(satellite.id) && (
                    <tr className="border-b border-border/30">
                      <td colSpan={12} className="p-0">
                        <div className="bg-muted/20 p-4 max-h-96 overflow-y-auto">
                          <SatelliteDetail satellite={satellite} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredSatellites.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground mb-1">No satellites found</h3>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SatelliteSpreadsheet;