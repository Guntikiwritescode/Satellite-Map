import React, { useState, useCallback } from 'react';
import { 
  Globe, 
  Table, 
  BookOpen, 
  Filter, 
  Download, 
  Settings, 
  Play, 
  Pause,
  GraduationCap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSatelliteStore } from '../stores/satelliteStore';
import AudioPlayer from './AudioPlayer';

interface ControlPanelProps {
  onToggleFilters: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({ onToggleFilters }) => {
  const { 
    viewMode, 
    setViewMode, 
    filteredSatellites, 
    satellites, 
    globeSettings, 
    updateGlobeSettings,
    isLoading 
  } = useSatelliteStore();
  
  const [showAudioControls, setShowAudioControls] = useState(false);

  const handleViewModeChange = useCallback((mode: typeof viewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  const handleTimeSpeedChange = useCallback((value: number[]) => {
    updateGlobeSettings({ timeSpeed: value[0] });
  }, [updateGlobeSettings]);

  const togglePause = useCallback(() => {
    updateGlobeSettings({ isPaused: !globeSettings.isPaused });
  }, [globeSettings.isPaused, updateGlobeSettings]);

  const viewModeButtons = [
    { 
      mode: 'globe' as const, 
      icon: Globe, 
      label: '3D Globe View',
      description: 'Interactive 3D visualization of satellites'
    },
    { 
      mode: 'spreadsheet' as const, 
      icon: Table, 
      label: 'Spreadsheet View',
      description: 'Detailed tabular data view'
    },
    { 
      mode: 'guide' as const, 
      icon: BookOpen, 
      label: 'User Guide',
      description: 'Help and documentation'
    },
    { 
      mode: 'education' as const, 
      icon: GraduationCap, 
      label: 'Education Center',
      description: 'Learn about satellites and space'
    }
  ];

  return (
    <TooltipProvider>
      <Card className="w-full bg-card/95 backdrop-blur-sm border-0 border-b rounded-none">
        <div className="p-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">
                ALCHEMIST Satellite Tracker
              </h1>
              <Badge variant="outline" className="text-xs">
                {filteredSatellites.length.toLocaleString()} / {satellites.length.toLocaleString()} satellites
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {/* Audio Controls Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAudioControls(!showAudioControls)}
                    aria-label={showAudioControls ? "Hide audio controls" : "Show audio controls"}
                    aria-pressed={showAudioControls}
                  >
                    {showAudioControls ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showAudioControls ? 'Hide' : 'Show'} Audio Controls</p>
                </TooltipContent>
              </Tooltip>

              {/* Filter Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleFilters}
                    aria-label="Toggle filters panel"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Filters</p>
                </TooltipContent>
              </Tooltip>

              {/* Settings Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Audio Player */}
          {showAudioControls && (
            <div className="mb-4">
              <AudioPlayer />
            </div>
          )}

          <Separator className="mb-4" />

          {/* Main Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Selection */}
            <nav role="tablist" aria-label="View modes" className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              {viewModeButtons.map(({ mode, icon: Icon, label, description }) => (
                <Tooltip key={mode}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === mode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange(mode)}
                      role="tab"
                      aria-selected={viewMode === mode}
                      aria-controls={`${mode}-panel`}
                      aria-label={label}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{label.split(' ')[0]}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>

            {/* Globe Controls - Only show in globe view */}
            {viewMode === 'globe' && (
              <div className="flex items-center space-x-4">
                {/* Time Speed Control */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="time-speed-slider" className="text-sm text-muted-foreground">
                    Time Speed:
                  </label>
                  <div className="w-24">
                    <Slider
                      id="time-speed-slider"
                      value={[globeSettings.timeSpeed]}
                      onValueChange={handleTimeSpeedChange}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-full"
                      aria-label="Adjust time speed"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-8">
                    {globeSettings.timeSpeed.toFixed(1)}x
                  </span>
                </div>

                {/* Play/Pause Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePause}
                      aria-label={globeSettings.isPaused ? "Resume time" : "Pause time"}
                      aria-pressed={globeSettings.isPaused}
                    >
                      {globeSettings.isPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{globeSettings.isPaused ? 'Resume' : 'Pause'} Time</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Export Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  aria-label="Export satellite data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Satellite Data</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default ControlPanel;