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
});
