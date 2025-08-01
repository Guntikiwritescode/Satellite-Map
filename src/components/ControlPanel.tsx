import React from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, Orbit, MapPin, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSatelliteStore } from '../stores/satelliteStore';

const ControlPanel: React.FC = () => {
  const { 
    globeSettings, 
    updateGlobeSettings, 
    getSelectedSatellite,
    filteredSatellites
  } = useSatelliteStore();

  const selectedSatellite = getSelectedSatellite();

  const handleTimeSpeedChange = (value: number[]) => {
    updateGlobeSettings({ timeSpeed: value[0] });
  };

  const togglePause = () => {
    updateGlobeSettings({ isPaused: !globeSettings.isPaused });
  };

  const resetView = () => {
    updateGlobeSettings({ 
      selectedSatelliteId: null,
      cameraFollowSatellite: false,
      timeSpeed: 1,
      isPaused: false
    });
  };

  const formatTimeSpeed = (speed: number) => {
    if (speed === 1) return 'Real-time';
    if (speed < 1) return `${speed}x slower`;
    return `${speed}x faster`;
  };

  return (
    <div className="space-y-4">
      {/* Time Controls */}
      <Card className="glass-panel p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Time Controls</span>
            </h3>
            <Badge variant="outline" className="cosmic-border">
              {formatTimeSpeed(globeSettings.timeSpeed)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="cosmic-border"
            >
              {globeSettings.isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[globeSettings.timeSpeed]}
                onValueChange={handleTimeSpeedChange}
                min={0.1}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="cosmic-border"
            >
              <RotateCcw className="h-4 w-4" />
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