import React from 'react';
import { Globe, Table, MousePointer, Eye, Filter, Activity, Volume2, RotateCcw, Search, Orbit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UIGuide = () => {
  return (
    <div className="h-full overflow-y-auto space-y-4 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-display font-black text-terminal-green mb-2">
          ALCHEMIST UI GUIDE
        </h1>
        <p className="text-sm text-neon-cyan font-terminal">
          [ TACTICAL SATELLITE TRACKING INTERFACE ]
        </p>
      </div>

      {/* View Modes */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Eye className="h-5 w-5 text-primary" />
            <span>View Modes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <Globe className="h-4 w-4 text-stellar-cyan mt-1" />
            <div>
              <div className="font-medium text-sm">Tactical View</div>
              <div className="text-xs text-muted-foreground">
                Interactive 3D globe showing real-time satellite positions. Click satellites for details.
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Table className="h-4 w-4 text-jupiter-amber mt-1" />
            <div>
              <div className="font-medium text-sm">Data Grid</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet view with sortable columns and detailed satellite information.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Globe Controls */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MousePointer className="h-5 w-5 text-primary" />
            <span>Globe Navigation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Left Click + Drag:</span>
              <span className="text-foreground">Rotate globe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mouse Wheel:</span>
              <span className="text-foreground">Zoom in/out</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Click Satellite:</span>
              <span className="text-foreground">Select & track</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Right Click:</span>
              <span className="text-foreground">Context menu</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Control Panel (Right)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <RotateCcw className="h-3 w-3 text-stellar-cyan mt-1" />
              <div className="text-xs">
                <span className="font-medium">Reset:</span> Return to default globe view
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Filter className="h-3 w-3 text-jupiter-amber mt-1" />
              <div className="text-xs">
                <span className="font-medium">Clear:</span> Remove all active filters
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MousePointer className="h-3 w-3 text-nebula-purple mt-1" />
              <div className="text-xs">
                <span className="font-medium">Deselect:</span> Clear selected satellite
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span>Filter System (Left)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Search className="h-3 w-3 text-stellar-cyan mt-1" />
              <div className="text-xs">
                <span className="font-medium">Search:</span> Find satellites by name or constellation
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Badge className="h-3 w-3 text-jupiter-amber p-0 mt-1" />
              <div className="text-xs">
                <span className="font-medium">Type Filters:</span> Communication, Earth Observation, Navigation
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Orbit className="h-3 w-3 text-nebula-purple mt-1" />
              <div className="text-xs">
                <span className="font-medium">Orbit Filters:</span> LEO, MEO, GEO altitude ranges
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <span>Audio System</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Located at the bottom of the right panel. Features 80s synthwave tracks:
          </div>
          <div className="space-y-1 text-xs">
            <div>• Play/Pause controls</div>
            <div>• Track skipping</div>
            <div>• Volume adjustment</div>
            <div>• Auto-playlist cycling</div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Status Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-stellar-cyan rounded-full"></div>
              <span>Active satellites</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-jupiter-amber rounded-full"></div>
              <span>LEO orbit</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-nebula-purple rounded-full"></div>
              <span>GEO orbit</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-danger-red rounded-full animate-pulse"></div>
              <span>Live feed active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="glass-panel border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Pro Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>• Use Ctrl+Click for multi-satellite selection (coming soon)</div>
          <div>• Satellite positions update every 30 seconds</div>
          <div>• Filter combinations work together for precise searches</div>
          <div>• Globe performance optimized for 500+ satellites</div>
          <div>• Data sourced from live TLE feeds</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UIGuide;