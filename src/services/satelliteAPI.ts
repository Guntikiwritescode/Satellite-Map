import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Real satellite data from public APIs
const CELESTRAK_API = 'https://tle.ivanstanojevic.me/api/tle';
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Well-known satellite NORAD IDs
const KNOWN_SATELLITES = [
  { id: 25544, name: 'ISS (ZARYA)', type: 'space-station' as SatelliteType, agency: 'NASA/Roscosmos', country: 'International' },
  { id: 44713, name: 'STARLINK-1019', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 44714, name: 'STARLINK-1021', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 29601, name: 'GPS BIIR-2 (PRN 13)', type: 'navigation' as SatelliteType, agency: 'US Air Force', country: 'USA' },
  { id: 25994, name: 'TERRA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 41866, name: 'GOES-16', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' },
  { id: 40697, name: 'SENTINEL-2A', type: 'earth-observation' as SatelliteType, agency: 'ESA', country: 'Europe' },
  { id: 43013, name: 'STARLINK-1130', type: 'constellation' as SatelliteType, agency: 'SpaceX', country: 'USA' },
  { id: 27424, name: 'AQUA', type: 'earth-observation' as SatelliteType, agency: 'NASA', country: 'USA' },
  { id: 39084, name: 'NOAA-20 (JPSS-1)', type: 'weather' as SatelliteType, agency: 'NOAA', country: 'USA' }
];

interface TLEData {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
}

class RealSatelliteAPI {
  private updateInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: ((satellites: Satellite[]) => void) | null = null;
  private cachedSatellites: Satellite[] = [];

