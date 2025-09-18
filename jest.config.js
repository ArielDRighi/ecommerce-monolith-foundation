module.exports = {
  // Configuración ESPECÍFICA para tests unitarios (src/)
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Cobertura solo de archivos fuente
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // CRÍTICO: Solo buscar tests unitarios en src/
  testMatch: ['<rootDir>/**/*.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/', // ← EXCLUIR directorio test/ explícitamente
  ],

  // Configuración específica para src/
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',

  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],

  // Setup específico para unitarios
  setupFilesAfterEnv: ['<rootDir>/../test/config/setup.ts'],
  testTimeout: 30000,

  // Evitar interferencia con e2e
  maxWorkers: '50%',
};
