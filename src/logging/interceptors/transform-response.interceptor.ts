import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { getCurrentCorrelationId } from '../middleware/correlation-id.middleware';

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    correlationId: string;
    path: string;
    method: string;
    statusCode: number;
    version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Check if response is already paginated (from our services)
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function isPaginatedResult<T>(obj: unknown): obj is PaginatedResult<T> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;
  return (
    Array.isArray(candidate.data) &&
    typeof candidate.total === 'number' &&
    typeof candidate.page === 'number' &&
    typeof candidate.limit === 'number'
  );
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = getCurrentCorrelationId() || 'unknown';

    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        // Check if data is already paginated
        if (isPaginatedResult(data)) {
          return {
            success: true,
            data: data.data as T,
            meta: {
              timestamp: new Date().toISOString(),
              correlationId,
              path: request.url,
              method: request.method,
              statusCode: response.statusCode,
              version: '1.0.0',
            },
            pagination: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: data.totalPages,
              hasNext: data.hasNext,
              hasPrevious: data.hasPrevious,
            },
          };
        }

        // For non-paginated responses
        return {
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data,
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            path: request.url,
            method: request.method,
            statusCode: response.statusCode,
            version: '1.0.0',
          },
        };
      }),
    );
  }
}

/**
 * Create error response in standard format
 */
export const createErrorResponse = (
  error: {
    code: string;
    message: string;
    details?: any;
  },
  meta: {
    timestamp: string;
    correlationId: string;
    path: string;
    method: string;
    statusCode: number;
  },
): ApiResponse<null> => {
  return {
    success: false,
    error,
    meta: {
      ...meta,
      version: '1.0.0',
    },
  };
};
