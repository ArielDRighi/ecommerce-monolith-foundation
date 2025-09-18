/**
 * Global Test Setup
 * Configuración global para todos los tests del proyecto
 */

import * as dotenv from 'dotenv';
import { join } from 'path';
import { webcrypto } from 'crypto';

// Cargar variables de entorno de test
dotenv.config({ path: join(__dirname, '..', '.env.test') });

// ⚠️ CRYPTO POLYFILL: Configurar crypto para TypeORM en tests
// TypeORM necesita crypto.randomUUID() en Node.js
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto;
}

// Configurar timeout global para tests
jest.setTimeout(60000);

// Silenciar logs en tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Configuración de base de datos para E2E tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = '127.0.0.1';
process.env.DATABASE_PORT = '5433';
process.env.DATABASE_USER = 'postgres';
process.env.DATABASE_PASSWORD = 'password';
process.env.DATABASE_NAME = 'ecommerce_catalog_test';

// JWT Configuration para tests
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-2024';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-2024';
process.env.JWT_ACCESS_EXPIRATION = '5m';
process.env.JWT_REFRESH_EXPIRATION = '1h';

// Bcrypt más rápido para tests
process.env.BCRYPT_SALT_ROUNDS = '4';

// Configuración global de matchers personalizados
expect.extend({
  toHaveValidationError(received: Error, expectedError: string) {
    const pass = received.message.includes(expectedError);
    if (pass) {
      return {
        message: () =>
          `Expected not to have validation error: ${expectedError}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected to have validation error: ${expectedError}`,
        pass: false,
      };
    }
  },
});
