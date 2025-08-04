import React, { useState, Suspense } from 'react';
import { useSatelliteStore } from '../stores/satelliteStore';
import { useSatelliteData } from '../hooks/useSatelliteData';
import ControlPanel from '../components/ControlPanel';
import SatelliteTable from '../components/SatelliteTable';
import FilterPanel from '../components/FilterPanel';
import SatelliteDetail from '../components/SatelliteDetail';
import UIGuide from '../components/UIGuide';
import ErrorBoundary from '../components/ErrorBoundary';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

// Lazy load heavy components for better performance
const Globe3D = React.lazy(() => import('../components/Globe3D'));
const SatelliteSpreadsheet = React.lazy(() => import('../components/SatelliteSpreadsheet'));
const SatelliteEducation = React.lazy(() => import('../components/SatelliteEducation'));

// Loading fallback component
const ComponentSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center p-8">
    <Card className="w-full max-w-md p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  </div>
);

const Index: React.FC = () => {
  const { viewMode, globeSettings, isLoading, error } = useSatelliteStore();
  const [showFilters, setShowFilters] = useState(false);
  const { fetchSatellites } = useSatelliteData();

  const renderMainContent = () => {
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={fetchSatellites}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </Card>
        </div>
      );
    }

    const content = (() => {
      switch (viewMode) {
        case 'globe':
          return (
            <ErrorBoundary fallback={<ComponentSkeleton />}>
              <Suspense fallback={<ComponentSkeleton />}>
                <Globe3D />
              </Suspense>
            </ErrorBoundary>
          );
        case 'spreadsheet':
          return (
            <ErrorBoundary fallback={<ComponentSkeleton />}>
              <Suspense fallback={<ComponentSkeleton />}>
                <SatelliteSpreadsheet />
              </Suspense>
            </ErrorBoundary>
          );
        case 'guide':
          return <UIGuide />;
        case 'education':
          return (
            <ErrorBoundary fallback={<ComponentSkeleton />}>
              <Suspense fallback={<ComponentSkeleton />}>
                <SatelliteEducation />
              </Suspense>
            </ErrorBoundary>
          );
        default:
          return <SatelliteTable />;
      }
    })();

    return (
      <div className="flex-1 relative">
        {content}
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-4 right-4 z-10">
            <FilterPanel />
          </div>
        )}
        
        {/* Satellite Detail Panel */}
        {globeSettings.selectedSatelliteId && (
          <div className="absolute bottom-4 right-4 z-10 max-w-sm">
            <SatelliteDetail 
              isOpen={!!globeSettings.selectedSatelliteId}
              onClose={() => {/* Handle close */}}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with Control Panel */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <ControlPanel onToggleFilters={() => setShowFilters(!showFilters)} />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative" role="main">
          {renderMainContent()}
        </main>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading satellite data...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
