import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

interface MockLogger {
  error: jest.Mock;
  warn: jest.Mock;
  log: jest.Mock;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;
  let mockLogger: MockLogger;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: { 'x-correlation-id': 'test-correlation-id' },
      ip: '127.0.0.1',
      body: {},
      query: {},
      params: {},
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Test error',
          code: 'HttpException',
        }) as object,
        meta: expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          path: '/test',
          method: 'GET',
        }) as object,
      }),
    );
  });

  it('should handle generic Error correctly', () => {
    const exception = new Error('Generic error');

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should handle request without correlation id', () => {
    mockRequest.headers = {};
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should log the error with winston', () => {
    const exception = new Error('Test error');

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should handle server errors (status >= 500) with error logging', () => {
    const exception = new HttpException(
      'Server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Server Error:'),
      expect.objectContaining({
        error: expect.objectContaining({
          name: 'HttpException',
          stack: expect.any(String),
        }),
      }),
    );
  });

  it('should handle client errors (status < 500) with warning logging', () => {
    const exception = new HttpException('Client error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Client Error:'),
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'HttpException',
          message: 'Client error',
        }),
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const responseObj = {
      message: 'Validation failed',
      errors: ['field required'],
    };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: expect.objectContaining({
            message: 'Validation failed',
            errors: expect.objectContaining({
              '0': 'field required',
            }),
          }),
        }),
      }),
    );
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Simple error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: { error: 'Simple error' },
        }),
      }),
    );
  });

  it('should handle Error instance with name and stack', () => {
    const error = new Error('Custom error');
    error.name = 'CustomError';

    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Server Error:'),
      expect.objectContaining({
        error: expect.objectContaining({
          name: 'CustomError',
          stack: expect.any(String),
        }),
      }),
    );
  });

  it('should handle unknown exception type', () => {
    const unknownException = { weird: 'object' };

    filter.catch(unknownException, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Server Error:'),
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'UnknownError',
          message: 'An unexpected error occurred',
        }),
      }),
    );
  });

  it('should sanitize sensitive data in request body', () => {
    mockRequest.body = {
      username: 'test',
      password: 'secret123',
      creditCard: '1234-5678-9012-3456',
    };

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        context: expect.objectContaining({
          body: expect.objectContaining({
            username: 'test',
            password: '[REDACTED]',
            creditCard: '[REDACTED]',
          }),
        }),
      }),
    );
  });

  it('should hide server error details in public message', () => {
    const exception = new HttpException(
      'Internal database error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal server error. Please try again later.',
        }),
      }),
    );
  });

  it('should preserve client error messages in public response', () => {
    const exception = new HttpException(
      'Field validation failed',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Field validation failed',
        }),
      }),
    );
  });
});
