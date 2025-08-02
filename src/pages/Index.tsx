import React, { Suspense } from 'react';
import { Satellite, Loader2, Activity, Table, Globe } from 'lucide-react';
import SatelliteTable from '../components/SatelliteTable';
import SatelliteSpreadsheet from '../components/SatelliteSpreadsheet';
import Globe3D from '../components/Globe3D';
import ControlPanel from '../components/ControlPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSatelliteData } from '../hooks/useSatelliteData';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import spaceHero from '../assets/space-hero.jpg';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-neon-cyan" />
        <div className="absolute inset-0 h-12 w-12 border-2 border-neon-cyan animate-neon-pulse rounded-full"></div>
      </div>
      <div className="text-center">
        <p className="font-terminal text-terminal-green animate-typing">
          [ ESTABLISHING SATELLITE LINK ]
        </p>
        <p className="text-xs font-terminal text-neon-cyan mt-1 loading-dots">
          ACQUIRING ORBITAL DATA
        </p>
      </div>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-4 text-center max-w-md">
      <div className="p-4 bg-black border-2 border-danger-red animate-terminal-flicker">
        <Activity className="h-12 w-12 text-danger-red" />
      </div>
      <div>
        <h3 className="font-display font-bold text-danger-red mb-2 text-lg">
          [ SYSTEM ERROR ]
        </h3>
        <p className="text-sm font-terminal text-terminal-green border border-terminal-green p-3 bg-black">
          {error}
        </p>
        <p className="text-xs font-terminal text-neon-cyan mt-2">
          CONTACT SYSTEM ADMINISTRATOR
        </p>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { isLoading } = useSatelliteData();
  const { error, satellites, viewMode, setViewMode } = useSatelliteStore();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-cosmic flex items-center justify-center">
        <ErrorFallback error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-terminal grid-pattern relative">
      {/* DEFCON Header - Terminal Style */}
      <div 
        className="relative h-24 bg-black border-b-2 border-terminal-green flex items-center terminal-panel"
        style={{ backgroundImage: `url(${spaceHero})`, backgroundBlendMode: 'multiply', opacity: 0.9 }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-black border-2 border-neon-cyan neon-border animate-neon-glow">
                  <Satellite className="h-8 w-8 text-neon-cyan animate-terminal-flicker" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-black text-terminal-green neon-text">
                    ALCHEMIST
                  </h1>
                  <p className="text-sm font-terminal text-neon-cyan">
                    SATELLITE TRACKING TERMINAL
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-black border border-terminal-green p-1">
                <Button
                  variant={viewMode === 'globe' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('globe')}
                  className={`terminal-button h-8 px-3 text-xs ${viewMode === 'globe' ? 'bg-terminal-green/20 border-neon-cyan text-neon-cyan' : ''}`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  TACTICAL VIEW
                </Button>
                <Button
                  variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('spreadsheet')}
                  className={`terminal-button h-8 px-3 text-xs ${viewMode === 'spreadsheet' ? 'bg-terminal-green/20 border-neon-cyan text-neon-cyan' : ''}`}
                >
                  <Table className="h-4 w-4 mr-2" />
                  DATA GRID
                </Button>
              </div>
              <Badge className="terminal-button bg-danger-red/20 border-danger-red text-danger-red animate-terminal-flicker">
                <Activity className="h-3 w-3 mr-1" />
                LIVE FEED
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Interface */}
      <div className="container mx-auto px-4 py-4">
        {viewMode === 'spreadsheet' ? (
          <div className="terminal-panel h-[calc(100vh-160px)] bg-black">
            <div className="p-6 h-full font-terminal">
              {isLoading ? (
                <LoadingSpinner />
              ) : satellites.length === 0 ? (
                <ErrorFallback error="No satellite data available. Please try refreshing the page." />
              ) : (
                <SatelliteSpreadsheet />
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-160px)]">
            {/* Left Terminal Panel - Satellite List */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="terminal-panel h-full bg-black">
                <div className="p-4 h-full font-terminal">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : satellites.length === 0 ? (
                    <ErrorFallback error="No satellite data available. Please try refreshing the page." />
                  ) : (
                    <SatelliteTable />
                  )}
                </div>
              </div>
            </div>

            {/* Center Panel - Tactical Globe Display */}
            <div className="lg:col-span-6 xl:col-span-7">
              <div className="terminal-panel h-full bg-black relative overflow-hidden">
                <div className="absolute top-2 left-4 z-10">
                  <div className="text-xs font-terminal text-neon-cyan">
                    [ TACTICAL DISPLAY - GLOBAL SURVEILLANCE ]
                  </div>
                </div>
                <div className="p-2 h-full">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Globe3D />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Control Terminal */}
            <div className="lg:col-span-2 xl:col-span-2">
              <div className="terminal-panel bg-black h-full">
                <div className="p-2">
                  <ControlPanel />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
