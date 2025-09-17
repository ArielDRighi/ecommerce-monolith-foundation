/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from './http-exception.filter';
import { createErrorResponse } from '../interceptors/transform-response.interceptor';
import * as correlationMiddleware from '../middleware/correlation-id.middleware';

// Mock the dependencies
jest.mock('../interceptors/transform-response.interceptor');
jest.mock('../middleware/correlation-id.middleware');

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockLogger: jest.Mocked<LoggerService>;

  // Mock Express request and response objects
  const mockRequest = {
    url: '/api/test',
    method: 'POST',
    ip: '127.0.0.1',
    get: jest.fn(),
    body: { username: 'testuser', password: 'secret123' },
    query: { page: '1' },
    params: { id: '123' },
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  };

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Setup default mocks
    jest
      .spyOn(correlationMiddleware, 'getCurrentCorrelationId')
      .mockReturnValue('test-correlation-id');
    jest.spyOn(mockRequest, 'get').mockReturnValue('test-user-agent');
    (createErrorResponse as jest.Mock).mockReturnValue({
      success: false,
      error: { code: 'TEST_ERROR', message: 'Test error message' },
      metadata: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Errors (5xx)', () => {
    it('should handle 500 Internal Server Error', () => {
      const exception = new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'HTTP Server Error: Internal server error',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'HttpException',
            message: 'Internal server error',
            stack: expect.any(String),
            response: { message: 'Internal server error' },
          }),
          context: expect.objectContaining({
            correlationId: 'test-correlation-id',
            path: '/api/test',
            method: 'POST',
            statusCode: 500,
            ip: '127.0.0.1',
            userAgent: 'test-user-agent',
          }),
        }),
      );

      expect(createErrorResponse).toHaveBeenCalledWith(
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: undefined,
        },
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          path: '/api/test',
          method: 'POST',
          statusCode: 500,
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle 502 Bad Gateway', () => {
      const exception = new HttpException(
        'Bad gateway',
        HttpStatus.BAD_GATEWAY,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'BAD_GATEWAY' }),
        expect.any(Object),
      );
    });

    it('should handle 503 Service Unavailable', () => {
      const exception = new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SERVICE_UNAVAILABLE' }),
        expect.any(Object),
      );
    });

    it('should handle 504 Gateway Timeout', () => {
      const exception = new HttpException(
        'Gateway timeout',
        HttpStatus.GATEWAY_TIMEOUT,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'GATEWAY_TIMEOUT' }),
        expect.any(Object),
      );
    });

    it('should not expose error details for server errors', () => {
      const exception = new HttpException(
        { message: 'Database connection failed', details: 'sensitive info' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ details: undefined }),
        expect.any(Object),
      );
    });
  });

  describe('Client Errors (4xx)', () => {
    it('should handle 400 Bad Request', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'HTTP Client Error: Bad request',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'HttpException',
            message: 'Bad request',
            response: { message: 'Bad request' },
          }),
          context: expect.objectContaining({
            correlationId: 'test-correlation-id',
            statusCode: 400,
          }),
        }),
      );

      expect(createErrorResponse).toHaveBeenCalledWith(
        {
          code: 'BAD_REQUEST',
          message: 'Bad request',
          details: undefined,
        },
        expect.any(Object),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle 401 Unauthorized', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockHost as any);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        }),
        expect.any(Object),
      );
    });

    it('should handle 403 Forbidden', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FORBIDDEN' }),
        expect.any(Object),
      );
    });

    it('should handle 404 Not Found', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOT_FOUND' }),
        expect.any(Object),
      );
    });

    it('should handle 409 Conflict', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CONFLICT' }),
        expect.any(Object),
      );
    });

    it('should handle 422 Unprocessable Entity', () => {
      const exception = new HttpException(
        'Validation failed',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        expect.any(Object),
      );
    });

    it('should handle 429 Too Many Requests', () => {
      const exception = new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
        expect.any(Object),
      );
    });

    it('should handle validation errors with details', () => {
      const validationErrors = [
        'Name is required',
        'Email must be valid',
        'Password must be at least 8 characters',
      ];
      const exception = new HttpException(
        { message: validationErrors, details: { field: 'name' } },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {
            validation: validationErrors,
            details: { field: 'name' },
          },
        }),
        expect.any(Object),
      );
    });
  });

  describe('Error Response Structures', () => {
    it('should handle string error responses', () => {
      const exception = new HttpException(
        'Simple error',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Simple error',
        }),
        expect.any(Object),
      );
    });

    it('should handle object error responses', () => {
      const errorResponse = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        details: { field: 'email' },
      };
      const exception = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CUSTOM_ERROR',
          message: 'Custom error message',
          details: { details: { field: 'email' } },
        }),
        expect.any(Object),
      );
    });

    it('should handle null/undefined error responses', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unknown error',
        }),
        expect.any(Object),
      );
    });

    it('should handle custom status codes', () => {
      const exception = new HttpException('Custom error', 451);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'HTTP_451',
          message: 'Custom error',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Error Message Handling', () => {
    it('should use custom message when available', () => {
      const exception = new HttpException(
        { message: 'Custom validation failed' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom validation failed',
        }),
        expect.any(Object),
      );
    });

    it('should use default messages for server errors', () => {
      const exception = new HttpException(
        { sensitiveDetails: 'database credentials' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error. Please try again later.',
        }),
        expect.any(Object),
      );
    });

    it('should use default messages when no message is provided', () => {
      const exception = new HttpException({}, HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource not found.',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Request Data Sanitization', () => {
    it('should sanitize sensitive fields in request body', () => {
      const mockRequestWithSensitiveData = {
        ...mockRequest,
        body: {
          username: 'testuser',
          password: 'secret123',
          email: 'test@example.com',
          token: 'jwt-token',
          authorization: 'Bearer token',
        },
      };

      const mockHostWithSensitiveData = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequestWithSensitiveData,
          getResponse: () => mockResponse,
        }),
      };

      const exception = new HttpException(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHostWithSensitiveData as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: expect.objectContaining({
            body: expect.objectContaining({
              username: 'testuser',
              password: '[REDACTED]',
              email: 'test@example.com',
              token: '[REDACTED]',
              authorization: '[REDACTED]',
            }),
          }),
        }),
      );
    });

    it('should handle requests without body', () => {
      const mockRequestWithoutBody = {
        ...mockRequest,
        body: undefined,
      };

      const mockHostWithoutBody = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequestWithoutBody,
          getResponse: () => mockResponse,
        }),
      };

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHostWithoutBody as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: expect.objectContaining({
            body: undefined,
          }),
        }),
      );
    });

    it('should handle non-object request bodies', () => {
      const mockRequestWithStringBody = {
        ...mockRequest,
        body: 'string body',
      };

      const mockHostWithStringBody = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequestWithStringBody,
          getResponse: () => mockResponse,
        }),
      };

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHostWithStringBody as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: expect.objectContaining({
            body: undefined,
          }),
        }),
      );
    });
  });

  describe('Correlation ID Handling', () => {
    it('should use correlation ID when available', () => {
      jest
        .spyOn(correlationMiddleware, 'getCurrentCorrelationId')
        .mockReturnValue('custom-correlation-id');

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          correlationId: 'custom-correlation-id',
        }),
      );
    });

    it('should handle missing correlation ID', () => {
      jest
        .spyOn(correlationMiddleware, 'getCurrentCorrelationId')
        .mockReturnValue(undefined);

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          correlationId: 'unknown',
        }),
      );
    });
  });

  describe('Error Code Fallbacks', () => {
    it('should use error field as code when code is not available', () => {
      const exception = new HttpException(
        { error: 'CUSTOM_ERROR_CODE', message: 'Custom error' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CUSTOM_ERROR_CODE',
        }),
        expect.any(Object),
      );
    });

    it('should prefer code over error field', () => {
      const exception = new HttpException(
        {
          code: 'PREFERRED_CODE',
          error: 'SECONDARY_CODE',
          message: 'Custom error',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as any);

      expect(createErrorResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PREFERRED_CODE',
        }),
        expect.any(Object),
      );
    });
  });
});
