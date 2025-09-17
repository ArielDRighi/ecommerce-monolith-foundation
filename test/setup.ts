/**
 * Global Test Setup
 * Configuración global para todos los tests del proyecto
 */

// Configurar timeout global para tests
jest.setTimeout(30000);

// Mock de console.log en tests para evitar ruido
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Configuración de base de datos para E2E tests
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USER = 'postgres';
process.env.DATABASE_PASSWORD = 'password';
process.env.DATABASE_NAME = 'ecommerce_catalog_test';

// Mock de UUID para tests determinísticos
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9012'),
}));

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
