import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<any>;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformResponseInterceptor],
    }).compile();

    interceptor = module.get<TransformResponseInterceptor<any>>(
      TransformResponseInterceptor,
    );

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
});
