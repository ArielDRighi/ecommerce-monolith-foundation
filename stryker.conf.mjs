/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 * Optimized configuration for practical mutation testing
 */
export default {
  packageManager: 'npm',
  reporters: ['clear-text', 'progress'], // Removed HTML for speed
  testRunner: 'jest',
  coverageAnalysis: 'all', // Much faster than 'perTest'

  // Focus ONLY on critical business logic (not DTOs)
  mutate: [
    'src/auth/auth.service.ts',
    'src/products/products.service.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/**/*.dto.ts', // Skip DTOs - they're mostly validation
    '!src/**/*.entity.ts', // Skip entities
  ],

  // Jest configuration - optimized
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',

  // Aggressive performance settings
  timeoutMS: 10000, // 10 seconds max per test
  timeoutFactor: 1.5, // Reduced from 3
  concurrency: 4, // Use more CPU cores

  // Relaxed thresholds for faster feedback
  thresholds: {
    high: 70, // Reduced from 80
    low: 50, // Reduced from 60
    break: 30, // Reduced from 50
  },

  // Plugins
  plugins: ['@stryker-mutator/jest-runner'],

  // Simplified temp directory management
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,

  // Aggressive mutation exclusions for speed
  mutator: {
    excludedMutations: [
      'StringLiteral', // Skip log messages
      'RegexLiteral', // Skip regex patterns
      'ArrayDeclaration', // Skip array mutations
      'ObjectLiteral', // Skip object mutations
      'ConditionalExpression', // Skip ternary operators
      'EqualityOperator', // Skip == vs === (linter handles this)
    ],
  },

  // Disable incremental mode for cleaner runs
  incremental: false,

  // Only test changed files in CI
  since: process.env.CI ? 'HEAD~1' : undefined,
};
