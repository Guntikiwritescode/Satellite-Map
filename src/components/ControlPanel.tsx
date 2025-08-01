import React from 'react';
import { RotateCcw, Eye, EyeOff, Orbit, MapPin, Clock, Zap, Filter, Activity } from 'lucide-react';
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
    updateFilters
  } = useSatelliteStore();

  const selectedSatellite = getSelectedSatellite();

  const resetView = () => {
    updateGlobeSettings({ 
      selectedSatelliteId: null,
      cameraFollowSatellite: false
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

  return (
    <div className="space-y-4">
      {/* Real-time Status */}
      <Card className="glass-panel p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span>Live Tracking</span>
            </h3>
            <Badge variant="outline" className="cosmic-border text-green-400 border-green-400/30">
              Real-time
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Positions updated every 30 seconds using live TLE data from Celestrak
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="cosmic-border flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="cosmic-border flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Display Options */}
      <Card className="glass-panel p-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <Eye className="h-4 w-4 text-primary" />
            <span>Display Options</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Orbital Paths</span>
              <Switch
                checked={globeSettings.showOrbits}
                onCheckedChange={(checked) => updateGlobeSettings({ showOrbits: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Coverage Areas</span>
              <Switch
                checked={globeSettings.showFootprints}
                onCheckedChange={(checked) => updateGlobeSettings({ showFootprints: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Major Cities</span>
              <Switch
                checked={globeSettings.showCities}
                onCheckedChange={(checked) => updateGlobeSettings({ showCities: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Day/Night Line</span>
              <Switch
                checked={globeSettings.showTerminator}
                onCheckedChange={(checked) => updateGlobeSettings({ showTerminator: checked })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card className="glass-panel p-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>Statistics</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Tracked Satellites</div>
              <div className="font-mono text-primary text-lg">
                {filteredSatellites.length}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-muted-foreground">Active Missions</div>
              <div className="font-mono text-stellar-cyan text-lg">
                {filteredSatellites.filter(s => s.status === 'active').length}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-muted-foreground">Low Earth Orbit</div>
              <div className="font-mono text-jupiter-amber text-lg">
                {filteredSatellites.filter(s => s.orbital.altitude < 2000).length}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-muted-foreground">Geostationary</div>
              <div className="font-mono text-nebula-purple text-lg">
                {filteredSatellites.filter(s => s.orbital.altitude > 35000).length}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Satellite Details */}
      {selectedSatellite && (
        <Card className="glass-panel p-4 border-primary/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center space-x-2">
                <Orbit className="h-4 w-4 text-primary" />
                <span>Selected Satellite</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateGlobeSettings({ selectedSatelliteId: null })}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-foreground line-clamp-2">
                  {selectedSatellite.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedSatellite.agency} • {selectedSatellite.country}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Altitude:</span>
                  </div>
                  <div className="font-mono text-primary pl-5">
                    {selectedSatellite.orbital.altitude > 1000 
                      ? `${(selectedSatellite.orbital.altitude / 1000).toFixed(1)}K km`
                      : `${selectedSatellite.orbital.altitude.toFixed(0)} km`
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Velocity:</span>
                  </div>
                  <div className="font-mono text-stellar-cyan pl-5">
                    {selectedSatellite.orbital.velocity.toFixed(2)} km/s
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Period:</span>
                  </div>
                  <div className="font-mono text-jupiter-amber pl-5">
                    {Math.floor(selectedSatellite.orbital.period / 60)}h {Math.floor(selectedSatellite.orbital.period % 60)}m
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Orbit className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Inclination:</span>
                  </div>
                  <div className="font-mono text-nebula-purple pl-5">
                    {selectedSatellite.orbital.inclination.toFixed(1)}°
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-1">Current Position</div>
                <div className="font-mono text-primary">
                  {selectedSatellite.position.latitude.toFixed(3)}°, {selectedSatellite.position.longitude.toFixed(3)}°
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(selectedSatellite.position.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ControlPanel;