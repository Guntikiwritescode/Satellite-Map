// API Configuration
export const API_CONFIG = {
  RATE_LIMIT_DELAY: 2000,
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  BATCH_SIZE: 50,
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  MAX_DISPLAY_SATELLITES: 500,
  POSITION_UPDATE_INTERVAL: 15000,
  DATA_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
  LAZY_LOADING_DELAY: 100,
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_LIMIT: 1,
  TOAST_REMOVE_DELAY: 5000,
  LOADING_DEBOUNCE: 300,
  SEARCH_DEBOUNCE: 500,
} as const;

// Satellite Configuration
export const SATELLITE_CONFIG = {
  DEFAULT_ALTITUDE: 400,
  MIN_TLE_LENGTH: 10,
  EARTH_RADIUS: 6371,
  DEFAULT_VELOCITY: 7.8,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  ALLOWED_FILE_TYPES: ['svg', 'jpg', 'png', 'gif'] as const,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SENSITIVE_FIELDS: ['password', 'token', 'key', 'secret', 'auth'] as const,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  API_ERROR: 'Unable to fetch satellite data. Please try again later.',
  INVALID_DATA: 'Invalid data received. Please refresh the page.',
  PERMISSION_DENIED: 'Permission denied. Please check your credentials.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_ADVANCED_FILTERING: true,
  ENABLE_EXPORT_FUNCTIONALITY: true,
  ENABLE_ANALYTICS: false,
} as const;