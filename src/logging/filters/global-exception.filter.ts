import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getCurrentCorrelationId } from '../middleware/correlation-id.middleware';
import { createErrorResponse } from '../interceptors/transform-response.interceptor';

interface ErrorInfo {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = getCurrentCorrelationId() || 'unknown';

    // Determine status code and error details
    const errorInfo = this.extractErrorInfo(exception);
    const { statusCode, code, message, details } = errorInfo;

    // Create sanitized error details for logging
    const errorContext = {
      correlationId,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      statusCode,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
      params: request.params,
      headers: this.sanitizeHeaders(request.headers),
    };

    // Log the error with context
    if (statusCode >= 500) {
      // Server errors - log as error with full stack trace
      this.logger.error(`Server Error: ${message}`, {
        error: {
          name: exception instanceof Error ? exception.name : 'Unknown',
          message,
          stack:
            exception instanceof Error
              ? exception.stack
              : 'No stack trace available',
          code,
          details: this.sanitizeErrorDetails(details),
        },
        context: errorContext,
      });
    } else {
      // Client errors - log as warning without stack trace
      this.logger.warn(`Client Error: ${message}`, {
        error: {
          code,
          message,
          details: this.sanitizeErrorDetails(details),
        },
        context: errorContext,
      });
    }

    // Create standardized error response
    const errorResponse = createErrorResponse(
      {
        code,
        message: this.getPublicErrorMessage(statusCode, message),
        details:
          statusCode < 500 ? this.sanitizeErrorDetails(details) : undefined,
      },
      {
        timestamp: new Date().toISOString(),
        correlationId,
        path: request.url,
        method: request.method,
        statusCode,
      },
    );

    response.status(statusCode).json(errorResponse);
  }

  /**
   * Extract error information from various exception types
   */
  private extractErrorInfo(exception: unknown): ErrorInfo {
    // HTTP Exception (NestJS built-in)
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        statusCode: exception.getStatus(),
        code: exception.constructor.name,
        message: exception.message,
        details:
          typeof response === 'object'
            ? (response as Record<string, unknown>)
            : { error: response },
      };
    }

    // Standard Error
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: exception.name || 'InternalServerError',
        message: exception.message || 'Internal server error',
        details: { stack: exception.stack },
      };
    }

    // Unknown exception type
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'UnknownError',
      message: 'An unexpected error occurred',
      details: { originalError: String(exception) },
    };
  }

  /**
   * Get public-safe error message (hide internal details for server errors)
   */
  private getPublicErrorMessage(statusCode: number, message: string): string {
    if (statusCode >= 500) {
      return 'Internal server error. Please try again later.';
    }
    return message;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: any): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'secret',
      'key',
      'apiKey',
    ];

    const sanitized = { ...body } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, unknown> {
    const sanitized = { ...headers } as Record<string, unknown>;
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
      // Also check lowercase versions
      if (header.toLowerCase() in sanitized) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error details to remove sensitive information
   */
  private sanitizeErrorDetails(details: any): unknown {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = { ...details } as Record<string, unknown>;

    // Remove stack traces from client-facing errors
    if ('stack' in sanitized) {
      delete sanitized.stack;
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeErrorDetails(sanitized[key]);
      }
    }

    return sanitized;
  }
}
