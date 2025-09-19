import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard error response for validation errors
 */
export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Array of validation error messages',
    example: [
      'Email must be a valid email address',
      'Password must be at least 8 characters long',
    ],
    type: [String],
  })
  message: string[];

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/auth/register',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard error response for unauthorized access
 */
export class UnauthorizedErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Unauthorized access - invalid or missing JWT token',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Unauthorized',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/products',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard error response for forbidden access
 */
export class ForbiddenErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 403,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Forbidden',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/products',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard error response for resource not found
 */
export class NotFoundErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Product not found',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/products/123e4567-e89b-12d3-a456-426614174000',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard error response for conflict errors
 */
export class ConflictErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'User with this email already exists',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Conflict',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/auth/register',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard error response for internal server errors
 */
export class InternalServerErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Internal server error',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/products',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Standard success response for operations without data
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the operation completed',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Paginated response wrapper for list endpoints
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevious: boolean;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}

/**
 * Rate limiting error response
 */
export class RateLimitErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 429,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Too many requests, please try again later',
  })
  message: string;

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Too Many Requests',
  })
  error: string;

  @ApiProperty({
    description: 'Time when the rate limit resets (Unix timestamp)',
    example: 1726665000,
  })
  retryAfter: number;

  @ApiProperty({
    description: 'Number of remaining requests in the current window',
    example: 0,
  })
  remaining: number;

  @ApiProperty({
    description: 'Request limit per time window',
    example: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-09-18T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/api/v1/products/search',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;
}