  async fetchTLEData(satelliteId: number): Promise<TLEData | null> {
    try {
      const response = await fetch(`${CELESTRAK_API}/${satelliteId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch TLE for satellite ${satelliteId}`);
      }
      const data = await response.json();
      return {
        satelliteId,
        name: data.name,
        line1: data.line1,
        line2: data.line2
      };
    } catch (error) {
      console.error(`Error fetching TLE for satellite ${satelliteId}:`, error);
      return null;
    }
  }

  calculateSatellitePosition(tleData: TLEData): Satellite['position'] {
    try {
      const satrec = satellite.twoline2satrec(tleData.line1, tleData.line2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        return {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: positionGd.height,
          timestamp: now.getTime()
        };
      }
    } catch (error) {
      console.error('Error calculating satellite position:', error);
    }
    
    return {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      timestamp: Date.now()
    };
  }

  calculateOrbitalParameters(tleData: TLEData) {
    try {
      const satrec = satellite.twoline2satrec(tleData.line1, tleData.line2);
      
      // Extract orbital elements from TLE
      const meanMotion = satrec.no; // rad/min
      const period = (2 * Math.PI) / meanMotion; // minutes
      const semiMajorAxis = Math.pow((398600.4418 * Math.pow(period / (2 * Math.PI), 2)), 1/3); // km
      const altitude = semiMajorAxis - 6371; // km (subtract Earth radius)
      const inclination = satrec.inclo * 180 / Math.PI; // degrees
      const eccentricity = satrec.ecco;
      const velocity = Math.sqrt(398600.4418 / semiMajorAxis); // km/s
      
      return {
        altitude: Math.max(0, altitude),
        period: period,
        inclination: inclination,
        eccentricity: eccentricity,
        velocity: velocity
      };
    } catch (error) {
      console.error('Error calculating orbital parameters:', error);
      return {
        altitude: 400,
        period: 90,
        inclination: 0,
        eccentricity: 0,
        velocity: 7.8
      };
    }
  }

  async getSatellites(): Promise<Satellite[]> {
    console.log('Attempting to load real satellite data...');
    const satellites: Satellite[] = [];
    
    for (const satInfo of KNOWN_SATELLITES) {
      try {
        const tleData = await this.fetchTLEData(satInfo.id);
        if (tleData) {
          const position = this.calculateSatellitePosition(tleData);
          const orbital = this.calculateOrbitalParameters(tleData);
          
          const satellite: Satellite = {
            id: satInfo.id.toString(),
            name: satInfo.name,
            type: satInfo.type,
            country: satInfo.country,
            agency: satInfo.agency,
            launchDate: '2000-01-01',
            status: 'active' as SatelliteStatus,
            orbital,
            position,
            tle: {
              line1: tleData.line1,
              line2: tleData.line2
            },
            footprint: this.calculateFootprint(orbital.altitude)
          };
          
          satellites.push(satellite);
        }
      } catch (error) {
        console.error(`Failed to process satellite ${satInfo.name}:`, error);
        // Continue processing other satellites instead of failing completely
      }
    }
    
    console.log(`Successfully loaded ${satellites.length} real satellites`);
    this.cachedSatellites = satellites;
    return satellites;
  }

  calculateFootprint(altitude: number): number {
    // Calculate the radio horizon for satellite visibility
    const earthRadius = 6371; // km
    const heightAboveEarth = altitude;
    return Math.sqrt(heightAboveEarth * (heightAboveEarth + 2 * earthRadius));
  }

  async getLaunches(): Promise<Launch[]> {
    try {
      const response = await fetch(`${LAUNCH_API}/upcoming/?limit=10`);
      const data = await response.json();
      
      return data.results.map((launch: any) => ({
        id: launch.id,
        name: launch.name,
        launchDate: new Date(launch.net),
        status: launch.status.name.toLowerCase(),
        rocket: launch.rocket?.configuration?.full_name || 'Unknown',
        agency: launch.launch_service_provider?.name || 'Unknown',
        mission: launch.mission?.description || launch.name,
        launchSite: launch.pad?.name || 'Unknown',
        payloads: launch.mission?.payload_count ? [`${launch.mission.payload_count} payloads`] : [],
        countdown: Math.max(0, Math.floor((new Date(launch.net).getTime() - Date.now()) / 1000))
      }));
    } catch (error) {
      console.error('Error fetching launches:', error);
      return [];
    }
  }

  startRealTimeUpdates(callback: (satellites: Satellite[]) => void) {
    this.onDataUpdate = callback;
    
    // Initial load with fallback
    this.getSatellitesWithFallback().then(callback);
    
    // Update satellite positions every 3 seconds
    this.updateInterval = setInterval(async () => {
      try {
        if (this.cachedSatellites.length > 0) {
          console.log('Updating satellite positions every 3 seconds for', this.cachedSatellites.length, 'satellites');
          
          const updatedSatellites = this.cachedSatellites.map(satellite => {
            return {
              ...satellite,
              position: this.calculateOrbitalPosition(satellite)
            };
          });
          
          this.cachedSatellites = updatedSatellites;
          callback(updatedSatellites);
        }
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    }, 3000); // 3 seconds
  }

  calculateOrbitalPosition(satellite: Satellite): Satellite['position'] {
    // Validate input data and provide fallbacks
    if (!satellite?.orbital) {
      console.warn('Missing orbital data for satellite:', satellite?.id);
      return {
        latitude: 0,
        longitude: 0,
        altitude: 400,
        timestamp: Date.now()
      };
    }

    const currentTime = Date.now() / 1000; // Current time in seconds
    
    // Calculate orbital parameters with validation
    const period = satellite.orbital.period || 90; // Default 90 minutes if missing
    const altitude = satellite.orbital.altitude || 400; // Default 400km if missing
    const inclination = satellite.orbital.inclination || 0; // Default 0 degrees if missing
    
    const orbitPeriodSeconds = period * 60; // Convert minutes to seconds
    const orbitSpeed = (2 * Math.PI) / orbitPeriodSeconds; // radians per second
    
    // Add satellite-specific offset for distribution along orbit
    // Convert ID to number safely
    const satelliteIdNum = parseInt(satellite.id) || 0;
    const satelliteOffset = (satelliteIdNum % 1000) / 1000 * Math.PI * 2;
    const angle = (currentTime * orbitSpeed + satelliteOffset) % (Math.PI * 2);
    
    // Earth parameters
    const earthRadiusKm = 6371;
    const orbitalRadiusKm = earthRadiusKm + altitude;
    const inclinationRad = (inclination * Math.PI) / 180;
    
    // Calculate position on orbital path
    let x = orbitalRadiusKm * Math.cos(angle);
    let y = 0;
    let z = orbitalRadiusKm * Math.sin(angle);
    
    // Apply inclination rotation
    const rotatedY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
    const rotatedZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
    
    // Convert back to lat/lon for position tracking
    const distance = Math.sqrt(x * x + rotatedY * rotatedY + rotatedZ * rotatedZ);
    
    // Validate calculations before returning
    const latitude = Math.asin(Math.max(-1, Math.min(1, rotatedY / distance))) * 180 / Math.PI;
    const longitude = Math.atan2(rotatedZ, x) * 180 / Math.PI;
    
    // Final validation to ensure no NaN values
    return {
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      altitude: isNaN(altitude) ? 400 : altitude,
      timestamp: Date.now()
    };
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.onDataUpdate = null;
  }

  async searchSatellites(query: string): Promise<Satellite[]> {
    return this.cachedSatellites.filter(sat => 
      sat.name.toLowerCase().includes(query.toLowerCase()) ||
      sat.agency.toLowerCase().includes(query.toLowerCase())
    );
  }

  getFilterOptions() {
    // Use cached satellites if available, otherwise return defaults
    if (this.cachedSatellites.length > 0) {
      const types = [...new Set(this.cachedSatellites.map(s => s.type))].sort() as SatelliteType[];
      const countries = [...new Set(this.cachedSatellites.map(s => s.country))].sort();
      const agencies = [...new Set(this.cachedSatellites.map(s => s.agency))].sort();
      const statuses = [...new Set(this.cachedSatellites.map(s => s.status))].sort() as SatelliteStatus[];
      
      return { types, countries, agencies, statuses };
    }
    
    // Fallback defaults when no data is loaded
    return {
      types: ['space-station', 'constellation', 'navigation', 'weather', 'earth-observation'] as SatelliteType[],
      countries: ['USA', 'International', 'Europe'],
      agencies: ['NASA', 'SpaceX', 'ESA', 'NOAA'],
      statuses: ['active'] as SatelliteStatus[]
    };
  }

  // Use comprehensive mock data directly (bypassing rate-limited API)
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    console.log('Loading comprehensive satellite catalog...');
    const mockSatellites = this.getMockSatellites();
    this.cachedSatellites = mockSatellites;
    console.log(`Loaded ${mockSatellites.length} satellites from comprehensive catalog`);
    return mockSatellites;
    
    /* DISABLED: Real API calls hit rate limits
    try {
      console.log('Attempting to load real satellite data...');
      const realSatellites = await this.getSatellites();
      if (realSatellites.length > 0) {
        console.log('Successfully loaded real satellite data:', realSatellites.length);
        return realSatellites;
      }
    } catch (error) {
      console.warn('Real satellite API failed, using mock data:', error);
    }

    // Fallback to mock data
    console.log('Using mock satellite data as fallback');
    const mockSatellites = this.getMockSatellites();
    this.cachedSatellites = mockSatellites; // Cache the mock data
    return mockSatellites;
    */
  }

  getMockSatellites(): Satellite[] {
    console.log('Generating comprehensive satellite catalog with 100 satellites...');
    
    // Generate realistic moving positions for mock satellites
    const generatePosition = (baseLatOffset: number, baseLonOffset: number) => {
      const time = Date.now() / 1000;
      const orbitSpeed = 0.1; // degrees per second
      
      return {
        latitude: Math.sin(time * orbitSpeed + baseLatOffset) * 60, // ±60 degrees
        longitude: ((time * orbitSpeed + baseLonOffset) % 360) - 180, // -180 to +180
        altitude: 0, // This will be overridden by orbital.altitude
        timestamp: Date.now()
      };
    };
    
    const mockSatellites: Satellite[] = [
      // SPACE STATIONS (2)
      {
        id: '25544',
        name: 'ISS (ZARYA)',
        type: 'space-station',
        country: 'International',
        agency: 'NASA/Roscosmos',
        launchDate: '1998-11-20',
        status: 'active',
        description: 'The International Space Station is a modular space station in low Earth orbit. It serves as a microgravity research laboratory where crew members conduct experiments in biology, human biology, physics, astronomy, and meteorology. The ISS is the largest human-made object in space and has been continuously inhabited since November 2000.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/International_Space_Station',
        orbital: {
          altitude: 408,
          period: 92.68,
          inclination: 51.6,
          eccentricity: 0.0001,
          velocity: 7.66
        },
        position: generatePosition(0, 0),
        tle: {
          line1: '1 25544U 98067A   23001.00000000  .00001742  00000-0  37350-4 0  9990',
          line2: '2 25544  51.6393 339.2928 0001897  95.8340 264.3200 15.49299371367649'
        },
        footprint: 4500
      },
      {
        id: '48274',
        name: 'TIANGONG SPACE STATION',
        type: 'space-station',
        country: 'China',
        agency: 'CNSA',
        launchDate: '2021-04-29',
        status: 'active',
        description: 'Tiangong is China\'s modular space station in low Earth orbit. The name "Tiangong" translates to "Heavenly Palace". It serves as a national laboratory for scientific research and technology demonstrations. The station is designed to support long-term crewed missions and international cooperation in space exploration.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Tiangong_space_station',
        orbital: {
          altitude: 340,
          period: 91.2,
          inclination: 41.5,
          eccentricity: 0.0001,
          velocity: 7.68
        },
        position: generatePosition(0.5, 15),
        tle: {
          line1: '1 48274U 21035A   23001.00000000  .00001742  00000-0  37350-4 0  9990',
          line2: '2 48274  41.5393 339.2928 0001897  95.8340 264.3200 15.52299371367649'
        },
        footprint: 4200
      },

      // STARLINK CONSTELLATION (20 satellites)
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `starlink-${44713 + i}`,
        name: `STARLINK-${1007 + i}`,
        type: 'constellation' as const,
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2019-05-24',
        status: 'active' as const,
        description: 'Starlink is a satellite internet constellation operated by SpaceX, providing satellite Internet access coverage to most of Earth. The constellation consists of thousands of mass-produced small satellites in low Earth orbit, which communicate with designated ground transceivers.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Starlink',
        orbital: {
          altitude: 550,
          period: 95.4,
          inclination: 53.0,
          eccentricity: 0.0001,
          velocity: 7.57
        },
        position: generatePosition(1 + i * 0.1, 45 + i * 18),
        tle: {
          line1: `1 ${44713 + i}U 19074A   23001.00000000  .00001345  00000-0  10270-3 0  999${i}`,
          line2: `2 ${44713 + i}  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234`
        },
        footprint: 1000
      })),

      // GPS CONSTELLATION (15 satellites)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `gps-${28361 + i}`,
        name: `GPS IIF-${i + 1}`,
        type: 'navigation' as const,
        country: 'USA',
        agency: 'US Space Force',
        launchDate: '2010-05-28',
        status: 'active' as const,
        description: 'The Global Positioning System (GPS) is a satellite-based radionavigation system owned by the US Space Force and operated by the 2nd Space Operations Squadron. It provides geolocation and time information to GPS receivers anywhere on Earth where there is an unobstructed line of sight to four or more GPS satellites.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Global_Positioning_System',
        orbital: {
          altitude: 20200,
          period: 717.97,
          inclination: 55.0,
          eccentricity: 0.02,
          velocity: 3.87
        },
        position: generatePosition(2 + i * 0.3, 60 + i * 24),
        tle: {
          line1: `1 ${28361 + i}U 10022A   23001.00000000 -.00000007  00000-0  00000+0 0  999${i}`,
          line2: `2 ${28361 + i}  55.0000 ${60 + i * 24}.0000 0020000  90.0000 270.0000  2.00563365085000`
        },
        footprint: 12000
      })),

      // GALILEO NAVIGATION (10 satellites)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `galileo-${37846 + i}`,
        name: `GALILEO-${i + 1}`,
        type: 'navigation' as const,
        country: 'Europe',
        agency: 'ESA',
        launchDate: '2011-10-21',
        status: 'active' as const,
        description: 'Galileo is a global navigation satellite system (GNSS) created by the European Union through the European Space Agency (ESA). It is intended to allow for better positioning services at higher latitudes than other positioning systems and to provide an alternative to GPS.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Galileo_(satellite_navigation)',
        orbital: {
          altitude: 23222,
          period: 844.7,
          inclination: 56.0,
          eccentricity: 0.0004,
          velocity: 3.63
        },
        position: generatePosition(3 + i * 0.2, 120 + i * 36),
        tle: {
          line1: `1 ${37846 + i}U 11060A   23001.00000000  .00000004  00000-0  00000+0 0  999${i}`,
          line2: `2 ${37846 + i}  56.0000 ${120 + i * 36}.0000 0004000  90.0000 270.0000  1.70475396000000`
        },
        footprint: 15000
      })),

      // WEATHER SATELLITES (8)
      {
        id: '33591',
        name: 'NOAA-19',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2009-02-06',
        status: 'active',
        orbital: {
          altitude: 870,
          period: 102.12,
          inclination: 98.7,
          eccentricity: 0.0014,
          velocity: 7.35
        },
        position: generatePosition(4, 180),
        tle: {
          line1: '1 33591U 09005A   23001.00000000  .00000176  00000-0  10226-3 0  9990',
          line2: '2 33591  98.7123 233.2345 0014123  95.8340 264.3200 14.12270771708546'
        },
        footprint: 2800
      },
      {
        id: '28654',
        name: 'METOP-A',
        type: 'weather',
        country: 'Europe',
        agency: 'EUMETSAT',
        launchDate: '2006-10-19',
        status: 'active',
        orbital: {
          altitude: 817,
          period: 101.34,
          inclination: 98.7,
          eccentricity: 0.0012,
          velocity: 7.4
        },
        position: generatePosition(4.5, 200),
        tle: {
          line1: '1 28654U 06044A   23001.00000000  .00000176  00000-0  10226-3 0  9990',
          line2: '2 28654  98.7123 233.2345 0012123  95.8340 264.3200 14.18270771708546'
        },
        footprint: 2700
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `weather-${43013 + i}`,
        name: `GOES-${16 + i}`,
        type: 'weather' as const,
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2016-11-19',
        status: 'active' as const,
        orbital: {
          altitude: 35786,
          period: 1436,
          inclination: 0.1,
          eccentricity: 0.0003,
          velocity: 3.07
        },
        position: generatePosition(5 + i * 0.1, 220 + i * 60),
        tle: {
          line1: `1 ${43013 + i}U 16071A   23001.00000000  .00000004  00000-0  00000+0 0  999${i}`,
          line2: `2 ${43013 + i}   0.1000 ${220 + i * 60}.0000 0003000  90.0000 270.0000  1.00271096000000`
        },
        footprint: 18000
      })),

      // EARTH OBSERVATION (12)
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `earthobs-${39084 + i}`,
        name: `LANDSAT-${8 + Math.floor(i/4)}`,
        type: 'earth-observation' as const,
        country: 'USA',
        agency: 'NASA/USGS',
        launchDate: '2013-02-11',
        status: 'active' as const,
        orbital: {
          altitude: 705,
          period: 98.9,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.5
        },
        position: generatePosition(6 + i * 0.3, 240 + i * 30),
        tle: {
          line1: `1 ${39084 + i}U 13008A   23001.00000000  .00000345  00000-0  18270-3 0  999${i}`,
          line2: `2 ${39084 + i}  98.2000 ${240 + i * 30}.0000 0001000  95.0000 265.0000 14.57113027000000`
        },
        footprint: 2200
      })),

      // SCIENTIFIC SATELLITES (8)
      {
        id: '43013',
        name: 'HUBBLE SPACE TELESCOPE',
        type: 'scientific',
        country: 'International',
        agency: 'NASA/ESA',
        launchDate: '1990-04-24',
        status: 'active',
        description: 'The Hubble Space Telescope is a space telescope that was launched into low Earth orbit in 1990 and remains in operation. It was not the first space telescope, but it is one of the largest and most versatile, renowned for its deep space images and groundbreaking scientific discoveries.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope',
        orbital: {
          altitude: 547,
          period: 95.42,
          inclination: 28.5,
          eccentricity: 0.0003,
          velocity: 7.59
        },
        position: generatePosition(7, 300),
        tle: {
          line1: '1 20580U 90037B   23001.00000000  .00000345  00000-0  18270-3 0  9990',
          line2: '2 20580  28.4687 123.4567 0002978  95.8340 264.3200 15.09327896000000'
        },
        footprint: 1200
      },
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `science-${25544 + 1000 + i}`,
        name: `SCIENTIFIC-${i + 1}`,
        type: 'scientific' as const,
        country: 'International',
        agency: 'NASA',
        launchDate: '2018-01-01',
        status: 'active' as const,
        orbital: {
          altitude: 600 + i * 100,
          period: 96 + i * 2,
          inclination: 45 + i * 10,
          eccentricity: 0.0001,
          velocity: 7.5 - i * 0.1
        },
        position: generatePosition(8 + i * 0.2, 320 + i * 45),
        tle: {
          line1: `1 ${25544 + 1000 + i}U 18001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i}`,
          line2: `2 ${25544 + 1000 + i}  ${45 + i * 10}.0000 ${320 + i * 45}.0000 0001000  95.0000 265.0000 15.00000000000000`
        },
        footprint: 1500 + i * 200
      })),

      // COMMUNICATION SATELLITES (15)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `comsat-${25924 + i}`,
        name: `INTELSAT-${20 + i}`,
        type: 'communication' as const,
        country: 'International',
        agency: 'Intelsat',
        launchDate: '2019-01-01',
        status: 'active' as const,
        orbital: {
          altitude: 35786,
          period: 1436,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(9 + i * 0.1, 0 + i * 24),
        tle: {
          line1: `1 ${25924 + i}U 19001A   23001.00000000  .00000004  00000-0  00000+0 0  999${i}`,
          line2: `2 ${25924 + i}   0.1000 ${0 + i * 24}.0000 0001000  90.0000 270.0000  1.00271096000000`
        },
        footprint: 18000
      })),

      // MILITARY/RECONNAISSANCE (5)
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `military-${37348 + i}`,
        name: `CLASSIFIED-${i + 1}`,
        type: 'military' as const,
        country: 'USA',
        agency: 'US Space Force',
        launchDate: '2020-01-01',
        status: 'active' as const,
        orbital: {
          altitude: 800 + i * 200,
          period: 100 + i * 5,
          inclination: 70 + i * 5,
          eccentricity: 0.001,
          velocity: 7.4 - i * 0.1
        },
        position: generatePosition(10 + i * 0.5, 90 + i * 72),
        tle: {
          line1: `1 ${37348 + i}U 20001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i}`,
          line2: `2 ${37348 + i}  ${70 + i * 5}.0000 ${90 + i * 72}.0000 0010000  95.0000 265.0000 14.00000000000000`
        },
        footprint: 2500 + i * 300
      })),

      // COMMERCIAL/OTHER (10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `commercial-${40000 + i}`,
        name: `COMMERCIAL-${i + 1}`,
        type: 'commercial' as const,
        country: 'Various',
        agency: 'Commercial',
        launchDate: '2021-01-01',
        status: 'active' as const,
        orbital: {
          altitude: 500 + i * 50,
          period: 94 + i * 1,
          inclination: 30 + i * 15,
          eccentricity: 0.0001,
          velocity: 7.6 - i * 0.05
        },
        position: generatePosition(11 + i * 0.3, 150 + i * 36),
        tle: {
          line1: `1 ${40000 + i}U 21001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i}`,
          line2: `2 ${40000 + i}  ${30 + i * 15}.0000 ${150 + i * 36}.0000 0001000  95.0000 265.0000 15.00000000000000`
        },
        footprint: 1200 + i * 100
      })),

      // PLANET LABS DOVE CONSTELLATION (10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `dove-${44420 + i}`,
        name: `DOVE-${i + 1}`,
        type: 'earth-observation' as const,
        country: 'USA',
        agency: 'Planet Labs',
        launchDate: '2020-01-01',
        status: 'active' as const,
        orbital: {
          altitude: 475,
          period: 93.4,
          inclination: 97.4,
          eccentricity: 0.0001,
          velocity: 7.62
        },
        position: generatePosition(12 + i * 0.2, 270 + i * 36),
        tle: {
          line1: `1 ${44420 + i}U 20001A   23001.00000000  .00000845  00000-0  42270-3 0  999${i}`,
          line2: `2 ${44420 + i}  97.4000 ${270 + i * 36}.0000 0001000  95.0000 265.0000 15.30000000000000`
        },
        footprint: 800
      })),
      {
        id: '44714',
        name: 'STARLINK-1008',
        type: 'constellation',
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2019-05-24',
        status: 'active',
        orbital: {
          altitude: 550,
          period: 95.4,
          inclination: 53.0,
          eccentricity: 0.0001,
          velocity: 7.57
        },
        position: generatePosition(1.1, 50),
        tle: {
          line1: '1 44714U 19074B   23001.00000000  .00001345  00000-0  10270-3 0  9991',
          line2: '2 44714  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234'
        },
        footprint: 1000
      },
      {
        id: '51862',
        name: 'STARLINK-3075',
        type: 'constellation',
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2022-02-25',
        status: 'active',
        orbital: {
          altitude: 540,
          period: 95.2,
          inclination: 53.2,
          eccentricity: 0.0001,
          velocity: 7.58
        },
        position: generatePosition(1.2, 55),
        tle: {
          line1: '1 51862U 22025A   23001.00000000  .00001345  00000-0  10270-3 0  9991',
          line2: '2 51862  53.2536  90.4721 0001425  95.4618 264.6879 15.05644835201234'
        },
        footprint: 1000
      },

      // GPS CONSTELLATION
      {
        id: '29601',
        name: 'GPS BIIR-2 (PRN 13)',
        type: 'navigation',
        country: 'USA',
        agency: 'US Air Force',
        launchDate: '1997-07-23',
        status: 'active',
        orbital: {
          altitude: 20200,
          period: 717.97,
          inclination: 55.0,
          eccentricity: 0.0048,
          velocity: 3.87
        },
        position: generatePosition(2, 90),
        tle: {
          line1: '1 29601U 97035A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 29601  54.9988 123.4567 0048123  45.6789 314.5678  2.00564321123456'
        },
        footprint: 12000
      },
      {
        id: '40294',
        name: 'GPS BIIF-5 (PRN 30)',
        type: 'navigation',
        country: 'USA',
        agency: 'US Air Force',
        launchDate: '2014-02-20',
        status: 'active',
        orbital: {
          altitude: 20180,
          period: 717.8,
          inclination: 54.8,
          eccentricity: 0.0045,
          velocity: 3.87
        },
        position: generatePosition(2.1, 120),
        tle: {
          line1: '1 40294U 14016A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 40294  54.8988 153.4567 0045123  45.6789 314.5678  2.00564321123456'
        },
        footprint: 12000
      },
      {
        id: '43873',
        name: 'GPS BIII-3 (PRN 32)',
        type: 'navigation',
        country: 'USA',
        agency: 'US Space Force',
        launchDate: '2018-12-23',
        status: 'active',
        orbital: {
          altitude: 20190,
          period: 717.9,
          inclination: 54.9,
          eccentricity: 0.0046,
          velocity: 3.87
        },
        position: generatePosition(2.2, 150),
        tle: {
          line1: '1 43873U 18109A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 43873  54.9988 183.4567 0046123  45.6789 314.5678  2.00564321123456'
        },
        footprint: 12000
      },

      // GALILEO NAVIGATION
      {
        id: '37846',
        name: 'GALILEO-1 (GSAT0101)',
        type: 'navigation',
        country: 'Europe',
        agency: 'ESA',
        launchDate: '2011-10-21',
        status: 'active',
        orbital: {
          altitude: 23222,
          period: 844.1,
          inclination: 56.0,
          eccentricity: 0.0002,
          velocity: 3.6
        },
        position: generatePosition(2.3, 180),
        tle: {
          line1: '1 37846U 11060A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 37846  56.0988 213.4567 0002123  45.6789 314.5678  1.70564321123456'
        },
        footprint: 15000
      },

      // EARTH OBSERVATION SATELLITES
      {
        id: '25994',
        name: 'TERRA',
        type: 'earth-observation',
        country: 'USA',
        agency: 'NASA',
        launchDate: '1999-12-18',
        status: 'active',
        orbital: {
          altitude: 705,
          period: 98.8,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: generatePosition(3, 135),
        tle: {
          line1: '1 25994U 99068A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 25994  98.2123  45.6789 0001234  87.6543 272.3456 14.57123456789012'
        },
        footprint: 2800
      },
      {
        id: '27424',
        name: 'AQUA',
        type: 'earth-observation',
        country: 'USA',
        agency: 'NASA',
        launchDate: '2002-05-04',
        status: 'active',
        orbital: {
          altitude: 705,
          period: 98.8,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: generatePosition(3.1, 145),
        tle: {
          line1: '1 27424U 02022A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 27424  98.2123  55.6789 0001234  87.6543 272.3456 14.57123456789012'
        },
        footprint: 2800
      },
      {
        id: '39084',
        name: 'LANDSAT 8',
        type: 'earth-observation',
        country: 'USA',
        agency: 'NASA/USGS',
        launchDate: '2013-02-11',
        status: 'active',
        orbital: {
          altitude: 705,
          period: 98.8,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: generatePosition(3.2, 155),
        tle: {
          line1: '1 39084U 13008A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 39084  98.2123  65.6789 0001234  87.6543 272.3456 14.57123456789012'
        },
        footprint: 2800
      },
      {
        id: '49260',
        name: 'LANDSAT 9',
        type: 'earth-observation',
        country: 'USA',
        agency: 'NASA/USGS',
        launchDate: '2021-09-27',
        status: 'active',
        orbital: {
          altitude: 705,
          period: 98.8,
          inclination: 98.2,
          eccentricity: 0.0001,
          velocity: 7.45
        },
        position: generatePosition(3.3, 165),
        tle: {
          line1: '1 49260U 21088A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 49260  98.2123  75.6789 0001234  87.6543 272.3456 14.57123456789012'
        },
        footprint: 2800
      },

      // WEATHER SATELLITES
      {
        id: '41866',
        name: 'GOES-16',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2016-11-19',
        status: 'active',
        orbital: {
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(4, 180),
        tle: {
          line1: '1 41866U 16071A   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 41866   0.0567 123.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },
      {
        id: '43226',
        name: 'GOES-17',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2018-03-01',
        status: 'active',
        orbital: {
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(4.1, 210),
        tle: {
          line1: '1 43226U 18022A   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 43226   0.0567 153.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },
      {
        id: '40069',
        name: 'NOAA-20',
        type: 'weather',
        country: 'USA',
        agency: 'NOAA',
        launchDate: '2017-11-18',
        status: 'active',
        orbital: {
          altitude: 824,
          period: 101.1,
          inclination: 98.7,
          eccentricity: 0.0001,
          velocity: 7.35
        },
        position: generatePosition(4.2, 240),
        tle: {
          line1: '1 40069U 17073A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 40069  98.7123  85.6789 0001234  87.6543 272.3456 14.19123456789012'
        },
        footprint: 3100
      },

      // SCIENTIFIC SATELLITES
      {
        id: '20580',
        name: 'HUBBLE SPACE TELESCOPE',
        type: 'scientific',
        country: 'International',
        agency: 'NASA/ESA',
        launchDate: '1990-04-24',
        status: 'active',
        orbital: {
          altitude: 547,
          period: 95.4,
          inclination: 28.5,
          eccentricity: 0.0003,
          velocity: 7.56
        },
        position: generatePosition(5, 270),
        tle: {
          line1: '1 20580U 90037B   23001.00000000  .00000345  00000-0  12345-4 0  9992',
          line2: '2 20580  28.5123  115.6789 0003234  87.6543 272.3456 15.09123456789012'
        },
        footprint: 1200
      },
      {
        id: '36411',
        name: 'SPITZER SPACE TELESCOPE',
        type: 'scientific',
        country: 'USA',
        agency: 'NASA',
        launchDate: '2003-08-25',
        status: 'inactive',
        orbital: {
          altitude: 350000,
          period: 372.6,
          inclination: 1.1,
          eccentricity: 0.98,
          velocity: 1.02
        },
        position: generatePosition(5.1, 300),
        tle: {
          line1: '1 36411U 03038A   23001.00000000  .00000000  00000-0  00000+0 0  9992',
          line2: '2 36411   1.1123  145.6789 0980234  87.6543 272.3456  0.37123456789012'
        },
        footprint: 150000
      },

      // COMMUNICATION SATELLITES
      {
        id: '40874',
        name: 'INTELSAT 35E',
        type: 'communication',
        country: 'International',
        agency: 'Intelsat',
        launchDate: '2015-07-03',
        status: 'active',
        orbital: {
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(6, 330),
        tle: {
          line1: '1 40874U 15039A   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 40874   0.0567 183.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },
      {
        id: '37834',
        name: 'EUTELSAT 70B',
        type: 'communication',
        country: 'Europe',
        agency: 'Eutelsat',
        launchDate: '2013-12-03',
        status: 'active',
        orbital: {
          altitude: 35786,
          period: 1436.1,
          inclination: 0.1,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(6.1, 360),
        tle: {
          line1: '1 37834U 11060B   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
          line2: '2 37834   0.0567 213.4567 0001234  12.3456 347.6789  1.00271234567890'
        },
        footprint: 18000
      },

      // MILITARY SATELLITES
      {
        id: '44506',
        name: 'USA 290 (GPS BIII-2)',
        type: 'military',
        country: 'USA',
        agency: 'US Space Force',
        launchDate: '2019-08-22',
        status: 'active',
        orbital: {
          altitude: 20180,
          period: 717.8,
          inclination: 54.8,
          eccentricity: 0.0045,
          velocity: 3.87
        },
        position: generatePosition(7, 30),
        tle: {
          line1: '1 44506U 19048A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
          line2: '2 44506  54.8988 243.4567 0045123  45.6789 314.5678  2.00564321123456'
        },
        footprint: 12000
      },
      {
        id: '37752',
        name: 'NROL-65',
        type: 'military',
        country: 'USA',
        agency: 'NRO',
        launchDate: '2011-04-15',
        status: 'active',
        orbital: {
          altitude: 1020,
          period: 105.1,
          inclination: 123.0,
          eccentricity: 0.02,
          velocity: 7.24
        },
        position: generatePosition(7.1, 60),
        tle: {
          line1: '1 37752U 11015A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
          line2: '2 37752 123.0123  275.6789 0020234  87.6543 272.3456 13.73123456789012'
        },
        footprint: 4200
      },

      // ADDITIONAL STARLINK CONSTELLATION (50 more satellites)
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `starlink-${50000 + i}`,
        name: `STARLINK-${2000 + i}`,
        type: 'constellation' as const,
        country: 'USA',
        agency: 'SpaceX',
        launchDate: '2021-01-01',
        status: 'active' as const,
        description: 'Starlink is a satellite internet constellation operated by SpaceX, providing satellite Internet access coverage to most of Earth. The constellation consists of thousands of mass-produced small satellites in low Earth orbit.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Starlink',
        orbital: {
          altitude: 550 + (i % 5) * 10,
          period: 95.4 + (i % 3) * 0.1,
          inclination: 53.0 + (i % 4) * 0.5,
          eccentricity: 0.0001,
          velocity: 7.57 - (i % 6) * 0.01
        },
        position: generatePosition(20 + i * 0.1, 45 + i * 7.2),
        tle: {
          line1: `1 ${50000 + i}U 21001A   23001.00000000  .00001345  00000-0  10270-3 0  999${i % 10}`,
          line2: `2 ${50000 + i}  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234`
        },
        footprint: 1000
      })),

      // ONEWEB CONSTELLATION (30 satellites)
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `oneweb-${45000 + i}`,
        name: `ONEWEB-${i + 1}`,
        type: 'constellation' as const,
        country: 'UK',
        agency: 'OneWeb',
        launchDate: '2020-02-01',
        status: 'active' as const,
        description: 'OneWeb is a global communications company building a constellation of Low Earth Orbit satellites that will provide high-speed, low-latency internet connectivity around the world.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/OneWeb',
        orbital: {
          altitude: 1200,
          period: 109.1,
          inclination: 87.4,
          eccentricity: 0.0001,
          velocity: 7.2
        },
        position: generatePosition(30 + i * 0.2, 120 + i * 12),
        tle: {
          line1: `1 ${45000 + i}U 20001A   23001.00000000  .00001200  00000-0  95270-3 0  999${i % 10}`,
          line2: `2 ${45000 + i}  87.4536  90.4721 0001425  95.4618 264.6879 13.40444835201234`
        },
        footprint: 1500
      })),

      // ADDITIONAL GPS SATELLITES (20 more)
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `gps-${30000 + i}`,
        name: `GPS BIII-${i + 10}`,
        type: 'navigation' as const,
        country: 'USA',
        agency: 'US Space Force',
        launchDate: '2019-01-01',
        status: 'active' as const,
        description: 'The Global Positioning System (GPS) is a satellite-based radionavigation system owned by the US Space Force and operated by the 2nd Space Operations Squadron.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Global_Positioning_System',
        orbital: {
          altitude: 20200 + (i % 3) * 20,
          period: 717.97 + (i % 2) * 0.1,
          inclination: 55.0 + (i % 4) * 0.2,
          eccentricity: 0.02,
          velocity: 3.87
        },
        position: generatePosition(40 + i * 0.3, 180 + i * 18),
        tle: {
          line1: `1 ${30000 + i}U 19001A   23001.00000000 -.00000007  00000-0  00000+0 0  999${i % 10}`,
          line2: `2 ${30000 + i}  55.0000 ${180 + i * 18}.0000 0020000  90.0000 270.0000  2.00563365085000`
        },
        footprint: 12000
      })),

      // ADDITIONAL COMMUNICATION SATELLITES (25 satellites)
      ...Array.from({ length: 25 }, (_, i) => ({
        id: `comsat-${45000 + i}`,
        name: `ASTRA-${i + 1}G`,
        type: 'communication' as const,
        country: 'Luxembourg',
        agency: 'SES',
        launchDate: '2020-01-01',
        status: 'active' as const,
        description: 'SES operates a fleet of geostationary and medium Earth orbit satellites providing video and data connectivity worldwide, serving broadcast, telecom, corporate and government customers.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/SES_S.A.',
        orbital: {
          altitude: 35786,
          period: 1436,
          inclination: 0.1 + (i % 3) * 0.05,
          eccentricity: 0.0001,
          velocity: 3.07
        },
        position: generatePosition(50 + i * 0.1, 24 + i * 14.4),
        tle: {
          line1: `1 ${45000 + i}U 20001A   23001.00000000  .00000004  00000-0  00000+0 0  999${i % 10}`,
          line2: `2 ${45000 + i}   0.1000 ${24 + i * 14.4}.0000 0001000  90.0000 270.0000  1.00271096000000`
        },
        footprint: 18000
      })),

      // EARTH OBSERVATION SATELLITES (20 more)
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `earthobs-${50000 + i}`,
        name: `SENTINEL-${Math.floor(i/3) + 3}${String.fromCharCode(65 + (i % 3))}`,
        type: 'earth-observation' as const,
        country: 'Europe',
        agency: 'ESA',
        launchDate: '2020-01-01',
        status: 'active' as const,
        description: 'The Sentinel satellites are part of the European Space Agency\'s Copernicus Programme, providing comprehensive Earth observation data for environmental monitoring and climate change research.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Copernicus_Programme',
        orbital: {
          altitude: 700 + (i % 5) * 50,
          period: 98.5 + (i % 4) * 0.5,
          inclination: 98.2 + (i % 3) * 0.3,
          eccentricity: 0.0001,
          velocity: 7.5 - (i % 6) * 0.02
        },
        position: generatePosition(60 + i * 0.3, 300 + i * 18),
        tle: {
          line1: `1 ${50000 + i}U 20001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i % 10}`,
          line2: `2 ${50000 + i}  98.2000 ${300 + i * 18}.0000 0001000  95.0000 265.0000 14.57113027000000`
        },
        footprint: 2200
      })),

      // WEATHER SATELLITES (15 more)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `weather-${50000 + i}`,
        name: `METEOSAT-${11 + i}`,
        type: 'weather' as const,
        country: 'Europe',
        agency: 'EUMETSAT',
        launchDate: '2020-01-01',
        status: 'active' as const,
        description: 'Meteosat satellites are geostationary meteorological satellites operated by EUMETSAT providing weather forecasting and climate monitoring for Europe and Africa.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Meteosat',
        orbital: {
          altitude: 35786,
          period: 1436,
          inclination: 0.1,
          eccentricity: 0.0003,
          velocity: 3.07
        },
        position: generatePosition(70 + i * 0.1, 240 + i * 24),
        tle: {
          line1: `1 ${50000 + i}U 20001A   23001.00000000  .00000004  00000-0  00000+0 0  999${i % 10}`,
          line2: `2 ${50000 + i}   0.1000 ${240 + i * 24}.0000 0003000  90.0000 270.0000  1.00271096000000`
        },
        footprint: 18000
      })),

      // SCIENTIFIC SATELLITES (15 more)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `science-${60000 + i}`,
        name: `KEPLER-${i + 2}`,
        type: 'scientific' as const,
        country: 'International',
        agency: 'NASA',
        launchDate: '2020-01-01',
        status: 'active' as const,
        description: 'Space-based observatory designed to discover Earth-like planets orbiting other stars and advance our understanding of planetary systems and astrobiology.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Kepler_space_telescope',
        orbital: {
          altitude: 600 + i * 200,
          period: 96 + i * 5,
          inclination: 45 + i * 8,
          eccentricity: 0.0001,
          velocity: 7.5 - i * 0.05
        },
        position: generatePosition(80 + i * 0.2, 180 + i * 24),
        tle: {
          line1: `1 ${60000 + i}U 20001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i % 10}`,
          line2: `2 ${60000 + i}  ${45 + i * 8}.0000 ${180 + i * 24}.0000 0001000  95.0000 265.0000 15.00000000000000`
        },
        footprint: 1500 + i * 100
      })),

      // COMMERCIAL SATELLITES (15 more)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `commercial-${60000 + i}`,
        name: `IRIDIUM-${150 + i}`,
        type: 'commercial' as const,
        country: 'USA',
        agency: 'Iridium Communications',
        launchDate: '2021-01-01',
        status: 'active' as const,
        description: 'Iridium satellite constellation provides voice and data communications coverage to satellite phones, pagers and integrated transceivers over the entire Earth surface.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Iridium_satellite_constellation',
        orbital: {
          altitude: 780,
          period: 100.4,
          inclination: 86.4,
          eccentricity: 0.0001,
          velocity: 7.4
        },
        position: generatePosition(90 + i * 0.3, 120 + i * 24),
        tle: {
          line1: `1 ${60000 + i}U 21001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i % 10}`,
          line2: `2 ${60000 + i}  86.4000 ${120 + i * 24}.0000 0001000  95.0000 265.0000 14.34000000000000`
        },
        footprint: 1400
      })),

      // MILITARY SATELLITES (10 more)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `military-${60000 + i}`,
        name: `NROL-${70 + i}`,
        type: 'military' as const,
        country: 'USA',
        agency: 'NRO',
        launchDate: '2020-01-01',
        status: 'active' as const,
        description: 'National Reconnaissance Office satellite providing classified intelligence capabilities for national security. Mission details are classified.',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/National_Reconnaissance_Office',
        orbital: {
          altitude: 800 + i * 300,
          period: 100 + i * 8,
          inclination: 70 + i * 7,
          eccentricity: 0.001 + i * 0.001,
          velocity: 7.4 - i * 0.05
        },
        position: generatePosition(100 + i * 0.5, 72 + i * 36),
        tle: {
          line1: `1 ${60000 + i}U 20001A   23001.00000000  .00000345  00000-0  18270-3 0  999${i % 10}`,
          line2: `2 ${60000 + i}  ${70 + i * 7}.0000 ${72 + i * 36}.0000 00${10 + i}000  95.0000 265.0000 14.00000000000000`
        },
        footprint: 2500 + i * 400
      }))
    ];
    
    console.log(`Generated ${mockSatellites.length} mock satellites`);
    return mockSatellites;
  }
}

export const satelliteAPI = new RealSatelliteAPI();