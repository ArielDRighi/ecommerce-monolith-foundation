import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import {
  extractCorrelationId,
  addCorrelationIdToHeaders,
} from '../utils/correlation.utils';

// Extend Request interface to include correlation ID
export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

// Create async local storage for correlation ID
export const correlationIdStorage = new AsyncLocalStorage<string>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Extract or generate correlation ID
    const correlationId = extractCorrelationId(
      req.headers as Record<string, string | string[]>,
    );

    // Set correlation ID in response headers
    res.set(addCorrelationIdToHeaders({}, correlationId));

    // Add correlation ID to request for easy access
    (req as RequestWithCorrelationId).correlationId = correlationId;

    // Store correlation ID in async local storage
    correlationIdStorage.run(correlationId, () => {
      next();
    });
  }
}

/**
 * Get current correlation ID from async local storage
 */
export const getCurrentCorrelationId = (): string | undefined => {
  return correlationIdStorage.getStore();
};

/**
 * Get correlation ID from request object
 */
export const getCorrelationIdFromRequest = (
  req: RequestWithCorrelationId,
): string => {
  return req.correlationId || '';
};
