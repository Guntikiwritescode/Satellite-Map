import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';

// Mock data for development - in production, this would connect to real APIs
export const mockSatellites: Satellite[] = [
  {
    id: 'iss',
    name: 'International Space Station (ISS)',
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
    position: {
      latitude: 45.23,
      longitude: -75.69,
      altitude: 408,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 25544U 98067A   23001.00000000  .00001742  00000-0  37350-4 0  9990',
      line2: '2 25544  51.6393 339.2928 0001897  95.8340 264.3200 15.49299371367649'
    },
    footprint: 4500
  },
  {
    id: 'starlink-1',
    name: 'Starlink-2019',
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
    position: {
      latitude: 12.45,
      longitude: 155.32,
      altitude: 550,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 44713U 19074A   23001.00000000  .00001345  00000-0  10270-3 0  9991',
      line2: '2 44713  53.0536  90.4721 0001425  95.4618 264.6879 15.05444835201234'
    },
    footprint: 1000
  },
  {
    id: 'gps-biir-2',
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
    position: {
      latitude: -15.67,
      longitude: 45.21,
      altitude: 20200,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 24876U 97035A   23001.00000000 -.00000007  00000-0  00000+0 0  9995',
      line2: '2 24876  54.9988 123.4567 0048123  45.6789 314.5678  2.00564321123456'
    },
    footprint: 12000
  },
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
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
    position: {
      latitude: 67.45,
      longitude: -123.67,
      altitude: 705,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 25994U 99068A   23001.00000000  .00000234  00000-0  12345-4 0  9992',
      line2: '2 25994  98.2123  45.6789 0001234  87.6543 272.3456 14.57123456789012'
    },
    footprint: 2800
  },
  {
    id: 'goes-16',
    name: 'GOES-16 (GOES-R)',
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
    position: {
      latitude: 0.12,
      longitude: -75.2,
      altitude: 35786,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 41866U 16071A   23001.00000000 -.00000123  00000-0  00000+0 0  9993',
      line2: '2 41866   0.0567 123.4567 0001234  12.3456 347.6789  1.00271234567890'
    },
    footprint: 18000
  },
  {
    id: 'sentinel-2a',
    name: 'Sentinel-2A',
    type: 'earth-observation',
    country: 'Europe',
    agency: 'ESA',
    launchDate: '2015-06-23',
    status: 'active',
    orbital: {
      altitude: 786,
      period: 100.4,
      inclination: 98.57,
      eccentricity: 0.0001,
      velocity: 7.41
    },
    position: {
      latitude: -23.45,
      longitude: 67.89,
      altitude: 786,
      timestamp: Date.now()
    },
    tle: {
      line1: '1 40697U 15028A   23001.00000000  .00000456  00000-0  23456-4 0  9994',
      line2: '2 40697  98.5678  12.3456 0001234  45.6789 314.5678 14.30123456789012'
    },
    footprint: 3200
  }
];

export const mockLaunches: Launch[] = [
  {
    id: 'falcon9-starlink',
    name: 'Falcon 9 | Starlink 6-42',
    launchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'scheduled',
    rocket: 'Falcon 9 Block 5',
    agency: 'SpaceX',
    mission: 'Starlink satellite deployment',
    launchSite: 'Kennedy Space Center LC-39A',
    payloads: ['23 Starlink satellites'],
    countdown: 2 * 24 * 60 * 60 // 2 days in seconds
  },
  {
    id: 'atlas-v-sbirs',
    name: 'Atlas V | SBIRS GEO-6',
    launchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'scheduled',
    rocket: 'Atlas V 421',
    agency: 'ULA',
    mission: 'Missile warning satellite',
    launchSite: 'Cape Canaveral SLC-41',
    payloads: ['SBIRS GEO-6'],
    countdown: 7 * 24 * 60 * 60
  },
  {
    id: 'artemis-2',
    name: 'Artemis II',
    launchDate: new Date('2024-11-01'),
    status: 'scheduled',
    rocket: 'SLS Block 1',
    agency: 'NASA',
    mission: 'Crewed lunar flyby mission',
    launchSite: 'Kennedy Space Center LC-39B',
    payloads: ['Orion crew capsule', '4 astronauts'],
    countdown: new Date('2024-11-01').getTime() - Date.now()
  }
];

class SatelliteAPI {
  private updateInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: ((satellites: Satellite[]) => void) | null = null;

  // Simulate real-time position updates
  startRealTimeUpdates(callback: (satellites: Satellite[]) => void) {
    this.onDataUpdate = callback;
    
    // Initial load
    callback(mockSatellites);
    
    // Update positions every 5 seconds
    this.updateInterval = setInterval(() => {
      const updatedSatellites = mockSatellites.map(satellite => ({
        ...satellite,
        position: {
          ...satellite.position,
          // Simulate orbital movement
          longitude: (satellite.position.longitude + this.calculateLongitudeChange(satellite)) % 360,
          timestamp: Date.now()
        }
      }));
      
      callback(updatedSatellites);
    }, 5000);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.onDataUpdate = null;
  }

  private calculateLongitudeChange(satellite: Satellite): number {
    // Simple approximation: longitude change based on orbital period
    // Real implementation would use proper orbital mechanics
    const degreesPerMinute = 360 / satellite.orbital.period;
    const updateIntervalMinutes = 5 / 60; // 5 seconds in minutes
    return degreesPerMinute * updateIntervalMinutes;
  }

  async getSatellites(): Promise<Satellite[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSatellites;
  }

  async getLaunches(): Promise<Launch[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockLaunches;
  }

  async searchSatellites(query: string): Promise<Satellite[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockSatellites.filter(sat => 
      sat.name.toLowerCase().includes(query.toLowerCase()) ||
      sat.agency.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get available filter options
  getFilterOptions() {
    const types = [...new Set(mockSatellites.map(s => s.type))].sort() as SatelliteType[];
    const countries = [...new Set(mockSatellites.map(s => s.country))].sort();
    const agencies = [...new Set(mockSatellites.map(s => s.agency))].sort();
    const statuses = [...new Set(mockSatellites.map(s => s.status))].sort() as SatelliteStatus[];
    
    return { types, countries, agencies, statuses };
  }
}

export const satelliteAPI = new SatelliteAPI();