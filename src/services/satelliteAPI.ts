import { Satellite, Launch, SatelliteType, SatelliteStatus } from '../types/satellite.types';
import * as satellite from 'satellite.js';

// Launch API for upcoming launches
const LAUNCH_API = 'https://ll.thespacedevs.com/2.2.0/launch';

// N2YO.com API for real-time satellite tracking
const N2YO_API_KEY = 'YC2LYP-RKU24Y-S8P44S-539N'; // Free API key for testing
const N2YO_BASE_URL = 'https://api.n2yo.com/rest/v1/satellite';

// Get most popular satellites from different categories
const POPULAR_SATELLITE_NORAD_IDS = [
  // Space Stations
  25544, // ISS
  48274, // Chinese Space Station (Tianhe)
  
  // Navigation satellites (GPS)
  32711, 35752, 36585, 37753, 38833, 39166, 39533, 40105, 40294, 40534,
  
  // Communication satellites  
  23439, 26038, 26900, 27380, 27453, 28628, 29236, 31307, 32951, 33376,
  
  // Weather satellites
  29155, 33591, 35491, 40069, 41932, 43013, 43226, 43493,
  
  // Earth observation
  25994, 27424, 28376, 32060, 39084, 40053, 40697, 42063,
  
  // Scientific satellites
  20580, // Hubble
  25867, // Chandra
  25989, // XMM-Newton
  28485, // Swift
  33053, // Fermi
  36411, // Kepler
  
  // Popular Starlink satellites (sample)
  44713, 44714, 44715, 44716, 44717, 44718, 44719, 44720, 44721, 44722,
  44723, 44724, 44725, 44726, 44727, 44728, 44729, 44730, 44731, 44732,
  
  // Popular OneWeb satellites (sample)
  44058, 44059, 44060, 44061, 44062, 45132, 45133, 45134, 45136, 45137,
  
  // Popular Iridium NEXT satellites
  41917, 41918, 41919, 41920, 41921, 41922, 41923, 41924, 41925, 41926,
  42803, 42804, 42805, 42806, 42807, 42808, 42809, 42810, 42811, 42812
];

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

  // Fetch satellite data from N2YO API using NORAD IDs
  private async fetchSatelliteFromN2YO(noradId: number): Promise<Satellite | null> {
    try {
      const url = `${N2YO_BASE_URL}/positions/${noradId}/41.702/-76.014/0/1/?apiKey=${N2YO_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.positions || data.positions.length === 0) {
        return null;
      }
      
      const satInfo = data.info;
      const position = data.positions[0];
      
      // Determine satellite properties
      const type = this.determineSatelliteType(satInfo.satname, '', '');
      const country = this.determineCountryFromName(satInfo.satname);
      const agency = this.determineAgency(satInfo.satname, country);
      const realAltitude = this.getRealisticAltitude(satInfo.satname, type);
      
      return {
        id: noradId.toString(),
        name: satInfo.satname,
        type,
        country,
        agency,
        launchDate: '2000-01-01', // N2YO doesn't provide launch date
        status: 'active' as SatelliteStatus,
        orbital: {
          altitude: realAltitude,
          period: this.calculateOrbitalPeriod(realAltitude),
          inclination: this.getTypicalInclination(type),
          eccentricity: 0,
          velocity: Math.sqrt(398600.4418 / (6371 + realAltitude))
        },
        position: {
          latitude: position.satlatitude,
          longitude: position.satlongitude,
          altitude: position.sataltitude,
          timestamp: position.timestamp * 1000
        },
        tle: {
          line1: '',
          line2: ''
        },
        footprint: this.calculateFootprint(position.sataltitude)
      };
    } catch (error) {
      console.error(`Error fetching satellite ${noradId} from N2YO:`, error);
      return null;
    }
  }

  // Determine country from satellite name when country code is not available
  private determineCountryFromName(name: string): string {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('ISS') || nameUpper.includes('INTERNATIONAL')) return 'International';
    if (nameUpper.includes('STARLINK') || nameUpper.includes('GPS') || nameUpper.includes('GOES')) return 'USA';
    if (nameUpper.includes('GALILEO') || nameUpper.includes('SENTINEL') || nameUpper.includes('METEOSAT')) return 'Europe';
    if (nameUpper.includes('GLONASS') || nameUpper.includes('COSMOS')) return 'Russia';
    if (nameUpper.includes('BEIDOU') || nameUpper.includes('TIANHE') || nameUpper.includes('TIANGONG')) return 'China';
    if (nameUpper.includes('HIMAWARI')) return 'Japan';
    if (nameUpper.includes('IRIDIUM') || nameUpper.includes('ONEWEB')) return 'International';
    
    return 'Unknown';
  }

  // Load satellites using N2YO API with popular NORAD IDs
  async getSatellitesWithFallback(): Promise<Satellite[]> {
    console.log('🚀 Loading satellites from N2YO API...');
    const satellites: Satellite[] = [];
    
    // Limit to first 100 satellites to avoid API rate limits
    const limitedIds = POPULAR_SATELLITE_NORAD_IDS.slice(0, 100);
    
    console.log(`📡 Fetching ${limitedIds.length} popular satellites...`);
    
    // Fetch satellites in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < limitedIds.length; i += batchSize) {
      const batch = limitedIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(noradId => this.fetchSatelliteFromN2YO(noradId));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(satellite => {
        if (satellite) {
          satellites.push(satellite);
        }
      });
      
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batchResults.filter(s => s !== null).length} satellites loaded`);
      
      // Add delay between batches to respect API rate limits
      if (i + batchSize < limitedIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎯 FINAL RESULT: ${satellites.length} satellites loaded successfully!`);
    console.log(`📊 Breakdown by type:`, this.getTypeBreakdown(satellites));
    
    this.cachedSatellites = satellites;
    return satellites;
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