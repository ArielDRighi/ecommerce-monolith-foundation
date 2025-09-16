import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  getCurrentCorrelationId,
  RequestWithCorrelationId,
} from '../middleware/correlation-id.middleware';

@Injectable()
export class RequestResponseInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context
      .switchToHttp()
      .getRequest<RequestWithCorrelationId>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = getCurrentCorrelationId();

    // Extract request metadata
    const requestMetadata = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      correlationId,
      timestamp: new Date().toISOString(),
      params: request.params,
      query: request.query,
      body: this.sanitizeRequestBody(
        request.body as Record<string, unknown> | null | undefined,
      ),
    };

    // Log incoming request
    this.logger.log('Incoming request', {
      type: 'REQUEST',
      ...requestMetadata,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseSize = this.calculateResponseSize(data);

          // Log successful response
          this.logger.log('Request completed successfully', {
            type: 'RESPONSE',
            correlationId,
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            responseSize: `${responseSize} bytes`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          // Log error response
          this.logger.error('Request failed', {
            type: 'ERROR_RESPONSE',
            correlationId,
            method: request.method,
            url: request.url,
            statusCode: response.statusCode || 500,
            duration: `${duration}ms`,
            error: {
              name: error.name || 'Unknown',
              message: error.message || 'Unknown error',
              stack: error.stack || 'No stack trace',
            },
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(
    body: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null | undefined {
    if (!body || typeof body !== 'object') {
      return body;
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

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Calculate approximate response size
   */
  private calculateResponseSize(data: any): number {
    if (data === null || data === undefined) {
      return 0;
    }

    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }

    if (typeof data === 'object') {
      try {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      } catch {
        return 0;
      }
    }

    return 0;
  }
}
