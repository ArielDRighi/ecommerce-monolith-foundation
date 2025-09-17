import { Test, TestingModule } from '@nestjs/testing';
import {
  CorrelationIdMiddleware,
  getCurrentCorrelationId,
  getCorrelationIdFromRequest,
  RequestWithCorrelationId,
  correlationIdStorage,
} from './correlation-id.middleware';
import { Request, Response, NextFunction } from 'express';
import * as correlationUtils from '../utils/correlation.utils';

// Mock correlation utils
jest.mock('../utils/correlation.utils');

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  const mockCorrelationUtils = correlationUtils as jest.Mocked<
    typeof correlationUtils
  >;

  const mockRequest = {
    headers: {},
  } as Request;

  const mockResponse = {
    set: jest.fn(),
  } as any as Response;

  const mockNext: NextFunction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdMiddleware],
    }).compile();

    middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);

    jest.clearAllMocks();

    // Setup default mock implementations
    mockCorrelationUtils.extractCorrelationId.mockReturnValue('generated-uuid');
    mockCorrelationUtils.addCorrelationIdToHeaders.mockReturnValue({
      'x-correlation-id': 'generated-uuid',
    });
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should extract and set correlation ID', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockCorrelationUtils.extractCorrelationId).toHaveBeenCalledWith(
        mockRequest.headers,
      );
      expect(
        mockCorrelationUtils.addCorrelationIdToHeaders,
      ).toHaveBeenCalledWith({}, 'generated-uuid');
      expect(mockResponse.set).toHaveBeenCalledWith({
        'x-correlation-id': 'generated-uuid',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve existing correlation ID', () => {
      const existingId = 'existing-correlation-id';
      mockCorrelationUtils.extractCorrelationId.mockReturnValue(existingId);
      mockCorrelationUtils.addCorrelationIdToHeaders.mockReturnValue({
        'x-correlation-id': existingId,
      });

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockCorrelationUtils.extractCorrelationId).toHaveBeenCalledWith(
        mockRequest.headers,
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'x-correlation-id': existingId,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should add correlation ID to request object', () => {
      const correlationId = 'test-correlation-id';
      mockCorrelationUtils.extractCorrelationId.mockReturnValue(correlationId);

      middleware.use(mockRequest, mockResponse, mockNext);

      expect((mockRequest as any).correlationId).toBe(correlationId);
    });
  });

  describe('getCurrentCorrelationId', () => {
    it('should return correlation ID from async local storage', () => {
      const testId = 'test-correlation-id';

      correlationIdStorage.run(testId, () => {
        const result = getCurrentCorrelationId();
        expect(result).toBe(testId);
      });
    });

    it('should return undefined when no correlation ID in storage', () => {
      const result = getCurrentCorrelationId();
      expect(result).toBeUndefined();
    });
  });

  describe('getCorrelationIdFromRequest', () => {
    it('should return correlation ID from request', () => {
      const testId = 'request-correlation-id';
      const requestWithId: RequestWithCorrelationId = {
        correlationId: testId,
      } as RequestWithCorrelationId;

      const result = getCorrelationIdFromRequest(requestWithId);
      expect(result).toBe(testId);
    });

    it('should return empty string when no correlation ID in request', () => {
      const requestWithoutId: RequestWithCorrelationId =
        {} as RequestWithCorrelationId;

      const result = getCorrelationIdFromRequest(requestWithoutId);
      expect(result).toBe('');
    });

    it('should return empty string when correlation ID is undefined', () => {
      const requestWithUndefined: RequestWithCorrelationId = {
        correlationId: undefined,
      } as RequestWithCorrelationId;

      const result = getCorrelationIdFromRequest(requestWithUndefined);
      expect(result).toBe('');
    });
  });
});
