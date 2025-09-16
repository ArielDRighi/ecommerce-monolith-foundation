import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const CORRELATION_ID_KEY = 'correlationId';

/**
 * Generate a new correlation ID
 */
export const generateCorrelationId = (): string => {
  return uuidv4();
};

/**
 * Extract correlation ID from headers
 */
export const extractCorrelationId = (
  headers: Record<string, string | string[]>,
): string => {
  const correlationId =
    headers[CORRELATION_ID_HEADER] ||
    headers[CORRELATION_ID_HEADER.toLowerCase()] ||
    generateCorrelationId();

  return Array.isArray(correlationId) ? correlationId[0] : correlationId;
};

/**
 * Add correlation ID to headers
 */
export const addCorrelationIdToHeaders = (
  headers: Record<string, any>,
  correlationId: string,
): Record<string, any> => {
  return {
    ...headers,
    [CORRELATION_ID_HEADER]: correlationId,
  };
};
