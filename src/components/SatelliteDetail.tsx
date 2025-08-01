import React, { useState } from 'react';
import { 
  ExternalLink, ChevronDown, ChevronUp, Satellite as SatelliteIcon,
  Globe, Clock, Zap, MapPin, Calendar, Building, Flag,
  Navigation, Radio, Eye, Telescope, Shield, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Satellite, SatelliteType } from '../types/satellite.types';
import { useSatelliteStore } from '../stores/satelliteStore';

interface SatelliteDetailProps {
  satellite: Satellite;
}

const SatelliteDetail: React.FC<SatelliteDetailProps> = ({ satellite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setSelectedSatellite } = useSatelliteStore();

  const getSatelliteIcon = (type: SatelliteType) => {
    switch (type) {
      case 'space-station': return <SatelliteIcon className="h-4 w-4" />;
      case 'constellation': return <Zap className="h-4 w-4" />;
      case 'navigation': return <Navigation className="h-4 w-4" />;
      case 'weather': return <Globe className="h-4 w-4" />;
      case 'communication': return <Radio className="h-4 w-4" />;
      case 'earth-observation': return <Eye className="h-4 w-4" />;
      case 'scientific': return <Telescope className="h-4 w-4" />;
      case 'military': return <Shield className="h-4 w-4" />;
      default: return <SatelliteIcon className="h-4 w-4" />;
    }
  };

  const getSatelliteHistory = (name: string, type: SatelliteType): { description: string; wikipediaUrl: string } => {
    const nameUpper = name.toUpperCase();
    
    // Specific famous satellites
    if (nameUpper.includes('ISS') || nameUpper.includes('ZARYA')) {
      return {
        description: "The International Space Station is a modular space station in low Earth orbit, serving as a microgravity laboratory for scientific research and international cooperation since 1998.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/International_Space_Station"
      };
    }
    
    if (nameUpper.includes('HST') || nameUpper.includes('HUBBLE')) {
      return {
        description: "The Hubble Space Telescope revolutionized astronomy since 1990, providing unprecedented views of distant galaxies, nebulae, and helping determine the age of the universe.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Hubble_Space_Telescope"
      };
    }
    
    if (nameUpper.includes('STARLINK')) {
      return {
        description: "Starlink is SpaceX's satellite internet constellation providing global broadband coverage, with thousands of satellites in low Earth orbit launched since 2019.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Starlink"
      };
    }
    
    if (nameUpper.includes('GPS') || nameUpper.includes('NAVSTAR')) {
      return {
        description: "Global Positioning System satellites provide precise location and timing services worldwide, essential for navigation, mapping, and countless modern applications.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Global_Positioning_System"
      };
    }
    
    if (nameUpper.includes('GOES')) {
      return {
        description: "GOES satellites provide continuous weather monitoring and storm tracking for the Americas, essential for weather forecasting and climate research.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Geostationary_Operational_Environmental_Satellite"
      };
    }
    
    if (nameUpper.includes('IRIDIUM')) {
      return {
        description: "Iridium satellites provide global voice and data communications through a constellation of cross-linked satellites, enabling communication anywhere on Earth.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Iridium_satellite_constellation"
      };
    }
    
    if (nameUpper.includes('ONEWEB')) {
      return {
        description: "OneWeb is building a global satellite internet constellation to provide broadband connectivity to underserved areas worldwide.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/OneWeb_satellite_constellation"
      };
    }
    
    if (nameUpper.includes('GALILEO')) {
      return {
        description: "Galileo is Europe's global navigation satellite system, providing autonomous, high-precision positioning services independent of other GNSS systems.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Galileo_(satellite_navigation)"
      };
    }
    
    if (nameUpper.includes('LANDSAT')) {
      return {
        description: "Landsat satellites have been monitoring Earth's surface since 1972, providing the longest continuous record of Earth observation from space.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Landsat_program"
      };
    }
    
    if (nameUpper.includes('SENTINEL')) {
      return {
        description: "Sentinel satellites are part of Europe's Copernicus program, providing Earth observation data for environmental monitoring and climate research.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Sentinel_(satellite)"
      };
    }
    
    // Generic descriptions by type
    switch (type) {
      case 'space-station':
        return {
          description: "Space stations serve as orbital laboratories for scientific research, technology development, and international cooperation in space exploration.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Space_station"
        };
      case 'constellation':
        return {
          description: "Satellite constellations consist of many satellites working together to provide global coverage for communications, internet, or navigation services.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Satellite_constellation"
        };
      case 'navigation':
        return {
          description: "Navigation satellites provide precise positioning, navigation, and timing services essential for GPS, mapping, and location-based applications.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Satellite_navigation"
        };
      case 'weather':
        return {
          description: "Weather satellites monitor atmospheric conditions, track storms, and provide critical data for weather forecasting and climate research.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Weather_satellite"
        };
      case 'communication':
        return {
          description: "Communication satellites relay telecommunications signals, enabling global phone, internet, and broadcast services across vast distances.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Communications_satellite"
        };
      case 'earth-observation':
        return {
          description: "Earth observation satellites monitor our planet's surface, atmosphere, and oceans for environmental research, mapping, and resource management.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Earth_observation_satellite"
        };
      case 'scientific':
        return {
          description: "Scientific satellites conduct space-based research, astronomy, and experiments impossible on Earth, advancing our understanding of the universe.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Scientific_satellite"
        };
      case 'military':
        return {
          description: "Military satellites provide secure communications, surveillance, navigation, and intelligence gathering for national defense purposes.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Military_satellite"
        };
      default:
        return {
          description: "This satellite serves various purposes in space, contributing to communications, research, or other space-based applications.",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Satellite"
        };
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAltitude = (altitude: number | undefined) => {
    if (!altitude) return 'N/A';
    return altitude > 1000 ? `${(altitude / 1000).toFixed(1)}K km` : `${altitude.toFixed(0)} km`;
  };

  const formatPeriod = (period: number) => {
    const hours = Math.floor(period / 60);
    const minutes = Math.floor(period % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getOrbitalType = (altitude: number) => {
    if (altitude < 2000) return { type: 'Low Earth Orbit (LEO)', color: 'text-green-400' };
    if (altitude < 35786) return { type: 'Medium Earth Orbit (MEO)', color: 'text-blue-400' };
    return { type: 'Geostationary Earth Orbit (GEO)', color: 'text-purple-400' };
  };

  const history = getSatelliteHistory(satellite.name, satellite.type);
  const orbitalType = getOrbitalType(satellite.position.altitude);

  return (
    <Card className="w-full bg-background/95 backdrop-blur-sm border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {getSatelliteIcon(satellite.type)}
            <span className="truncate">{satellite.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSatellite(null)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Agency:</span>
              <span className="font-medium">{satellite.metadata?.constellation || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flag className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Country:</span>
              <span className="font-medium">{satellite.metadata?.country || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Altitude:</span>
              <span className="font-medium">{formatAltitude(satellite.position.altitude)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">{formatPeriod(satellite.orbital.period)}</span>
            </div>
          </div>

          {/* Status and Type */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {satellite.type.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className={`text-xs ${orbitalType.color}`}>
              {orbitalType.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {satellite.status}
            </Badge>
          </div>

          {isExpanded && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <Separator />
              
              {/* Description and History */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center">
                  📖 Description & Usage
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {history.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open(history.wikipediaUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Learn more on Wikipedia
                </Button>
              </div>

              <Separator />

              {/* Detailed Specifications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center">
                  📊 Orbital Specifications
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Altitude:</span>
                    <span className="font-mono">{satellite.position.altitude.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orbital Period:</span>
                    <span className="font-mono">{satellite.orbital.period.toFixed(1)} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inclination:</span>
                    <span className="font-mono">{satellite.orbital.inclination.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eccentricity:</span>
                    <span className="font-mono">{satellite.orbital.eccentricity.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocity:</span>
                    <span className="font-mono">{satellite.velocity?.toFixed(2) || 'N/A'} km/s</span>
                  </div>
                  {satellite.footprint && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage Radius:</span>
                      <span className="font-mono">{satellite.footprint.toFixed(0)} km</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Current Position */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center">
                  🌍 Current Position
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-mono">{satellite.position.latitude.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-mono">{satellite.position.longitude.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="text-xs">{formatLastUpdate(satellite.position.timestamp)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Launch Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center">
                  🚀 Launch Information
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Launch Date:</span>
                    <span className="font-mono">{satellite.metadata?.launchDate ? new Date(satellite.metadata.launchDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NORAD ID:</span>
                    <span className="font-mono">{satellite.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteDetail;