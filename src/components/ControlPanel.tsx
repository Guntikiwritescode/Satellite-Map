import React from 'react';
import { RotateCcw, Eye, EyeOff, Orbit, MapPin, Clock, Zap, Filter, Activity, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSatelliteStore } from '../stores/satelliteStore';

const ControlPanel: React.FC = () => {
  const { 
    globeSettings, 
    updateGlobeSettings, 
    getSelectedSatellite,
    filteredSatellites,
    filters,
    updateFilters,
    setSelectedSatellite
  } = useSatelliteStore();

  const selectedSatellite = getSelectedSatellite();

  const resetView = () => {
    updateGlobeSettings({ 
      selectedSatelliteId: null
    });
  };

  const resetFilters = () => {
    updateFilters({
      types: [],
      countries: [],
      agencies: [],
      status: [],
      searchQuery: '',
      showOnlyVisible: false
    });
  };

  const deselectSatellite = () => {
    setSelectedSatellite(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 max-h-[calc(100vh-160px)] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {/* Real-time Status */}
        <Card className="glass-panel p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-foreground flex items-center space-x-2">
                <Activity className="h-3 w-3 text-green-400" />
                <span>Live Tracking</span>
              </h3>
              <Badge variant="outline" className="cosmic-border text-green-400 border-green-400/30 text-xs">
                Real-time
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Positions updated every 30 seconds using live TLE data
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="cosmic-border h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="cosmic-border h-7 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectSatellite}
                disabled={!globeSettings.selectedSatelliteId}
                className="cosmic-border h-7 text-xs disabled:opacity-50"
              >
                <MousePointerClick className="h-3 w-3 mr-1" />
                Deselect
              </Button>
            </div>
          </div>
        </Card>

        {/* Display Options */}
        <Card className="glass-panel p-3">
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground flex items-center space-x-2">
              <Eye className="h-3 w-3 text-primary" />
              <span>Display</span>
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Coverage Areas</span>
                <Switch
                  checked={globeSettings.showFootprints}
                  onCheckedChange={(checked) => updateGlobeSettings({ showFootprints: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Major Cities</span>
                <Switch
                  checked={globeSettings.showCities}
                  onCheckedChange={(checked) => updateGlobeSettings({ showCities: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Day/Night Line</span>
                <Switch
                  checked={globeSettings.showTerminator}
                  onCheckedChange={(checked) => updateGlobeSettings({ showTerminator: checked })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="glass-panel p-3">
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-foreground flex items-center space-x-2">
              <Zap className="h-3 w-3 text-primary" />
              <span>Statistics</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">Tracked</div>
                <div className="font-mono text-primary text-sm">
                  {filteredSatellites.length}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Active</div>
                <div className="font-mono text-stellar-cyan text-sm">
                  {filteredSatellites.filter(s => s.status === 'active').length}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">LEO</div>
                <div className="font-mono text-jupiter-amber text-sm">
                  {filteredSatellites.filter(s => s.orbital.altitude < 2000).length}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">GEO</div>
                <div className="font-mono text-nebula-purple text-sm">
                  {filteredSatellites.filter(s => s.orbital.altitude > 35000).length}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Satellite Details */}
        {selectedSatellite && (
          <Card className="glass-panel p-3 border-primary/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-foreground flex items-center space-x-2">
                  <Orbit className="h-3 w-3 text-primary" />
                  <span>Selected</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateGlobeSettings({ selectedSatelliteId: null })}
                  className="h-6 w-6 p-0"
                >
                  <EyeOff className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="font-medium text-xs text-foreground line-clamp-2">
                    {selectedSatellite.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedSatellite.agency}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-2 w-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Alt:</span>
                    </div>
                    <div className="font-mono text-primary text-xs">
                      {selectedSatellite.orbital.altitude > 1000 
                        ? `${(selectedSatellite.orbital.altitude / 1000).toFixed(1)}K km`
                        : `${selectedSatellite.orbital.altitude.toFixed(0)} km`
                      }
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-2 w-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Vel:</span>
                    </div>
                    <div className="font-mono text-stellar-cyan text-xs">
                      {selectedSatellite.orbital.velocity.toFixed(2)} km/s
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-2 w-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Period:</span>
                    </div>
                    <div className="font-mono text-jupiter-amber text-xs">
                      {Math.floor(selectedSatellite.orbital.period / 60)}h {Math.floor(selectedSatellite.orbital.period % 60)}m
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Orbit className="h-2 w-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Inc:</span>
                    </div>
                    <div className="font-mono text-nebula-purple text-xs">
                      {selectedSatellite.orbital.inclination.toFixed(1)}°
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded p-2">
                  <div className="text-xs text-muted-foreground mb-1">Position</div>
                  <div className="font-mono text-primary text-xs">
                    {selectedSatellite.position.latitude.toFixed(2)}°, {selectedSatellite.position.longitude.toFixed(2)}°
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;