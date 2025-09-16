import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getCurrentCorrelationId } from '../middleware/correlation-id.middleware';
import { createErrorResponse } from '../interceptors/transform-response.interceptor';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = getCurrentCorrelationId() || 'unknown';

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error details
    const errorDetails = this.extractErrorDetails(exceptionResponse);

    // Create request context for logging
    const requestContext = {
      correlationId,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      statusCode: status,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
      params: request.params,
    };

    // Log based on error severity
    if (status >= 500) {
      this.logger.error(`HTTP Server Error: ${exception.message}`, {
        error: {
          name: exception.name,
          message: exception.message,
          stack: exception.stack,
          response: errorDetails,
        },
        context: requestContext,
      });
    } else if (status >= 400) {
      this.logger.warn(`HTTP Client Error: ${exception.message}`, {
        error: {
          name: exception.name,
          message: exception.message,
          response: errorDetails,
        },
        context: requestContext,
      });
    }

    // Create standardized error response
    const errorResponse = createErrorResponse(
      {
        code: this.getErrorCode(status, errorDetails),
        message: this.getErrorMessage(status, errorDetails),
        details: this.getErrorDetails(status, errorDetails),
      },
      {
        timestamp: new Date().toISOString(),
        correlationId,
        path: request.url,
        method: request.method,
        statusCode: status,
      },
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Extract error details from HTTP exception response
   */
  private extractErrorDetails(response: any): Record<string, unknown> {
    if (typeof response === 'string') {
      return { message: response };
    }

    if (typeof response === 'object' && response !== null) {
      return response as Record<string, unknown>;
    }

    return { message: 'Unknown error' };
  }

  /**
   * Get error code for response
   */
  private getErrorCode(
    status: number,
    errorDetails: Record<string, unknown>,
  ): string {
    // Use error code from response if available
    if (errorDetails.error && typeof errorDetails.error === 'string') {
      return errorDetails.error;
    }

    // Default error codes based on status
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return `HTTP_${status}`;
    }
  }

  /**
   * Get error message for response
   */
  private getErrorMessage(
    status: number,
    errorDetails: Record<string, unknown>,
  ): string {
    // Use message from response if available
    if (errorDetails.message && typeof errorDetails.message === 'string') {
      return errorDetails.message;
    }

    // For server errors, return generic message for security
    if (status >= 500) {
      return 'Internal server error. Please try again later.';
    }

    // Default messages for client errors
    switch (status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Authentication required.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Resource conflict.';
      case 422:
        return 'Validation failed.';
      case 429:
        return 'Too many requests. Please try again later.';
      default:
        return 'An error occurred while processing your request.';
    }
  }

  /**
   * Get error details for response (only for client errors)
   */
  private getErrorDetails(
    status: number,
    errorDetails: Record<string, unknown>,
  ): unknown {
    // Don't expose internal details for server errors
    if (status >= 500) {
      return undefined;
    }

    // Return validation errors or other details for client errors
    const details: Record<string, unknown> = {};

    // Include validation errors
    if (errorDetails.message && Array.isArray(errorDetails.message)) {
      details.validation = errorDetails.message;
    }

    // Include other relevant details
    if (errorDetails.details) {
      details.details = errorDetails.details;
    }

    return Object.keys(details).length > 0 ? details : undefined;
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
}
