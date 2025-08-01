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
    const currentTime = Date.now() / 1000; // Current time in seconds
    
    // Calculate orbital parameters
    const orbitPeriodSeconds = satellite.orbital.period * 60; // Convert minutes to seconds
    const orbitSpeed = (2 * Math.PI) / orbitPeriodSeconds; // radians per second
    
    // Add satellite-specific offset for distribution along orbit
    const satelliteOffset = (parseInt(satellite.id) % 1000) / 1000 * Math.PI * 2;
    const angle = (currentTime * orbitSpeed + satelliteOffset) % (Math.PI * 2);
    
    // Earth parameters
    const earthRadiusKm = 6371;
    const orbitalRadiusKm = earthRadiusKm + satellite.orbital.altitude;
    const inclination = (satellite.orbital.inclination * Math.PI) / 180;
    
    // Calculate position on orbital path
    let x = orbitalRadiusKm * Math.cos(angle);
    let y = 0;
    let z = orbitalRadiusKm * Math.sin(angle);
    
    // Apply inclination rotation
    const rotatedY = y * Math.cos(inclination) - z * Math.sin(inclination);
    const rotatedZ = y * Math.sin(inclination) + z * Math.cos(inclination);
    
    // Convert back to lat/lon for position tracking
    const distance = Math.sqrt(x * x + rotatedY * rotatedY + rotatedZ * rotatedZ);
    const latitude = Math.asin(rotatedY / distance) * 180 / Math.PI;
    const longitude = Math.atan2(rotatedZ, x) * 180 / Math.PI;
    
    return {
      latitude: latitude,
      longitude: longitude,
      altitude: satellite.orbital.altitude,
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

  // Fallback to mock data if real API fails
  async getSatellitesWithFallback(): Promise<Satellite[]> {
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
  }

  getMockSatellites(): Satellite[] {
    console.log('Generating mock satellite data...');
    
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
      // SPACE STATIONS
      {
        id: '25544',
        name: 'ISS (ZARYA)',
        type: 'space-station',
        country: 'International',
        agency: 'NASA/Roscosmos',
        launchDate: '1998-11-20',
        status: 'active',
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

      // STARLINK CONSTELLATION (Multiple satellites)
      {
        id: '44713',
        name: 'STARLINK-1007',
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
        position: generatePosition(1, 45),
        tle: {
          line1: '1 44713U 19074A   23001.00000000  .00001345  00000-0  10270-3 0  9991',
          line2: '2 44713  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234'
        },
        footprint: 1000
      },
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
      }
    ];
    
    console.log(`Generated ${mockSatellites.length} mock satellites`);
    return mockSatellites;
  }
}

export const satelliteAPI = new RealSatelliteAPI();