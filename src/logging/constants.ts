/**
 * Application constants for logging system
 */

// API Configuration
export const API_VERSION = '1.0.0';
export const SERVICE_NAME = 'ecommerce-monolith';

// Default values
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_LOG_DIR = './logs';
export const DEFAULT_LOG_MAX_FILES = '14d';
export const DEFAULT_LOG_MAX_SIZE = '20m';
export const DEFAULT_LOG_DATE_PATTERN = 'YYYY-MM-DD';
export const DEFAULT_ENVIRONMENT = 'development';

// Error sanitization
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'key',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
] as const;

export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
] as const;
