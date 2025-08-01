import React, { Suspense } from 'react';
import { Satellite, Loader2, Activity } from 'lucide-react';
import SatelliteTable from '../components/SatelliteTable';
import Globe3D from '../components/Globe3D';
import ControlPanel from '../components/ControlPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSatelliteData } from '../hooks/useSatelliteData';
import { useSatelliteStore } from '../stores/satelliteStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import spaceHero from '../assets/space-hero.jpg';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading satellite data...</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-4 text-center max-w-md">
      <div className="p-3 bg-destructive/20 rounded-lg">
        <Activity className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-2">Unable to Load Data</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { isLoading } = useSatelliteData();
  const { error, satellites } = useSatelliteStore();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-cosmic flex items-center justify-center">
        <ErrorFallback error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cosmic">
      {/* Hero Header - Reduced height */}
      <div 
        className="relative h-20 bg-cover bg-center bg-no-repeat flex items-center"
        style={{ backgroundImage: `url(${spaceHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-deep-space/80 via-deep-space/60 to-transparent" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-primary/20 rounded-lg backdrop-blur-sm border border-primary/30">
                  <Satellite className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-aurora bg-clip-text text-transparent">
                    Orbital Tracker
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Real-time satellite tracking and visualization
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className="glass-panel border-primary/30 text-sm">
                <Activity className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
              <Badge variant="outline" className="cosmic-border text-sm">
                Global Coverage
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Reduced height */}
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-140px)]">
          {/* Left Panel - Satellite Table */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="glass-panel h-full">
              <div className="p-3 h-full">
                {isLoading ? (
                  <LoadingSpinner />
                ) : satellites.length === 0 ? (
                  <ErrorFallback error="No satellite data available. Please try refreshing the page." />
                ) : (
                  <SatelliteTable />
                )}
              </div>
            </Card>
          </div>

          {/* Center Panel - 3D Globe */}
          <div className="lg:col-span-6 xl:col-span-7">
            <Card className="glass-panel h-full">
              <div className="p-1 h-full">
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
            </Card>
          </div>

          {/* Right Panel - Controls */}
          <div className="lg:col-span-2 xl:col-span-2">
            <ControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
