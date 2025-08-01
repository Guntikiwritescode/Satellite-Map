import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Launch API for upcoming launches
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// Priority bulk satellite data APIs - limited to 500 most popular satellites
const PRIORITY_SATELLITE_GROUPS = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', // Space stations (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json', // Bright satellites (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=json', // Weather satellites (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=goes&FORMAT=json', // GOES satellites (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=json&LIMIT=30', // Earth resources (limited)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json', // GPS operational (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=json', // Galileo (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=json', // BeiDou (all)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json&LIMIT=50', // Starlink (limited to 50)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json&LIMIT=25', // OneWeb (limited to 25)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=json&LIMIT=30', // Iridium NEXT (limited)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=json&LIMIT=20', // Intelsat (limited)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=json&LIMIT=15', // SES (limited)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=json&LIMIT=40', // Science satellites (limited)
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json&LIMIT=30' // Geostationary (limited)
];

const MAX_SATELLITES = 500; // Hard limit to prevent crashes

interface CelestrakSatellite {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  SEMIMAJOR_AXIS: number;
  PERIOD: number;
  APOAPSIS: number;
  PERIAPSIS: number;
  OBJECT_TYPE: string;
  RCS_SIZE: string;
  COUNTRY_CODE: string;
  LAUNCH_DATE: string;
  SITE: string;
  DECAY_DATE?: string;
  FILE: number;
  GP_ID: number;
  TLE_LINE0: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
}

class RealSatelliteAPI {
  private updateInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: ((satellites: Satellite[]) => void) | null = null;
  private cachedSatellites: Satellite[] = [];

  // Convert satellite type based on name and object type
  private determineSatelliteType(name: string, objectType: string, countryCode: string): SatelliteType {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('ISS') || nameUpper.includes('ZARYA') || nameUpper.includes('TIANHE') || 
        nameUpper.includes('TIANGONG') || nameUpper.includes('MIR')) {
      return 'space-station';
    }
    
    if (nameUpper.includes('STARLINK') || nameUpper.includes('ONEWEB') || nameUpper.includes('IRIDIUM')) {
      return 'constellation';
    }
    
    if (nameUpper.includes('GPS') || nameUpper.includes('GALILEO') || nameUpper.includes('GLONASS') || 
        nameUpper.includes('BEIDOU') || nameUpper.includes('COMPASS') || nameUpper.includes('NAVSTAR')) {
      return 'navigation';
    }
    
    if (nameUpper.includes('GOES') || nameUpper.includes('METEOSAT') || nameUpper.includes('HIMAWARI') || 
        nameUpper.includes('WEATHER') || nameUpper.includes('NOAA') || nameUpper.includes('DMSP')) {
      return 'weather';
    }
    
    if (nameUpper.includes('INTELSAT') || nameUpper.includes('SES') || nameUpper.includes('EUTELSAT') || 
        nameUpper.includes('ASTRA') || nameUpper.includes('DIRECTV') || nameUpper.includes('ECHOSTAR') ||
        nameUpper.includes('VIASAT') || nameUpper.includes('THAICOM') || nameUpper.includes('AMAZONAS')) {
      return 'communication';
    }
    
    if (nameUpper.includes('LANDSAT') || nameUpper.includes('SENTINEL') || nameUpper.includes('TERRA') || 
        nameUpper.includes('AQUA') || nameUpper.includes('MODIS') || nameUpper.includes('SPOT') ||
        nameUpper.includes('WORLDVIEW') || nameUpper.includes('QUICKBIRD') || nameUpper.includes('PLANET')) {
      return 'earth-observation';
    }
    
    if (nameUpper.includes('HUBBLE') || nameUpper.includes('SPITZER') || nameUpper.includes('KEPLER') || 
        nameUpper.includes('TESS') || nameUpper.includes('JWST') || nameUpper.includes('GAIA') ||
        nameUpper.includes('CLUSTER') || nameUpper.includes('MMS') || nameUpper.includes('VOYAGER')) {
      return 'scientific';
    }
    
    if (nameUpper.includes('USA') || nameUpper.includes('NROL') || nameUpper.includes('MILSTAR') || 
        nameUpper.includes('AEHF') || nameUpper.includes('WGS') || nameUpper.includes('SBIRS') ||
        nameUpper.includes('DSP') || nameUpper.includes('MUOS') || objectType === 'UNKNOWN') {
      return 'military';
    }
    
