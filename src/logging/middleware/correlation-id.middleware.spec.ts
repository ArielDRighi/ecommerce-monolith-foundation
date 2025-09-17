import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
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
});
