import React, { Suspense } from 'react';
import { Satellite, Loader2, Activity } from 'lucide-react';
import SatelliteTable from '../components/SatelliteTable';
import Globe3D from '../components/Globe3D';
import ControlPanel from '../components/ControlPanel';
import { useSatelliteData } from '../hooks/useSatelliteData';
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

const Index = () => {
  const { isLoading } = useSatelliteData();

  return (
    <div className="min-h-screen bg-gradient-cosmic">
      {/* Hero Header */}
      <div 
        className="relative h-32 bg-cover bg-center bg-no-repeat flex items-center"
        style={{ backgroundImage: `url(${spaceHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-deep-space/80 via-deep-space/60 to-transparent" />
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm border border-primary/30">
                  <Satellite className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-aurora bg-clip-text text-transparent">
                    Orbital Tracker
                  </h1>
                  <p className="text-muted-foreground">
                    Real-time satellite tracking and visualization
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="glass-panel border-primary/30">
                <Activity className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
              <Badge variant="outline" className="cosmic-border">
                Global Coverage
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Satellite Table */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <Card className="glass-panel h-full p-6">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <SatelliteTable />
              )}
            </Card>
          </div>

          {/* Center Panel - 3D Globe */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7">
            <Card className="glass-panel h-full p-2">
              <Suspense fallback={<LoadingSpinner />}>
                <Globe3D />
              </Suspense>
            </Card>
          </div>

          {/* Right Panel - Controls */}
          <div className="col-span-12 lg:col-span-2 xl:col-span-2">
            <ControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