    // Default fallback
    return 'scientific';
  }

  // Determine country based on country code and satellite name
  private determineCountry(countryCode: string, name: string): string {
    const countryMap: Record<string, string> = {
      'US': 'USA',
      'RU': 'Russia', 
      'CN': 'China',
      'EU': 'Europe',
      'FR': 'France',
      'DE': 'Germany',
      'GB': 'United Kingdom',
      'JP': 'Japan',
      'IN': 'India',
      'CA': 'Canada',
      'AU': 'Australia',
      'BR': 'Brazil',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'KR': 'South Korea',
      'IL': 'Israel',
      'SA': 'Saudi Arabia',
      'AE': 'UAE',
      'TH': 'Thailand',
      'ID': 'Indonesia',
      'MY': 'Malaysia',
      'SG': 'Singapore',
      'PH': 'Philippines',
      'VN': 'Vietnam',
      'AR': 'Argentina',
      'MX': 'Mexico',
      'CL': 'Chile',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'MA': 'Morocco',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'ET': 'Ethiopia',
      'UG': 'Uganda',
      'TZ': 'Tanzania',
      'GH': 'Ghana',
      'SN': 'Senegal',
      'CI': 'Ivory Coast',
      'CM': 'Cameroon',
      'BW': 'Botswana',
      'ZW': 'Zimbabwe',
      'ZM': 'Zambia',
      'MW': 'Malawi',
      'MZ': 'Mozambique',
      'AO': 'Angola',
      'NA': 'Namibia',
      'LS': 'Lesotho',
      'SZ': 'Eswatini'
    };
    
    if (name.toUpperCase().includes('ISS') || name.toUpperCase().includes('INTERNATIONAL')) {
      return 'International';
    }
    
    return countryMap[countryCode] || countryCode || 'Unknown';
  }

  // Determine agency based on satellite name and country
  private determineAgency(name: string, country: string): string {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('STARLINK')) return 'SpaceX';
    if (nameUpper.includes('ONEWEB')) return 'OneWeb';
    if (nameUpper.includes('IRIDIUM')) return 'Iridium';
    if (nameUpper.includes('INTELSAT')) return 'Intelsat';
    if (nameUpper.includes('SES')) return 'SES';
    if (nameUpper.includes('EUTELSAT')) return 'Eutelsat';
    if (nameUpper.includes('GOES') || nameUpper.includes('NOAA')) return 'NOAA';
    if (nameUpper.includes('GPS')) return 'US Space Force';
    if (nameUpper.includes('GALILEO')) return 'ESA';
    if (nameUpper.includes('GLONASS')) return 'Roscosmos';
    if (nameUpper.includes('BEIDOU')) return 'CNSA';
    if (nameUpper.includes('SENTINEL') || nameUpper.includes('ESA')) return 'ESA';
    if (nameUpper.includes('LANDSAT') || nameUpper.includes('TERRA') || nameUpper.includes('AQUA')) return 'NASA';
    if (nameUpper.includes('METEOSAT')) return 'EUMETSAT';
    if (nameUpper.includes('HIMAWARI')) return 'JMA';
    if (nameUpper.includes('DIRECTV')) return 'DIRECTV';
    if (nameUpper.includes('ECHOSTAR')) return 'EchoStar';
    if (nameUpper.includes('VIASAT')) return 'Viasat';
    if (nameUpper.includes('USA') || nameUpper.includes('NROL')) return 'NRO';
    if (nameUpper.includes('AEHF') || nameUpper.includes('WGS') || nameUpper.includes('MILSTAR')) return 'USSF';
    if (nameUpper.includes('ISS')) return 'NASA/Roscosmos';
    if (nameUpper.includes('TIANHE') || nameUpper.includes('TIANGONG')) return 'CNSA';
    
    // Default based on country
    switch (country) {
      case 'USA': return 'NASA';
      case 'Russia': return 'Roscosmos';
      case 'China': return 'CNSA';
      case 'Europe': return 'ESA';
      case 'Japan': return 'JAXA';
      case 'India': return 'ISRO';
      case 'International': return 'International';
      default: return country;
    }
  }

  // Fetch satellites from a single bulk endpoint
  private async fetchBulkSatellites(url: string): Promise<Satellite[]> {
    try {
      console.log(`Fetching satellites from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: CelestrakSatellite[] = await response.json();
      console.log(`Received ${data.length} satellites from ${url}`);
      
      const satellites: Satellite[] = data.map(sat => {
        const country = this.determineCountry(sat.COUNTRY_CODE, sat.OBJECT_NAME);
        const type = this.determineSatelliteType(sat.OBJECT_NAME, sat.OBJECT_TYPE, sat.COUNTRY_CODE);
        const agency = this.determineAgency(sat.OBJECT_NAME, country);
        
        // Validate and ensure TLE lines exist
        const tle1 = sat.TLE_LINE1 || '';
        const tle2 = sat.TLE_LINE2 || '';
        
        // Manually assign realistic altitudes based on satellite type and name
        let realAltitude = this.getRealisticAltitude(sat.OBJECT_NAME, type);
        
        // Try TLE calculation first, but fall back to manual assignment
        let position;
        if (tle1 && tle2 && tle1.length >= 69 && tle2.length >= 69) {
          try {
            position = this.calculateSatellitePositionFromTLE(tle1, tle2);
            // Only use TLE altitude if it's reasonable (not 0 or negative)
            if (position.altitude > 100) {
              realAltitude = position.altitude;
            }
          } catch (error) {
            console.warn(`TLE calculation failed for ${sat.OBJECT_NAME}, using manual altitude`);
          }
        }
        
        // Fallback position if TLE failed
        if (!position) {
          position = {
            latitude: Math.random() * 180 - 90, // Random but realistic distribution
            longitude: Math.random() * 360 - 180,
            altitude: realAltitude,
            timestamp: Date.now()
          };
        }
        
        return {
          id: sat.NORAD_CAT_ID.toString(),
          name: sat.OBJECT_NAME,
          type,
          country,
          agency,
          launchDate: sat.LAUNCH_DATE || '1957-01-01',
          status: sat.DECAY_DATE ? 'inactive' : 'active' as SatelliteStatus,
          orbital: {
            altitude: realAltitude, // Use manually assigned realistic altitude
            period: this.calculateOrbitalPeriod(realAltitude), // Calculate period based on altitude
            inclination: sat.INCLINATION || this.getTypicalInclination(type),
            eccentricity: sat.ECCENTRICITY || 0,
            velocity: Math.sqrt(398600.4418 / (6371 + realAltitude)) // Calculate velocity based on altitude
          },
          position: {
            ...position,
            altitude: realAltitude // Ensure position also has correct altitude
          },
          tle: {
            line1: tle1,
            line2: tle2
          },
          footprint: this.calculateFootprint(realAltitude)
        };
      });
      
      return satellites;
    } catch (error) {
      console.error(`Error fetching bulk satellites from ${url}:`, error);
      return [];
    }
  }

  // Calculate satellite position from TLE lines
  private calculateSatellitePositionFromTLE(line1: string, line2: string): Satellite['position'] {
    try {
      const satrec = satellite.twoline2satrec(line1, line2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);
      
      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        // Use the actual calculated altitude from TLE data
        const actualAltitude = positionGd.height;
        
        return {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: actualAltitude, // Real altitude from TLE calculation
          timestamp: now.getTime()
        };
      }
    } catch (error) {
      console.error('Error calculating satellite position from TLE:', error);
    }
    
    // Fallback with different default altitudes based on satellite type
    return {
      latitude: 0,
      longitude: 0,
      altitude: 400, // Still need a fallback
      timestamp: Date.now()
    };
  }

  // Manually assign realistic altitudes based on satellite type and name
  private getRealisticAltitude(name: string, type: SatelliteType): number {
    const nameUpper = name.toUpperCase();
    
    // Space stations - Low Earth Orbit
    if (nameUpper.includes('ISS')) return 408; // International Space Station
    if (nameUpper.includes('TIANHE') || nameUpper.includes('TIANGONG')) return 370; // Chinese Space Station
    if (type === 'space-station') return 400; // Default for space stations
    
    // Navigation satellites - Medium Earth Orbit  
    if (nameUpper.includes('GPS') || nameUpper.includes('NAVSTAR')) return 20180; // GPS constellation
    if (nameUpper.includes('GALILEO')) return 23222; // Galileo constellation
    if (nameUpper.includes('GLONASS')) return 19130; // GLONASS constellation
    if (nameUpper.includes('BEIDOU')) return 21150; // BeiDou constellation
    if (type === 'navigation') return 20200; // Default MEO for navigation
    
    // Geostationary satellites - High Earth Orbit
    if (nameUpper.includes('GOES')) return 35786; // GOES weather satellites
    if (nameUpper.includes('METEOSAT')) return 35786; // Meteosat weather satellites
    if (nameUpper.includes('INTELSAT')) return 35786; // Intelsat communication
    if (nameUpper.includes('SES')) return 35786; // SES communication
    if (nameUpper.includes('EUTELSAT')) return 35786; // Eutelsat communication
    if (nameUpper.includes('DIRECTV')) return 35786; // DirectTV
    if (nameUpper.includes('ECHOSTAR')) return 35786; // EchoStar
    if (nameUpper.includes('VIASAT')) return 35786; // ViaSat
    if (nameUpper.includes('GEO') && type === 'communication') return 35786;
    
    // Constellation satellites - Low Earth Orbit
    if (nameUpper.includes('STARLINK')) return 550; // Starlink constellation
    if (nameUpper.includes('ONEWEB')) return 1200; // OneWeb constellation
    if (nameUpper.includes('IRIDIUM')) return 780; // Iridium constellation
    if (type === 'constellation') return 550; // Default for constellations
    
    // Earth observation - Various orbits
    if (nameUpper.includes('LANDSAT')) return 705; // Landsat series
    if (nameUpper.includes('SENTINEL-1') || nameUpper.includes('SENTINEL-2')) return 693; // Sentinel 1 & 2
    if (nameUpper.includes('SENTINEL-3')) return 814; // Sentinel 3
    if (nameUpper.includes('TERRA')) return 705; // Terra satellite
    if (nameUpper.includes('AQUA')) return 705; // Aqua satellite
    if (nameUpper.includes('WORLDVIEW')) return 617; // WorldView satellites
    if (type === 'earth-observation') return 700; // Default for Earth observation
    
    // Scientific satellites - Various orbits
    if (nameUpper.includes('HUBBLE')) return 547; // Hubble Space Telescope
    if (nameUpper.includes('JWST')) return 1500000; // James Webb (L2 point, very far)
    if (nameUpper.includes('SPITZER')) return 568; // Spitzer (historical)
    if (nameUpper.includes('KEPLER')) return 568; // Kepler
    if (nameUpper.includes('TESS')) return 375000; // TESS (highly elliptical)
    if (nameUpper.includes('GAIA')) return 1500000; // Gaia (L2 point)
    if (type === 'scientific') return 600; // Default for scientific
    
    // Weather satellites
    if (nameUpper.includes('NOAA')) {
      if (nameUpper.includes('POES')) return 870; // Polar orbiting
      return 35786; // GOES series
    }
    if (nameUpper.includes('DMSP')) return 833; // Defense weather satellites
    if (nameUpper.includes('HIMAWARI')) return 35786; // Japanese weather
    if (type === 'weather') return 870; // Default for weather
    
    // Communication satellites (default geostationary)
    if (type === 'communication') return 35786;
    
    // Military satellites - Various orbits
    if (nameUpper.includes('USA') || nameUpper.includes('NROL')) return 1000; // Classified, estimate
    if (nameUpper.includes('AEHF')) return 35786; // Advanced EHF
    if (nameUpper.includes('WGS')) return 35786; // Wideband Global SATCOM
    if (nameUpper.includes('MILSTAR')) return 35786; // Milstar
    if (nameUpper.includes('SBIRS')) return 35786; // Space-Based Infrared System
    if (type === 'military') return 1000; // Default for military
    
    // Default fallback - Low Earth Orbit
    return 550;
  }

  // Calculate orbital period based on altitude
  private calculateOrbitalPeriod(altitude: number): number {
    const earthRadius = 6371; // km
    const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
    const orbitalRadius = earthRadius + altitude;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / mu);
    return period / 60; // Convert to minutes
  }

  // Get typical inclination for satellite type
  private getTypicalInclination(type: SatelliteType): number {
    switch (type) {
      case 'space-station': return 51.6; // ISS inclination
      case 'navigation': return 55; // Typical for GPS
      case 'weather': return 0; // Geostationary weather satellites
      case 'communication': return 0; // Most are geostationary
      case 'earth-observation': return 98; // Sun-synchronous
      case 'scientific': return 28.5; // Varies widely, use common value
      case 'constellation': return 53; // Starlink-like
      case 'military': return 63.4; // Molniya-type orbit
      default: return 51.6; // ISS-like default
    }
  }

  calculateFootprint(altitude: number): number {
    // Calculate the radio horizon for satellite visibility
    const earthRadius = 6371; // km
    const heightAboveEarth = altitude;
    return Math.sqrt(heightAboveEarth * (heightAboveEarth + 2 * earthRadius));
  }

  // Load satellites from all priority groups
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    console.log('🚀 Loading satellites from bulk APIs...');
    const allSatellites: Satellite[] = [];
    const uniqueSatellites = new Map<string, Satellite>();
    
    // Fetch from each priority group
    for (const [index, apiUrl] of PRIORITY_SATELLITE_GROUPS.entries()) {
      try {
        console.log(`📡 Fetching group ${index + 1}/${PRIORITY_SATELLITE_GROUPS.length}...`);
        const satellites = await this.fetchBulkSatellites(apiUrl);
        
        // Add unique satellites (avoid duplicates)
        satellites.forEach(sat => {
          if (!uniqueSatellites.has(sat.id)) {
            uniqueSatellites.set(sat.id, sat);
          }
        });
        
        console.log(`✅ Group ${index + 1}: ${satellites.length} satellites (${uniqueSatellites.size} unique total)`);
      } catch (error) {
        console.error(`❌ Failed to fetch group ${index + 1}:`, error);
      }
    }
    
    // Convert map to array and apply 500 satellite limit
    let finalSatellites = Array.from(uniqueSatellites.values());
    
    // Enforce hard limit of 500 satellites to prevent crashes
    if (finalSatellites.length > MAX_SATELLITES) {
      console.log(`⚠️ Limiting satellites from ${finalSatellites.length} to ${MAX_SATELLITES} to prevent crashes`);
      
      // Prioritize satellites by type importance
      const priorityOrder: SatelliteType[] = [
        'space-station', 'weather', 'navigation', 'scientific', 
        'communication', 'earth-observation', 'constellation', 'military'
      ];
      
      const prioritizedSatellites: Satellite[] = [];
      
      // Add satellites by priority, keeping a balanced mix
      for (const type of priorityOrder) {
        const satellitesOfType = finalSatellites.filter(sat => sat.type === type);
        const maxPerType = Math.min(satellitesOfType.length, Math.floor(MAX_SATELLITES / priorityOrder.length));
        prioritizedSatellites.push(...satellitesOfType.slice(0, maxPerType));
        
        if (prioritizedSatellites.length >= MAX_SATELLITES) break;
      }
      
      // Fill remaining slots with any leftover satellites
      const remaining = MAX_SATELLITES - prioritizedSatellites.length;
      if (remaining > 0) {
        const usedIds = new Set(prioritizedSatellites.map(sat => sat.id));
        const leftoverSatellites = finalSatellites.filter(sat => !usedIds.has(sat.id));
        prioritizedSatellites.push(...leftoverSatellites.slice(0, remaining));
      }
      
      finalSatellites = prioritizedSatellites.slice(0, MAX_SATELLITES);
    }
    
    console.log(`🎯 FINAL RESULT: ${finalSatellites.length} satellites loaded successfully!`);
    console.log(`📊 Breakdown by type:`, this.getTypeBreakdown(finalSatellites));
    
    this.cachedSatellites = finalSatellites;
    return finalSatellites;
  }

  // Helper method to show satellite type breakdown
  private getTypeBreakdown(satellites: Satellite[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    satellites.forEach(sat => {
      breakdown[sat.type] = (breakdown[sat.type] || 0) + 1;
    });
    return breakdown;
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
    
    // Initial load
    this.getSatellitesWithFallback().then(callback);
    
    // Update satellite positions every 3 seconds
    this.updateInterval = setInterval(async () => {
      try {
        if (this.cachedSatellites.length > 0) {
          // Reduced logging frequency for better performance
          if (Math.random() < 0.1) { // Only log 10% of the time
            console.log('Updating satellite positions every 3 seconds for', this.cachedSatellites.length, 'satellites');
          }
          
          const updatedSatellites = this.cachedSatellites.map(satellite => {
            return {
              ...satellite,
              position: this.calculateSatellitePositionFromTLE(satellite.tle.line1, satellite.tle.line2)
            };
          });
          
          this.cachedSatellites = updatedSatellites;
          callback(updatedSatellites);
        }
      } catch (error) {
        console.error('Error updating satellite positions:', error);
      }
    }, 3000);
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
      types: ['communication', 'weather', 'navigation', 'scientific', 'military', 'earth-observation', 'space-station', 'constellation'] as SatelliteType[],
      countries: ['USA', 'International', 'Europe', 'Russia', 'China'],
      agencies: ['NASA', 'SpaceX', 'ESA', 'NOAA', 'Intelsat', 'Roscosmos', 'CNSA'],
      statuses: ['active'] as SatelliteStatus[]
    };
  }
}

export const satelliteAPI = new RealSatelliteAPI();