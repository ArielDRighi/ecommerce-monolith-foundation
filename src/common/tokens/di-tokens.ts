/**
 * Dependency Injection Tokens
 *
 * Symbol-based tokens for better type safety and reduced naming conflicts.
 * These tokens are used to inject interfaces and abstractions throughout the application.
 */

// Repository Tokens
export const DI_TOKENS = {
  // Product Module Tokens
  IProductRepository: Symbol('IProductRepository'),

  // Category Module Tokens
  ICategoryRepository: Symbol('ICategoryRepository'),

  // User Module Tokens (for future use)
  IUserRepository: Symbol('IUserRepository'),

  // Analytics Module Tokens (for future use)
  IAnalyticsRepository: Symbol('IAnalyticsRepository'),
} as const;

/**
 * Type helper to ensure token types are properly maintained
 */
export type DIToken = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
