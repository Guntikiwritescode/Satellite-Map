// Security utilities

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim()
    .slice(0, 1000); // Limit input length
};

/**
 * Validate satellite ID format
 */
export const validateSatelliteId = (id: string): boolean => {
  if (typeof id !== 'string') return false;
  return /^[0-9]+$/.test(id) && id.length <= 10;
};

/**
 * Validate coordinate values
 */
export const validateCoordinates = (lat: number, lon: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

/**
 * Validate altitude value
 */
export const validateAltitude = (altitude: number): boolean => {
  return (
    typeof altitude === 'number' &&
    !isNaN(altitude) &&
    altitude >= -1000 && // Below sea level
    altitude <= 100000 // Maximum reasonable satellite altitude
  );
};

/**
 * Rate limiting utility for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }
}

/**
 * Validate URL for external links
 */
export const validateUrl = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Content Security Policy helpers
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
  'font-src': ["'self'", 'fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:'],
  'connect-src': ["'self'", '*.supabase.co'],
  'worker-src': ["'self'", 'blob:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
} as const;

/**
 * Generate nonce for inline scripts/styles
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate and sanitize TLE data
 */
export const validateTLE = (line1: string, line2: string): boolean => {
  if (typeof line1 !== 'string' || typeof line2 !== 'string') return false;
  
  // Basic TLE format validation
  const line1Pattern = /^1 \d{5}[A-Z] \d{5}[A-Z]{3} \d{5}\.\d{8} [+-]\.\d{8} [+-]\d{5}[+-]\d [+-]\d{5}[+-]\d \d \d{4}$/;
  const line2Pattern = /^2 \d{5} \d{8}\.\d{4} \d{8}\.\d{4} \d{7} \d{8}\.\d{4} \d{8}\.\d{4} \d{2}\.\d{8}\d{5}$/;
  
  return line1.length === 69 && line2.length === 69 && 
         line1Pattern.test(line1) && line2Pattern.test(line2);
};

/**
 * Safe JSON parsing with validation
 */
export const safeJsonParse = <T>(jsonString: string, validator?: (obj: any) => obj is T): T | null => {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (validator && !validator(parsed)) {
      console.warn('JSON validation failed');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return null;
  }
};