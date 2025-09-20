/**
 * Global Test Setup
 * Configuración global para todos los tests del proyecto
 */

import * as dotenv from 'dotenv';
import { join } from 'path';
import { webcrypto } from 'crypto';

// Cargar variables de entorno de test ANTES que cualquier otra cosa
// Silenciar dotenv completamente en tests
const originalLog = console.log;
console.log = () => {}; // Silenciar temporalmente

dotenv.config({ path: join(__dirname, '..', '.env.test') });

console.log = originalLog; // Restaurar console.log

// ⚠️ CONFIGURAR LOGGING SILENCIOSO PARA TESTS
// Configurar LOG_LEVEL a error para silenciar logs info/warn durante tests
process.env.LOG_LEVEL = 'error';
process.env.NODE_ENV = 'test';

// ⚠️ CRYPTO POLYFILL: Configurar crypto para TypeORM en tests
// TypeORM necesita crypto.randomUUID() en Node.js
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto;
}

// Configurar timeout global para tests
jest.setTimeout(60000);

// ⚠️ SILENCIAR OUTPUTS DURANTE TESTS
// Configurar silence completo durante tests para CI/CD limpio
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Silenciar TODOS los console outputs durante tests
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

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
