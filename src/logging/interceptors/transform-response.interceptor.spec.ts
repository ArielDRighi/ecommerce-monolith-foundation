/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import {
  TransformResponseInterceptor,
  createErrorResponse,
  PaginatedResult,
} from './transform-response.interceptor';

// Mock correlation ID middleware
jest.mock('../middleware/correlation-id.middleware', () => ({
  getCurrentCorrelationId: jest.fn(),
}));

import { getCurrentCorrelationId } from '../middleware/correlation-id.middleware';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<any>;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;
  const mockGetCurrentCorrelationId =
    getCurrentCorrelationId as jest.MockedFunction<
      typeof getCurrentCorrelationId
    >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformResponseInterceptor],
    }).compile();

    interceptor = module.get<TransformResponseInterceptor<any>>(
      TransformResponseInterceptor,
    );

    // Setup default mock
    mockGetCurrentCorrelationId.mockReturnValue('test-correlation-id');

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/test',
          headers: { 'x-correlation-id': 'test-correlation-id' },
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
    };

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform successful response', (done) => {
    const testData = { message: 'success' };
    (mockCallHandler.handle as jest.Mock) = jest.fn(() => of(testData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler as CallHandler,
    );

    result.subscribe((response: any) => {
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.meta).toBeDefined();
      expect(response.meta.statusCode).toBe(200);
      expect(response.meta.version).toBe('1.0.0');
      done();
    });
  });

  it('should handle null data', (done) => {
    (mockCallHandler.handle as jest.Mock) = jest.fn(() => of(null));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler as CallHandler,
    );

    result.subscribe((response: any) => {
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      done();
    });
  });

  it('should handle paginated data', (done) => {
    const paginatedData: PaginatedResult<any> = {
      data: [{ id: 1 }, { id: 2 }],
      total: 10,
      page: 1,
      limit: 2,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false,
    };

    (mockCallHandler.handle as jest.Mock) = jest.fn(() => of(paginatedData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler as CallHandler,
    );

    result.subscribe((response: any) => {
      expect(response.success).toBe(true);
      expect(response.data).toEqual(paginatedData.data);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.total).toBe(10);
      expect(response.pagination.hasNext).toBe(true);
      done();
    });
  });

  it('should handle missing correlation ID', (done) => {
    mockGetCurrentCorrelationId.mockReturnValue(undefined);
    const testData = { message: 'success' };
    (mockCallHandler.handle as jest.Mock) = jest.fn(() => of(testData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler as CallHandler,
    );

    result.subscribe((response: any) => {
      expect(response.success).toBe(true);
      expect(response.meta.correlationId).toBe('unknown');
      done();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct format', () => {
      const error = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: { field: 'value' },
      };

      const meta = {
        timestamp: '2023-01-01T00:00:00.000Z',
        correlationId: 'test-correlation-id',
        path: '/test',
        method: 'GET',
        statusCode: 400,
      };

      const result = createErrorResponse(error, meta);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.meta).toEqual({
        ...meta,
        version: '1.0.0',
      });
    });

    it('should create error response without details', () => {
      const error = {
        code: 'SIMPLE_ERROR',
        message: 'Simple error',
      };

      const meta = {
        timestamp: '2023-01-01T00:00:00.000Z',
        correlationId: 'test-correlation-id',
        path: '/test',
        method: 'POST',
        statusCode: 500,
      };

      const result = createErrorResponse(error, meta);

      expect(result.success).toBe(false);
      expect(result.error?.details).toBeUndefined();
    });
  });
});
