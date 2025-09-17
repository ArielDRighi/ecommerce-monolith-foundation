import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { of, throwError } from 'rxjs';
import { RequestResponseInterceptor } from './request-response.interceptor';
import * as correlationMiddleware from '../middleware/correlation-id.middleware';

// Mock the correlation middleware
jest.mock('../middleware/correlation-id.middleware');

describe('RequestResponseInterceptor', () => {
  let interceptor: RequestResponseInterceptor;
  let mockLogger: jest.Mocked<LoggerService>;

  // Mock request object
  const mockRequest = {
    method: 'POST',
    url: '/api/test',
    get: jest.fn(),
    ip: '127.0.0.1',
    connection: { remoteAddress: '192.168.1.1' },
    params: { id: '123' },
    query: { page: '1', limit: '10' },
    body: {
      username: 'testuser',
      password: 'secret123',
      email: 'test@example.com',
    },
  };

  // Mock response object
  const mockResponse = {
    statusCode: 200,
  };

  // Mock execution context
  const createMockContext = (
    req: any = mockRequest,
    res: any = mockResponse,
  ): ExecutionContext => ({
    switchToHttp: jest.fn().mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      getRequest: () => req,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      getResponse: () => res,
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  });

  // Mock call handler
  const mockCallHandler: Partial<CallHandler> = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestResponseInterceptor,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    interceptor = module.get<RequestResponseInterceptor>(
      RequestResponseInterceptor,
    );

    // Setup default mocks
    jest
      .spyOn(correlationMiddleware, 'getCurrentCorrelationId')
      .mockReturnValue('test-correlation-id');
    jest.spyOn(mockRequest, 'get').mockReturnValue('test-user-agent');
    (mockCallHandler.handle as jest.Mock).mockReturnValue(
      of({ message: 'Success' }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Logging', () => {
    it('should log incoming request with all metadata', () => {
      const mockContext = createMockContext();
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith('Incoming request', {
        type: 'REQUEST',
        method: 'POST',
        url: '/api/test',
        userAgent: 'test-user-agent',
        ip: '127.0.0.1',
        correlationId: 'test-correlation-id',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        timestamp: expect.any(String),
        params: { id: '123' },
        query: { page: '1', limit: '10' },
        body: {
          username: 'testuser',
          password: '[REDACTED]',
          email: 'test@example.com',
        },
      });
    });

    it('should use connection remoteAddress when request.ip is not available', () => {
      const requestWithoutIp = {
        ...mockRequest,
        ip: undefined,
      };

      const mockContext = createMockContext(requestWithoutIp);
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: '192.168.1.1',
        }),
      );
    });

    it('should handle missing correlation ID', () => {
      jest
        .spyOn(correlationMiddleware, 'getCurrentCorrelationId')
        .mockReturnValue(undefined);

      const mockContext = createMockContext();
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          correlationId: undefined,
        }),
      );
    });

    it('should handle missing user agent', () => {
      jest.spyOn(mockRequest, 'get').mockReturnValue(undefined);

      const mockContext = createMockContext();
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          userAgent: undefined,
        }),
      );
    });
  });

  describe('Request Body Sanitization', () => {
    it('should sanitize password fields', () => {
      const mockContext = createMockContext();
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: expect.objectContaining({
            password: '[REDACTED]',
          }),
        }),
      );
    });

    it('should sanitize all sensitive fields', () => {
      const requestWithSensitiveData = {
        ...mockRequest,
        body: {
          username: 'testuser',
          password: 'secret123',
          passwordHash: 'hash123',
          token: 'jwt-token',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          authorization: 'Bearer token',
          secret: 'top-secret',
          key: 'api-key',
          apiKey: 'api-key-value',
          normalField: 'normal-value',
        },
      };

      const mockContext = createMockContext(requestWithSensitiveData);
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          body: {
            username: 'testuser',
            password: '[REDACTED]',
            passwordHash: '[REDACTED]',
            token: '[REDACTED]',
            accessToken: '[REDACTED]',
            refreshToken: '[REDACTED]',
            authorization: '[REDACTED]',
            secret: '[REDACTED]',
            key: '[REDACTED]',
            apiKey: '[REDACTED]',
            normalField: 'normal-value',
          },
        }),
      );
    });

    it('should handle null body', () => {
      const requestWithNullBody = {
        ...mockRequest,
        body: null,
      };

      const mockContext = createMockContext(requestWithNullBody);
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          body: null,
        }),
      );
    });

    it('should handle undefined body', () => {
      const requestWithUndefinedBody = {
        ...mockRequest,
        body: undefined,
      };

      const mockContext = createMockContext(requestWithUndefinedBody);
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          body: undefined,
        }),
      );
    });

    it('should handle non-object body', () => {
      const requestWithStringBody = {
        ...mockRequest,
        body: 'string body',
      };

      const mockContext = createMockContext(requestWithStringBody);
      interceptor.intercept(mockContext, mockCallHandler as CallHandler);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          body: 'string body',
        }),
      );
    });
  });

  describe('Response Logging - Success', () => {
    it('should log successful response with duration and size', (done) => {
      const responseData = {
        message: 'Success',
        data: { id: 1, name: 'Test' },
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenCalledWith(
              'Request completed successfully',
              {
                type: 'RESPONSE',
                correlationId: 'test-correlation-id',
                method: 'POST',
                url: '/api/test',
                statusCode: 200,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                duration: expect.stringMatching(/^\d+ms$/),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                responseSize: expect.stringMatching(/^\d+ bytes$/),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                timestamp: expect.any(String),
              },
            );
            done();
          },
        });
    });

    it('should calculate response size for string data', (done) => {
      const stringResponse = 'Hello World';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringResponse));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenCalledWith(
              'Request completed successfully',
              expect.objectContaining({
                responseSize: '11 bytes', // "Hello World" is 11 bytes
              }),
            );
            done();
          },
        });
    });

    it('should calculate response size for null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenCalledWith(
              'Request completed successfully',
              expect.objectContaining({
                responseSize: '0 bytes',
              }),
            );
            done();
          },
        });
    });

    it('should calculate response size for undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenCalledWith(
              'Request completed successfully',
              expect.objectContaining({
                responseSize: '0 bytes',
              }),
            );
            done();
          },
        });
    });

    it('should handle response size calculation for circular references', (done) => {
      const circularData: any = { name: 'test' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      circularData.self = circularData;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(circularData));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenCalledWith(
              'Request completed successfully',
              expect.objectContaining({
                responseSize: '0 bytes',
              }),
            );
            done();
          },
        });
    });
  });

  describe('Response Logging - Error', () => {
    it('should log error response with error details', (done) => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(error));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          error: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.error).toHaveBeenCalledWith('Request failed', {
              type: 'ERROR_RESPONSE',
              correlationId: 'test-correlation-id',
              method: 'POST',
              url: '/api/test',
              statusCode: 200,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              duration: expect.stringMatching(/^\d+ms$/),
              error: {
                name: 'Error',
                message: 'Test error',
                stack: 'Error stack trace',
              },
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              timestamp: expect.any(String),
            });
            done();
          },
        });
    });

    it('should handle error without stack trace', (done) => {
      const error = new Error('Test error');
      error.stack = undefined;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(error));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          error: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Request failed',
              expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error: expect.objectContaining({
                  stack: 'No stack trace',
                }),
              }),
            );
            done();
          },
        });
    });

    it('should handle error without name', (done) => {
      const error: any = { message: 'Test error' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(error));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          error: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Request failed',
              expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error: expect.objectContaining({
                  name: 'Unknown',
                }),
              }),
            );
            done();
          },
        });
    });

    it('should handle error without message', (done) => {
      const error: any = { name: 'CustomError' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(error));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          error: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Request failed',
              expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error: expect.objectContaining({
                  message: 'Unknown error',
                }),
              }),
            );
            done();
          },
        });
    });

    it('should use 500 status code when response status is not available', (done) => {
      const errorResponse = { statusCode: undefined };
      const mockContext = createMockContext(mockRequest, errorResponse);

      const error = new Error('Test error');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(error));

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          error: () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Request failed',
              expect.objectContaining({
                statusCode: 500,
              }),
            );
            done();
          },
        });
    });
  });

  describe('Integration', () => {
    it('should handle complete request-response cycle', (done) => {
      const responseData = { success: true };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      let requestLogged = false;
      let responseLogged = false;

      // Check that both request and response are logged
      const logSpy = jest
        .spyOn(mockLogger, 'log')
        .mockImplementation((message) => {
          if (message === 'Incoming request') {
            requestLogged = true;
          } else if (message === 'Request completed successfully') {
            responseLogged = true;
          }
        });

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            expect(requestLogged).toBe(true);
            expect(responseLogged).toBe(true);
            expect(logSpy).toHaveBeenCalledTimes(2);
            done();
          },
        });
    });

    it('should maintain correlation ID throughout request lifecycle', (done) => {
      const responseData = { success: true };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      const mockContext = createMockContext();

      interceptor
        .intercept(mockContext, mockCallHandler as CallHandler)
        .subscribe({
          next: () => {
            // Check that both request and response logs use the same correlation ID
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenNthCalledWith(
              1,
              'Incoming request',
              expect.objectContaining({
                correlationId: 'test-correlation-id',
              }),
            );
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(mockLogger.log).toHaveBeenNthCalledWith(
              2,
              'Request completed successfully',
              expect.objectContaining({
                correlationId: 'test-correlation-id',
              }),
            );
            done();
          },
        });
    });
  });
});
