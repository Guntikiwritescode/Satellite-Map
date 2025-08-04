import React from 'react';
import { Satellite, SatelliteIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSatelliteStore } from '../stores/satelliteStore';

const SatelliteTable: React.FC = () => {
  const { 
    filteredSatellites,
    setSelectedSatellite,
    globeSettings: { selectedSatelliteId }
  } = useSatelliteStore();

  const formatNumber = (value: string | number | undefined, decimals: number = 1): string => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? 'N/A' : num.toFixed(decimals);
  };

  const getTypeIcon = (type: string) => {
    return <SatelliteIcon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string): string => {
    const colors = {
      'space-station': 'bg-blue-500',
      'constellation': 'bg-purple-500',
      'navigation': 'bg-green-500',
      'weather': 'bg-orange-500',
      'scientific': 'bg-cyan-500',
      'earth-observation': 'bg-emerald-500',
      'rocket-body': 'bg-gray-500',
      'military': 'bg-red-500',
      'communication': 'bg-yellow-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-400';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Satellite className="h-5 w-5" />
          <span>Satellite Catalog ({filteredSatellites.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Altitude (km)</TableHead>
                <TableHead>Period (min)</TableHead>
                <TableHead>Inclination (°)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSatellites.map((satellite) => (
                <TableRow 
                  key={satellite.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedSatelliteId === satellite.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedSatellite(satellite.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getTypeColor(satellite.type)}`} />
                      <span className="truncate max-w-[200px]">{satellite.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getTypeIcon(satellite.type)}
                      <span className="text-xs capitalize">{satellite.type.replace('-', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {satellite.metadata?.country || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatNumber(satellite.position?.altitude)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatNumber(satellite.orbital?.period)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatNumber(satellite.orbital?.inclination)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SatelliteTable;