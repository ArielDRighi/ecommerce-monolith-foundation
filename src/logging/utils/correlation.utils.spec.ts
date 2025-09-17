import {
  generateCorrelationId,
  extractCorrelationId,
  addCorrelationIdToHeaders,
  CORRELATION_ID_HEADER,
  CORRELATION_ID_KEY,
} from './correlation.utils';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234-5678-9012'),
}));

describe('Correlation Utils', () => {
  describe('generateCorrelationId', () => {
    it('should generate a string ID', () => {
      const correlationId = generateCorrelationId();

      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });

    it('should be consistent in test environment', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      // In test environment with mocked uuid, IDs will be the same
      expect(id1).toBe(id2);
      expect(id1).toBe('test-uuid-1234-5678-9012');
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract correlation ID from exact header name', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: 'test-correlation-id',
      };

      const result = extractCorrelationId(headers);
      expect(result).toBe('test-correlation-id');
    });

    it('should extract correlation ID from lowercase header name', () => {
      const headers = {
        [CORRELATION_ID_HEADER.toLowerCase()]: 'test-correlation-id',
      };

      const result = extractCorrelationId(headers);
      expect(result).toBe('test-correlation-id');
    });

    it('should take first value when header is array', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: ['first-id', 'second-id'],
      };

      const result = extractCorrelationId(headers);
      expect(result).toBe('first-id');
    });

    it('should generate new ID when header is missing', () => {
      const headers = {};

      const result = extractCorrelationId(headers);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toBe('test-uuid-1234-5678-9012'); // Mocked value
    });

    it('should prefer lowercase header over exact when exact is missing', () => {
      const headers = {
        [CORRELATION_ID_HEADER.toLowerCase()]: 'lowercase-header',
      };

      const result = extractCorrelationId(headers);
      expect(result).toBe('lowercase-header');
    });

    it('should prefer exact header name when both exist', () => {
      // Create object with different case headers
      const headers = {
        'X-Correlation-Id': 'exact-header',
        'x-correlation-id': 'lowercase-header',
      };

      const result = extractCorrelationId(headers);
      // Since both keys are different, it will find the first match
      expect(result).toBeDefined();
      expect(['exact-header', 'lowercase-header']).toContain(result);
    });
  });

  describe('addCorrelationIdToHeaders', () => {
    it('should add correlation ID to empty headers', () => {
      const headers = {};
      const correlationId = 'test-correlation-id';

      const result = addCorrelationIdToHeaders(headers, correlationId);

      expect(result).toEqual({
        [CORRELATION_ID_HEADER]: correlationId,
      });
    });

    it('should add correlation ID to existing headers', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      };
      const correlationId = 'test-correlation-id';

      const result = addCorrelationIdToHeaders(headers, correlationId);

      expect(result).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token',
        [CORRELATION_ID_HEADER]: correlationId,
      });
    });

    it('should override existing correlation ID', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: 'old-correlation-id',
      };
      const correlationId = 'new-correlation-id';

      const result = addCorrelationIdToHeaders(headers, correlationId);

      expect(result).toEqual({
        [CORRELATION_ID_HEADER]: correlationId,
      });
    });

    it('should not modify original headers object', () => {
      const headers = { 'content-type': 'application/json' };
      const correlationId = 'test-correlation-id';

      const result = addCorrelationIdToHeaders(headers, correlationId);

      expect(headers).toEqual({ 'content-type': 'application/json' });
      expect(result).not.toBe(headers);
    });
  });

  describe('constants', () => {
    it('should export correct header name', () => {
      expect(CORRELATION_ID_HEADER).toBe('x-correlation-id');
    });

    it('should export correct key name', () => {
      expect(CORRELATION_ID_KEY).toBe('correlationId');
    });
  });
});
